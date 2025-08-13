import { query, collection, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; 
import { account, storage } from '../appwriteClient'; 

const fetchInDashboard = (userId, setFetchedDesigns) => {
    if (!userId) {
        setFetchedDesigns([]);
        return () => {}; 
    }

    const q = query(
        collection(db, 'designs'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
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

                const fileId = designData.image.split('/files/')[1].split('/view')[0];
                const viewUrlObject = storage.getFileView('688b88a9002bedeadc4d', fileId);
                return { id: doc.id, ...designData, image: viewUrlObject };
            } catch (error) {
                console.error(`Failed to process doc ${doc.id}`, error);
                return { id: doc.id, ...designData, image: '' };
            }
        });

        setFetchedDesigns(designsData);
    }, (error) => {
        console.error("Firestore snapshot error:", error);
    });

    return unsubscribe; 
};

export default fetchInDashboard;
