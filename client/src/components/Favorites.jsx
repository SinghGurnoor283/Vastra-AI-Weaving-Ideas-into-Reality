import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { db } from '../../firebaseConfig';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import Header from './Header';
import Footer from './Footer';
import { Link } from 'react-router-dom';
import { translations } from '../utils/translations';
import ThemeToggler from './ThemeToggler';

import { useColorAnalysis } from '../hooks/useColorAnalysis';
import ColorStudio from './ColorStudio';

const SkeletonCard = ({ themeMode }) => (
    <div className={`group relative aspect-[3/4] rounded-xl shadow-lg overflow-hidden animate-pulse ${themeMode === 'dark' ? 'bg-zinc-900' : 'bg-gray-200'}`}>
        <div className={`w-full h-full ${themeMode === 'dark' ? 'bg-zinc-800' : 'bg-gray-300'}`}></div>
    </div>
);

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);

    const user = useSelector((store) => store.user);
    const themeMode = useSelector((state) => state.theme.mode);
    const currentLanguage = useSelector((state) => state.language.currentLanguage);
    const t = translations[currentLanguage];

    const { colorAnalysis, isAnalyzing, runAnalysis } = useColorAnalysis();

    useEffect(() => {
        if (!user?.uid) {
            setIsLoading(false);
            setFavorites([]);
            return;
        }

        const favoritesColRef = collection(db, 'users', user.uid, 'favorites');
        
        const unsubscribe = onSnapshot(favoritesColRef, (snapshot) => {
            const favs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFavorites(favs);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching favorites:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        runAnalysis(imageUrl);
    };

    const handleRemoveFavorite = async (e, favoriteId) => {
        e.stopPropagation();
        if (!user?.uid) return;

        const favoriteRef = doc(db, 'users', user.uid, 'favorites', favoriteId);
        try {
            await deleteDoc(favoriteRef);
        } catch (error) {
            console.error("Error removing favorite:", error);
        }
    };

    return (
        <div className={`min-h-screen -mt-4 transition-colors duration-300 hide-scrollbar ${themeMode === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800'}`}>
          
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>
            
            <Header />

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

            <main className="pt-16 md:pt-24">
                <div className="container mx-auto pb-16 px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h1 className={`text-5xl font-bold ${themeMode === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500' : 'text-gray-900'}`}>
                            {t.yourFavorites}
                        </h1>
                        <p className={`mt-4 text-lg max-w-3xl mx-auto ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {t.yourFavoritesSubheading}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {isLoading ? (
                            Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} themeMode={themeMode} />)
                        ) : favorites.length > 0 ? (
                            favorites.map((fav) => (
                                <div 
                                    key={fav.id} 
                                    className={`group relative aspect-[3/4] rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-all duration-300 ${themeMode === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'}`}
                                    // --- 7. UPDATE THE ONCLICK HANDLER ---
                                    onClick={() => handleImageClick(fav.image)}
                                >
                                    <img 
                                        src={fav.image} 
                                        alt={fav.prompt} 
                                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110" 
                                    />
                                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <p className="text-sm text-gray-200 line-clamp-3">{fav.prompt}</p>
                                    </div>
                                    <button
                                        onClick={(e) => handleRemoveFavorite(e, fav.id)}
                                        className="absolute top-3 right-3 p-2 rounded-full bg-red-500/80 text-white hover:scale-110 transition-all"
                                        aria-label="Remove from favorites"
                                    >
                                        <svg
                                            className="h-6 w-6"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-16">
                                <svg className={`mx-auto h-16 w-16 ${themeMode === 'dark' ? 'text-gray-700' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
                                <h3 className={`mt-4 text-xl font-semibold ${themeMode === 'dark' ? 'text-white' : 'text-black'}`}>{t.noFavoritesYet}</h3>
                                <p className={`mt-2 text-base ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{t.noFavoritesSubheading}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
            <ThemeToggler />
        </div>
    );
};

export default Favorites;