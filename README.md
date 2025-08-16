# Vastra AI: Weaving Ideas into Reality
Vastra AI is a complete, AI-powered fashion design and discovery platform. It serves as a personal fashion assistant that helps users visualize their ideas, discover new styles, and connect with local fashion services to bring their digital creations to life.

🚀 Live Demo: [https://vastra-ai-weaving-ideas-into-realit.vercel.app/](https://vastra-ai-weaving-ideas-into-realit.vercel.app/)

# ✨ Key Features
🎨 AI Image Generation: The core of the app. Users can type any fashion idea (e.g., "a modern sherwani for a wedding"), and the AI generates a unique, high-quality image of that outfit in seconds.

🌈 AI Color Studio: Analyzes the dominant colors of any design and suggests harmonious color palettes (Complementary, Analogous, etc.) using color theory to inspire new creative directions.

📈 Trending Page: Keeps users inspired with a "Trending" section that automatically scrapes the latest men's and women's fashion designs from Pinterest, ensuring content is always fresh.

🧠 Personalized Recommendations: A Machine Learning model analyzes a user's generated images to build a personal "style profile" and recommends other popular designs from the platform that match their taste.

📍 Find Fashion Services: Utilizes a user's location to display a map of nearby tailors, boutiques, and fabric stores, bridging the gap between digital ideas and physical reality.

👤 User Accounts & Favorites: Users can create an account to save their generated designs. They can also "favorite" any design—whether self-created or from the trending page—to a personal collection.

🌐 Multilingual Support: The entire app, including the AI prompt recognition, functions seamlessly in English, Hindi, Punjabi, and French.

# 🛠️ Tech Stack
# Frontend
React: For building the user interface.

Redux Toolkit: For robust state management.

Tailwind CSS: For modern and responsive styling.

React Leaflet: For interactive maps.

# Backend
Node.js & Express: Powers the main REST API for core application logic.

Python & Flask: Serves the machine learning model for personalized recommendations.

Puppeteer: Used for web scraping the latest trends.

# Machine Learning
Scikit-learn: For building the recommendation model.

Sentence-Transformers: To understand the semantic meaning of user design prompts.

External Services & APIs
Firebase: For user authentication and Firestore as the primary database.

Appwrite: For high-performance image storage.

Gemini API: For state-of-the-art AI image generation.

Google Places API: For sourcing location data for local fashion services.

# 📂 Project Structure
The repository is organized into three main directories:

vastra-ai/
├── client/        # React frontend
├── server/        # Node.js/Express backend API
└── ml-service/    # Python/Flask ML service
🚀 Getting Started
To get a local copy up and running, follow these simple steps.

# Clone the repository:

Bash

git clone https://github.com/your-username/vastra-ai.git
cd vastra-ai
Install Dependencies: Navigate into each directory (client, server, ml-service) and run the installation command.

Bash

# For client and server
npm install

# For ml-service
pip install -r requirements.txt
Set Up Environment Variables: Create a .env file in each of the client, server, and ml-service directories. Copy the contents from the corresponding .env.example file and fill in your API keys and credentials. (See section below).

Run the Services: Open three separate terminal windows and run each service simultaneously.

Bash

# In terminal 1 (from /client)
npm start

# In terminal 2 (from /server)
npm run dev

# In terminal 3 (from /ml-service)
python recommender.py

# 🌟 Future Scope
While Vastra AI is a powerful tool, there's always room to grow. Future enhancements could include:

AI Video Generation: Creating short animations or runway-style videos of the generated designs.

Virtual Try-On: Using AR to allow users to "try on" their creations.

Social Sharing & Community: Features for users to share designs and follow their favorite creators.

E-commerce Integration: Partnering with fabric suppliers and tailors to allow direct ordering through the app.
