import { saveDesignToAppWrite } from './saveDesignToAppWrite';

const generatePhotos = async (prompt, user) => {
    try {
        const response = await fetch('http://localhost:5000/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
        });

        const data = await response.json();

        if (data?.image) {
            const fullImage = "data:image/png;base64," + data.image;
            const newDesign = { prompt, image: fullImage };

            if (user?.uid) {
                await saveDesignToAppWrite(user.uid, newDesign);
                return { success: true, message: 'Image saved successfully.' };
            } else {
                return { success: false, message: 'User not logged in.' };
            }
        } else {
            return { success: false, message: 'Failed to generate image. Try again.' };
        }
    } catch (error) {
        console.error("❌ Error generating image:", error);
        return { success: false, message: 'Something went wrong while generating image.' };
    }
};
export default generatePhotos;
