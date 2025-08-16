import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useSelector } from 'react-redux';
import { db } from '../../firebaseConfig';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { translations } from '../utils/translations';
import ThemeToggler from './ThemeToggler';

const SkeletonCard = ({ themeMode }) => (
    <div className={`group relative aspect-[3/4] rounded-xl shadow-lg overflow-hidden animate-pulse ${themeMode === 'dark' ? 'bg-zinc-900' : 'bg-gray-200'}`}>
        <div className={`w-full h-full ${themeMode === 'dark' ? 'bg-zinc-800' : 'bg-gray-300'}`}></div>
    </div>
);

const Trending = () => {
    const [trends, setTrends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    
    const user = useSelector((store) => store.user);
    const themeMode = useSelector((state) => state.theme.mode);
    const currentLanguage = useSelector((state) => state.language.currentLanguage);
    
    const [favoritedIds, setFavoritedIds] = useState(new Set());
    const t = translations[currentLanguage];

    useEffect(() => {
        const fetchTrendsAndFavorites = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('https://vastra-ai-weaving-ideas-into-reality-kun1.onrender.com/api/trends');

                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setTrends(data);

                if (user?.uid) {
                    const favoritesCol = collection(db, 'users', user.uid, 'favorites');
                    const favoriteSnapshot = await getDocs(favoritesCol);
                    const favIds = new Set(favoriteSnapshot.docs.map(doc => doc.id));
                    setFavoritedIds(favIds);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
            setIsLoading(false);
        };
        fetchTrendsAndFavorites();
    }, [user]);

    const handleToggleFavorite = async (e, trend) => {
        e.stopPropagation(); 
        if (!user?.uid) {
            console.log("Please log in to save favorites.");
            return;
        }
        const newFavoritedIds = new Set(favoritedIds);
        const favoriteRef = doc(db, 'users', user.uid, 'favorites', trend.id);
        try {
            if (favoritedIds.has(trend.id)) {
                await deleteDoc(favoriteRef);
                newFavoritedIds.delete(trend.id);
            } else {
                await setDoc(favoriteRef, {
                    prompt: trend.description,
                    image: trend.imageUrl,
                    favoritedAt: new Date(),
                });
                newFavoritedIds.add(trend.id);
            }
            setFavoritedIds(newFavoritedIds);
        } catch (error) {
            console.error("Error updating favorite:", error);
        }
    };

    return (
        <div className={`min-h-screen -mt-4 transition-colors duration-300 ${themeMode === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800'}`}>
            <Header />
            {selectedImage && (
                <div className="fixed inset-0 z-[100] bg-black bg-opacity-90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                    <button className="absolute top-5 right-5 text-white text-4xl font-bold z-50" onClick={() => setSelectedImage(null)}>&times;</button>
                    <img src={selectedImage} alt="Full view" className="max-w-[95vw] max-h-[95vh] object-contain rounded-xl shadow-2xl" />
                </div>
            )}
            <div className="container mx-auto pt-22 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className={`text-5xl font-bold ${themeMode === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500' : 'text-gray-900'}`}>{t.discoverLatestTrends}</h1>
                    <p className={`mt-4 text-lg max-w-3xl mx-auto ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t.discoverSubheading}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} themeMode={themeMode} />)
                    ) : (
                        trends.map((trend) => {
                            const isFavorited = favoritedIds.has(trend.id);
                            return (
                                <div key={trend.id} className={`group relative aspect-[3/4] rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-transform duration-300 ${themeMode === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'}`} onClick={() => setSelectedImage(trend.imageUrl)}>
                                    <img src={trend.imageUrl} alt={trend.description} className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110" />
                                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"><p className="text-sm text-gray-200 line-clamp-3">{trend.description}</p></div>
                                    <button onClick={(e) => handleToggleFavorite(e, trend)} className={`absolute top-3 right-3 p-2 rounded-full transition-all ${isFavorited ? 'bg-red-500/90 text-white' : 'bg-black/40 text-white'} hover:scale-110 group-hover:opacity-100`} aria-label="Toggle favorite">
                                        <svg className="h-6 w-6" fill={isFavorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            <Footer />
            <ThemeToggler />
        </div>
    );
};

export default Trending;
