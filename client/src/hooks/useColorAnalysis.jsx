import { useState } from 'react';

export const useColorAnalysis = () => {
    const [colorAnalysis, setColorAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState(null);

    const runAnalysis = async (imageUrl, baseColor = null) => {
        setIsAnalyzing(true);
        setError(null);
        if (!baseColor) {
            setColorAnalysis(null);
        }

        try {
            const payload = { imageUrl };
            if (baseColor) {
                payload.baseColor = baseColor;
            }
            const mlServiceUrl = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5001';
           const response = await fetch(
                `${mlServiceUrl}/analyze-colors`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                }
            );


            if (!response.ok) {
                throw new Error('Color analysis API request failed');
            }

            const data = await response.json();
            console.log("Received color analysis from hook:", data);
            setColorAnalysis(data);
        } catch (err) {
            setError(err.message);
            console.error("Error analyzing colors:", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return { colorAnalysis, isAnalyzing, error, runAnalysis };
};