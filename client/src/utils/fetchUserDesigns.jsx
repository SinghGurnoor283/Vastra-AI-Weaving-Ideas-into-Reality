import { query, collection, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
import { account, storage } from '../appwriteClient'; 

const fetchUserDesigns = (userId, setUserDesigns) => {
    if (!userId) {
        setUserDesigns([]);
        return () => {}; 
    }

    const q = query(
        collection(db, 'designs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => { //nSnapshot is a real-time listener method provided by Firestore..A read-only view of the data at a specific moment, delivered to you by Firestore whenever the data that matches your query changes (and also once immediately with the current data). ..... QuerySnapshot (if you listen to a collection).
        try {
            await account.get();
        } catch (e) {
            console.error("Appwrite session not ready when onSnapshot fired.", e);
        }

        const designsData = querySnapshot.docs.map((doc) => {
            const designData = doc.data();
            try {
                if (!designData.image || !designData.image.includes('/files/')) {
                    throw new Error("Invalid image URL in Firestore.");
                }

                const fileId = designData.image.split('/files/')[1].split('/view')[0]; // Split after /files/ → "<fileId>/view?….. "Then split before /view → "<fileId>". It is to get file id
                const viewUrlObject = storage.getFileView('688b88a9002bedeadc4d', fileId);
                return { id: doc.id, ...designData, image: viewUrlObject };
            } catch (error) {
                console.error(`Failed to process doc ${doc.id}`, error);
                return { id: doc.id, ...designData, image: '' };
            }
        });

        setUserDesigns(designsData);
    }, (error) => {
        console.error("Firestore snapshot error:", error);
    });

    return unsubscribe; 
};

export default fetchUserDesigns;
