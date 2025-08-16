from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from collections import Counter
import numpy as np
from PIL import Image
import requests
from io import BytesIO
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import math
import threading
import time
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import os

# Redirect Hugging Face cache to a writable location
os.environ["HF_HOME"] = "/tmp/huggingface"
os.makedirs("/tmp/huggingface", exist_ok=True)

from sentence_transformers import SentenceTransformer

model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


import json

from colormath.color_objects import sRGBColor, HSLColor
from colormath.color_conversions import convert_color



service_account_str = os.environ["SERVICE_ACCOUNT_KEY"]

service_account_info = json.loads(service_account_str)

service_account_info['private_key'] = service_account_info['private_key'].replace('\\n', '\n')

cred = credentials.Certificate(service_account_info)
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()
print("Firebase Admin Initialized for ML Service.")

print("Loading sentence transformer...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Sentence transformer loaded.")


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173","https://vastra-ai-weaving-ideas-into-realit.vercel.app/"]}})

def create_requests_session():
    session = requests.Session()
    retry = Retry(total=3, read=3, connect=3, backoff_factor=0.3, status_forcelist=(500, 502, 503, 504))
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    return session

def hex_to_rgb(hex_color):
    """Converts a hex color string (#RRGGBB) to an RGB tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    """Converts an RGB tuple (0-255) to a hex string."""
    r, g, b = rgb
    return '#%02x%02x%02x' % (int(round(r)), int(round(g)), int(round(b)))

def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))

def extract_color_features(session, image_url, n_colors=5):
    """
    Downloads image, runs KMeans on pixels and returns:
      - centers: ndarray shape (n_colors, 3) in 0-255 space
      - counts: ndarray (n_colors,) cluster sizes
    """
    try:
        response = session.get(image_url, timeout=15)
        response.raise_for_status()

        img = Image.open(BytesIO(response.content)).convert("RGB").resize((150, 150))
        pixels = np.array(img).reshape(-1, 3).astype(float)  # values 0-255
        if pixels.size == 0:
            return None, None

        k = min(n_colors, len(np.unique(pixels, axis=0)))
        if k < 1: return None, None # handle images with 0 or 1 color
        
        kmeans = KMeans(n_clusters=k, random_state=42, n_init='auto').fit(pixels)
        centers = kmeans.cluster_centers_
        labels = kmeans.labels_

        unique, counts = np.unique(labels, return_counts=True)
        counts_full = np.zeros(k, dtype=int)
        counts_full[unique] = counts

        return centers, counts_full

    except Exception as e:
        print(f"❌ Error processing image {image_url}: {e}")
        return None, None


# Below is used to pick best base color & manipulate HSL
def rgb_to_hsl_tuple(rgb):
    """rgb in 0-255 -> returns HSLColor object"""
    srgb = sRGBColor(rgb[0], rgb[1], rgb[2], is_upscaled=True)
    hsl = convert_color(srgb, HSLColor)
    return hsl  

def hsl_to_rgb_tuple(hsl_color):
    """HSLColor -> returns RGB tuple in 0-255"""
    srgb = convert_color(hsl_color, sRGBColor)
    vals = srgb.get_value_tuple()  # values 0..1
    return (clamp(vals[0]) * 255.0, clamp(vals[1]) * 255.0, clamp(vals[2]) * 255.0)

def is_neutral(hsl_color, sat_thresh=0.08):
    """True if color is near gray (low saturation)"""
    return hsl_color.hsl_s < sat_thresh

def pick_representative_base_color(centers, counts):
    """
    Picks a base color by balancing its dominance (cluster size) and
    vibrancy (saturation and chroma).
    """
    total = counts.sum() if counts.sum() > 0 else 1
    best_idx = 0
    best_score = -1.0

    for i, rgb in enumerate(centers):
        cluster_fraction = counts[i] / total
        hsl = rgb_to_hsl_tuple(rgb)
        sat = hsl.hsl_s
        light = hsl.hsl_l
        r, g, b = [c / 255.0 for c in rgb]
        chroma = max(r, g, b) - min(r, g, b)
        mid_light_factor = 1 - abs(0.5 - light) * 2  # favor mid tones
        score = cluster_fraction * chroma * (sat + 0.02) * max(0.0, mid_light_factor)

        neutral = is_neutral(hsl)
        if neutral:
            score *= 0.3

        if counts[i] < max(1, total * 0.02):
            score *= 0.6

        if score > best_score:
            best_score = score
            best_idx = i

    chosen_rgb = tuple(float(x) for x in centers[best_idx])
    return chosen_rgb


def adjust_hsl(hsl_color, target_l=None, min_l=0.32, max_l=0.62, min_s=0.18):
    """
    Normalize saturation & lightness for visibility.
    """
    h = hsl_color.hsl_h % 360
    s = clamp(hsl_color.hsl_s, 0.0, 1.0)
    l = clamp(hsl_color.hsl_l, 0.0, 1.0)

    if target_l is not None:
        l = clamp(target_l, 0.0, 1.0)
    else:
        if l < min_l:
            l = min_l + (l * (min_l))
        elif l > max_l:
            l = max_l - ((1 - l) * (1 - max_l))

    if s < min_s:
        s = min_s + s * (1 - min_s)

    return HSLColor(h, s, l)


def make_color_from_hue(base_hsl, hue_shift):
    """Return RGB tuple (0-255) for a color with hue shifted from base_hsl."""
    new_h = (base_hsl.hsl_h + hue_shift) % 360
    new_hsl = HSLColor(new_h, base_hsl.hsl_s, base_hsl.hsl_l)
    return hsl_to_rgb_tuple(new_hsl)


def make_tint_shade(rgb_tuple, tint_factor=0.6, shade_factor=0.65):
    """
    Create tint (towards white) and shade (towards black).
    Returns (tint_hex, original_hex, shade_hex)
    """
    r, g, b = [int(round(x)) for x in rgb_tuple]
    tint = (int(round(r + (255 - r) * tint_factor)),
            int(round(g + (255 - g) * tint_factor)),
            int(round(b + (255 - b) * tint_factor)))
    shade = (int(round(r * shade_factor)),
             int(round(g * shade_factor)),
             int(round(b * shade_factor)))

    return rgb_to_hex(tint), rgb_to_hex((r, g, b)), rgb_to_hex(shade)


#  Color Analysis Logic 
def get_harmonious_palettes_from_base(base_rgb):
    """
    Given base_rgb (0-255 tuple), generate harmonious palettes.
    Returns a dictionary where each key is a harmony type and each value
    is a list of hex color strings.
    """
    try:
        base_hsl = rgb_to_hsl_tuple(base_rgb)
        base_hsl = adjust_hsl(base_hsl)

        def palette_for_hues(hue_shifts):
            result = []
            for hs in hue_shifts:
                rgb = make_color_from_hue(base_hsl, hs)
                result.append(make_tint_shade(rgb))
            return result

        palettes = {
            "complementary": palette_for_hues([180]),
            "analogous": palette_for_hues([30, -30]),
            "triadic": palette_for_hues([120, -120]),
            "split_complementary": palette_for_hues([150, 210]),
            "tetradic": palette_for_hues([90, 180, 270]),
            "monochromatic": []
        }

        # Monochromatic: lighter and darker versions of the same
        for lit in (0.75, 0.45):
            mono = HSLColor(base_hsl.hsl_h, base_hsl.hsl_s, lit)
            rgb = hsl_to_rgb_tuple(mono)
            palettes["monochromatic"].append(make_tint_shade(rgb))

        structured = {}
        for key, entries in palettes.items():
            structured[key] = []
            for t, o, s in entries:
                structured[key].append({"tint": t, "original": o, "shade": s})

        return structured

    except Exception as e:
        print(f"❌ Error calculating palettes: {e}")
        return {}


# Endpoints
@app.route('/recluster', methods=['POST'])
def trigger_recluster():
    print("\nReceived request to /recluster. Starting background task.")
    thread = threading.Thread(target=run_clustering_task)
    thread.start()
    return jsonify({"message": "Clustering process started in the background."}), 202


@app.route('/analyze-colors', methods=['POST'])
def analyze_colors():
    data = request.get_json()
    image_url = data.get('imageUrl')
    user_base_color_hex = data.get('baseColor')

    if not image_url:
        return jsonify({"error": "imageUrl is required"}), 400

    print(f"\nReceived color analysis request for: {image_url}")
    http_session = create_requests_session()

    centers, counts = extract_color_features(http_session, image_url, n_colors=6)
    if centers is None or counts is None:
        return jsonify({"error": "Could not process the image."}), 500

    order = np.argsort(-counts)
    centers_sorted = centers[order]
    dominant_palette_hex = [rgb_to_hex(tuple(c)) for c in centers_sorted]

    if user_base_color_hex:
        print(f"Using user-provided base color: {user_base_color_hex}")
        
        base_rgb = hex_to_rgb(user_base_color_hex)
    else:
        print("No user color provided, picking representative base color automatically.")
       
        base_rgb = pick_representative_base_color(centers, counts)

    suggested_palettes = get_harmonious_palettes_from_base(base_rgb)

    response_data = {
        "dominantPalette": dominant_palette_hex,
        "suggestedPalettes": suggested_palettes,
        "baseColor": rgb_to_hex(base_rgb)
    }

    return jsonify(response_data)


@app.route('/recommendations/<string:user_id>', methods=['GET'])
def get_recommendations(user_id):
    print(f"\nReceived recommendation request for user: {user_id}")
    try:
        designs_ref = db.collection('designs')
        user_designs_query = designs_ref.where('userId', '==', user_id).get()

        user_style_ids, user_design_ids = [], set()
        for doc in user_designs_query:
            design_data = doc.to_dict()
            user_design_ids.add(doc.id)
            if 'styleId' in design_data:
                user_style_ids.append(design_data['styleId'])

        if not user_style_ids:
            print("User has no styles. Fetching general trends as fallback.")
            trends_ref = db.collection('trends')
            trends_query = trends_ref.order_by('scrapedAt', direction=firestore.Query.DESCENDING).limit(3).get()
            recommendations = [{'id': doc.id, 'image': doc.to_dict().get('imageUrl'), 'prompt': doc.to_dict().get('description')} for doc in trends_query]
            return jsonify(recommendations)

        style_counter = Counter(user_style_ids)
        top_styles = style_counter.most_common(2)
        print(f"User's top styles are: {top_styles}")

        recommendations = []
        recommended_ids = set(user_design_ids)

        if len(top_styles) > 0:
            favorite_style_id = top_styles[0][0]
            recs_query = designs_ref.where('styleId', '==', favorite_style_id).limit(5).get()
            for doc in recs_query:
                if doc.id not in recommended_ids:
                    rec_data = doc.to_dict()
                    recommendations.append({'id': doc.id, 'image': rec_data.get('image'), 'prompt': rec_data.get('prompt')})
                    recommended_ids.add(doc.id)

        if len(recommendations) < 3 and len(top_styles) > 1:
            second_favorite_style_id = top_styles[1][0]
            recs_query = designs_ref.where('styleId', '==', second_favorite_style_id).limit(5).get()
            for doc in recs_query:
                if doc.id not in recommended_ids and len(recommendations) < 3:
                    rec_data = doc.to_dict()
                    recommendations.append({'id': doc.id, 'image': rec_data.get('image'), 'prompt': rec_data.get('prompt')})
                    recommended_ids.add(doc.id)

        if len(recommendations) < 3:
            print("Not enough personalized recommendations. Adding general trends as fallback.")
            trends_ref = db.collection('trends')
            trends_query = trends_ref.order_by('scrapedAt', direction=firestore.Query.DESCENDING).limit(3 - len(recommendations)).get()
            for doc in trends_query:
                trend_data = doc.to_dict()
                recommendations.append({'id': f"trend_{doc.id}", 'image': trend_data.get('imageUrl'), 'prompt': trend_data.get('description')})

        print(f"Found {len(recommendations)} total recommendations.")
        return jsonify(recommendations)

    except Exception as e:
        print(f"❌ An error occurred: {e}")
        return jsonify({"error": "An internal error occurred."}), 500


if __name__ == '__main__':
    def run_clustering_task():
        print("\n--- Starting Background Clustering Task ---")

        http_session = create_requests_session()
        designs_ref = db.collection('designs')
        all_designs_docs = designs_ref.get()
        total_designs = len(all_designs_docs)
        print(f"--- Found {total_designs} total designs to process. ---")

        image_features_list, text_prompts, doc_ids = [], [], []

        for i, doc in enumerate(all_designs_docs):
            print(f"--- Processing image {i + 1} of {total_designs} (ID: {doc.id}) ---")
            data = doc.to_dict()
            image_url, prompt = data.get('image'), data.get('prompt')
            if image_url and prompt:
                if "nyc.cloud.appwrite.io" not in image_url:
                    corrected_url = image_url.replace("cloud.appwrite.io", "nyc.cloud.appwrite.io")
                else:
                    corrected_url = image_url

                features, _ = extract_color_features(http_session, corrected_url)
                if features is not None:
                    image_features_list.append(features.flatten())  # Flatten features for scaler
                    text_prompts.append(prompt)
                    doc_ids.append(doc.id)

        if not image_features_list:
            print("--- Clustering Task: No features extracted. Exiting. ---")
            return

        print(f"--- Clustering Task: Extracted features for {len(image_features_list)} items. ---")

        scaler = StandardScaler()
        image_features_scaled = scaler.fit_transform(image_features_list)

        print("Clustering Task: Creating text embeddings.")
        text_features = model.encode(text_prompts, show_progress_bar=True)
        print("Clustering Task: Text embeddings created")

        combined_features = np.concatenate([image_features_scaled, text_features], axis=1)

        num_samples = len(image_features_list)
        num_clusters = min(max(2, math.ceil(num_samples / 2)), 10)

        if num_samples < num_clusters:
            print(f"Clustering Task: Not enough samples ({num_samples}) to form clusters. Exiting.")
            return

        print(f"Clustering Task: Running K-Means with {num_clusters} clusters")
        kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init='auto').fit(combined_features)

        batch = db.batch()
        for i, doc_id in enumerate(doc_ids):
            doc_ref = designs_ref.document(doc_id)
            batch.update(doc_ref, {'styleId': int(kmeans.labels_[i])})

        batch.commit()
        print("Background Clustering Task Complete")

    app.run(debug=True, port=5001)