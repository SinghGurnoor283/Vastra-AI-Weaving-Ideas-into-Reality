import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { db } from '../../firebaseConfig';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { translations } from '../utils/translations';
import ColorStudio from './ColorStudio';
import { useColorAnalysis } from '../hooks/useColorAnalysis';

const RecommendedForYou = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [favoritedIds, setFavoritedIds] = useState(new Set());

    const user = useSelector((store) => store.user);
    const themeMode = useSelector((state) => state.theme.mode);
    const currentLanguage = useSelector((state) => state.language.currentLanguage);
    const t = translations[currentLanguage];

    const { colorAnalysis, isAnalyzing, runAnalysis } = useColorAnalysis();
    
    useEffect(() => {
        if (!user?.uid) {
            setIsLoading(false);
            return;
        }

        const fetchFavorites = async () => {
            const favoritesCol = collection(db, 'users', user.uid, 'favorites');
            const favoriteSnapshot = await getDocs(favoritesCol);
            const favIds = new Set(favoriteSnapshot.docs.map(doc => doc.id));
            setFavoritedIds(favIds);
        };

        const fetchRecommendations = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`https://gurnoors-vastra-ai-final.hf.space/recommendations/${user.uid}`);

                if (!response.ok) {
                    console.warn(`Could not fetch recommendations. Status: ${response.status}`);
                    setRecommendations([]);
                    return;
                }
                const data = await response.json();
                setRecommendations(data);
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecommendations();
        fetchFavorites();
    }, [user]);

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        runAnalysis(imageUrl);
    };

    const handleToggleFavorite = async (e, rec) => {
        e.stopPropagation();

        if (!user?.uid) {
            console.log('Please log in to manage favorites.');
            return;
        }

        const newFavoritedIds = new Set(favoritedIds);
        const favoriteRef = doc(db, 'users', user.uid, 'favorites', rec.id);

        try {
            if (favoritedIds.has(rec.id)) {
                await deleteDoc(favoriteRef);
                newFavoritedIds.delete(rec.id);
            } else {
                await setDoc(favoriteRef, {
                    prompt: rec.prompt,
                    image: rec.image,
                    favoritedAt: new Date(),
                });
                newFavoritedIds.add(rec.id);
            }
            setFavoritedIds(newFavoritedIds);
        } catch (error) {
            console.error('Error updating favorite:', error);
        }
    };

    if (isLoading) {
        return <div className={`text-center p-4 ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading recommendations...</div>;
    }

    if (recommendations.length === 0) {
        return null; 
    }

    return (
        <div className="py-8">
            {selectedImage && (
                <div className="fixed inset-0 z-50 bg-gradient-to-b from-black/90 via-black/85 to-black/90 backdrop-blur-md flex justify-center overflow-y-auto px-4 py-10 sm:py-16">

                    <button
                        className="fixed top-4 right-5 text-white/80 text-5xl font-light z-[51] transition-transform hover:scale-110 hover:text-white"
                        onClick={() => setSelectedImage(null)}
                        aria-label="Close image view"
                    >
                        &times;
                    </button>
                    <div className="w-full max-w-2xl sm:max-w-3xl flex flex-col items-center gap-6 sm:gap-8">
                        <img
                            src={selectedImage}
                            alt="Full view"
                            className="w-full max-w-[75%] sm:max-w-[65%] md:max-w-[55%] h-auto object-contain rounded-xl shadow-2xl border border-white/10"
                        />
                        <p className="text-center text-white/80 text-sm sm:text-base max-w-md">
                            Discover palettes generated with classic color theory principles.
                        </p>

                        <ColorStudio
                            analysis={colorAnalysis}
                            isLoading={isAnalyzing}
                            onBaseColorSelect={runAnalysis}
                            selectedImageUrl={selectedImage}
                        />
                    </div>
                </div>
            )}

            <div className="mb-12">
                <h2 className={`text-4xl font-bold ${themeMode === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500' : 'text-gray-900'}`}>
                    {t.recommendedForYou}
                </h2>
            </div>

            <div className="flex overflow-x-auto space-x-6 pb-4">
                {recommendations.map((rec) => {
                    const isFavorited = favoritedIds.has(rec.id);
                    return (
                        <div
                            key={rec.id}
                            className={`group relative flex-shrink-0 w-[200px] sm:w-[240px] md:w-[280px] lg:w-[300px] aspect-[3/4] rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-all duration-300 ${themeMode === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'}`}
                           
                            onClick={() => handleImageClick(rec.image)}
                        >
                            <img
                                src={rec.image}
                                alt={rec.prompt}
                                className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                            />
                            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-sm text-gray-200 line-clamp-3">{rec.prompt}</p>
                            </div>
                            <button
                                onClick={(e) => handleToggleFavorite(e, rec)}
                                className={`absolute top-3 right-3 p-2 rounded-full transition-all ${isFavorited ? 'bg-red-500/90 text-white' : 'bg-black/40 text-white'} hover:scale-110`}
                            >
                                <svg
                                    className="h-6 w-6"
                                    fill={isFavorited ? 'currentColor' : 'none'}
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z"
                                    />
                                </svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecommendedForYou;