import { addDoc, collection } from 'firebase/firestore';
import { storage, ID, Permission, Role, account } from '../appwriteClient';
import { db } from '../../firebaseConfig';
 
 export const saveDesignToAppWrite = async (userId, design) => {
        try {
            const appwriteSession = await account.get();
            if (appwriteSession.$id !== userId) {
                console.log('Session mismatch detected. Please log out and log in again.');
                return;
            }

            const fileId = ID.unique();
            const fileName = `${userId}_${fileId}.png`;
            const base64Data = design.image.split(',')[1];
            const res = await fetch(`data:image/png;base64,${base64Data}`);
            const blob = await res.blob();
            const file = new File([blob], fileName, { type: "image/png" });

            const permissions = [
                Permission.read(Role.any()),
                Permission.write(Role.user(userId)),
                Permission.update(Role.user(userId)),
                Permission.delete(Role.user(userId)),
            ];

            const result = await storage.createFile('688b88a9002bedeadc4d', fileId, file, permissions);
            const imageUrl = `https://nyc.cloud.appwrite.io/v1/storage/buckets/688b88a9002bedeadc4d/files/${result.$id}/view?project=688b883f0016cafe966c`;
            console.log("DEBUG: Storing this URL in Firestore:", imageUrl);

            await addDoc(collection(db, 'designs'), {
                userId,
                prompt: design.prompt,
                image: imageUrl,
                createdAt: new Date(),
            });

        } catch (err) {
            console.error("❌ Upload or Firestore error:", err.message);
        }
};