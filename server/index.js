import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GoogleGenAI, Modality } from "@google/genai";
import axios from 'axios';
import { db } from './firebaseConfig.js';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import 'dotenv/config';
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

app.post('/generate-image', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    });
    const imagePart = result.candidates[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart) {
      res.json({ image: imagePart.inlineData.data });
      axios.post('https://gurnoors-vastra-ai-final.hf.space/recluster')
  .catch(err => console.error("ML reclustering error:", err.message));

    } else {
      res.status(500).json({ error: "Image not generated" });
    }
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

app.get('/api/trends', async (req, res) => {
  try {
    const trendsRef = collection(db, 'trends');
    const q = query(trendsRef, orderBy('scrapedAt', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    const trends = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.scrapedAt?.toDate) {
        trends.push({ id: doc.id, ...data, scrapedAt: data.scrapedAt.toDate().toISOString() });
      } else {
        console.warn(`Doc ${doc.id} missing 'scrapedAt' timestamp`);
      }
    });
    res.json(trends);
  } catch (error) {
    console.error("Error fetching trends:", error);
    res.status(500).json({ message: "Error fetching trends." });
  }
});

app.get('/api/nearby-places', async (req, res) => {
    const { lat, lng } = req.query;
    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY; 

      if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required.' });
  }

  const searchKeywords = {
      tailor: 'tailor',
      boutique: 'boutique',
      fabric_store: 'fabric store'
  };

  const allPlaces = [];
  const placeIds = new Set(); 

  try {
      const searchPromises = Object.entries(searchKeywords).map(async ([type, keyword]) => {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
          const params = {
              location: `${lat},${lng}`,
              radius: 5000,
              keyword: keyword,
              key: GOOGLE_PLACES_API_KEY,
          };
          console.log(`Searching for: ${keyword}`);
          const response = await axios.get(url, { params });
          return response.data.results.map(place => ({ ...place, searchType: type }));
      });

      const resultsByKeyword = await Promise.all(searchPromises);

      resultsByKeyword.flat().forEach(place => {
          if (!placeIds.has(place.place_id)) {
              placeIds.add(place.place_id);
              allPlaces.push(place);
          }
      });
      
      const formattedPlaces = allPlaces.map(place => ({
          place_id: place.place_id,
          name: place.name,
          geometry: {
              location: {
                  lat: place.geometry?.location?.lat ?? null,
                  lng: place.geometry?.location?.lng ?? null,
              }
          },
          vicinity: place.vicinity || 'Address not available',
          rating: place.rating ? place.rating.toFixed(1) : 'N/A',
          user_ratings_total: place.user_ratings_total || 0,
          type: place.searchType 
      }));

      console.log(`Found a total of ${formattedPlaces.length} unique places.`);
      res.json(formattedPlaces);

    } catch (error) {
        console.error("Error fetching data from Google Places API:", error.response?.data || error.message);
        res.status(500).json({ message: 'Failed to fetch data from Google Places API.' });
    }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
