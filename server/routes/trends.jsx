// routes/trends.js
const express = require('express');
const router = express.Router();
// IMPORTANT: Use your CLIENT-side db instance here, not firebase-admin
const { db } = require('../firebaseConfig'); 
const { collection, query, orderBy, limit, getDocs } = require('firebase/firestore');

router.get('/', async (req, res) => {
    try {
        console.log("API: Received request for /api/trends");
        const trendsRef = collection(db, 'trends');
        const q = query(trendsRef, orderBy('scrapedAt', 'desc'), limit(20));
        
        const querySnapshot = await getDocs(q);
        const trends = [];
        querySnapshot.forEach((doc) => {
            trends.push({ id: doc.id, ...doc.data() });
        });

        console.log(`API: Sending ${trends.length} trending items.`);
        res.json(trends);
    } catch (error) {
        console.error("API Error: Error fetching trends:", error);
        res.status(500).json({ message: "Error fetching trends." });
    }
});

module.exports = router;
