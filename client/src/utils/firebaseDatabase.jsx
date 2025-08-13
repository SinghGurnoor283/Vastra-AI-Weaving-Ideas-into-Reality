import { db } from '../../firebaseConfig'; 
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export const saveDesignToFirestore = async (userId, design) => {
  try {
    const designRef = collection(db, "users", userId, "designs");
    const q = query(
      designRef,
      where("prompt", "==", design.prompt),
      where("image", "==", design.image)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return; // Already exists

    await addDoc(designRef, design);
  } catch (err) {
    console.error("❌ Error saving design:", err);
  }
};
