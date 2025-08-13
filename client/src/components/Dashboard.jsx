import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { db } from '../../firebaseConfig';
import {collection,getDocs,query,where,doc,setDoc,deleteDoc} from 'firebase/firestore';
import Header from './Header';
import RecommendedForYou from './RecommendedForYou';
import Footer from './Footer';
import { translations } from '../utils/translations';
import ThemeToggler from './ThemeToggler';

import { useColorAnalysis } from '../hooks/useColorAnalysis';
import ColorStudio from './ColorStudio';


const Dashboard = () => {
    const user = useSelector((store) => store.user);
    const themeMode = useSelector((state) => state.theme.mode);
    const currentLanguage = useSelector((state) => state.language.currentLanguage);
    const t = translations[currentLanguage];

    const [fetchedDesigns, setFetchedDesigns] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [favoritedIds, setFavoritedIds] = useState(new Set());

    const { colorAnalysis, isAnalyzing, runAnalysis } = useColorAnalysis();

    useEffect(() => {
        if (!user) return;

        const fetchDesigns = async () => {
            try {
                const q = query(collection(db, 'designs'), where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);
                const userDesigns = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setFetchedDesigns(userDesigns);
            } catch (error) {
                console.error('Error fetching designs:', error);
            }
        };

        const fetchFavorites = async () => {
            const favoritesCol = collection(db, 'users', user.uid, 'favorites');
            const favoriteSnapshot = await getDocs(favoritesCol);
            const favIds = new Set(favoriteSnapshot.docs.map(doc => doc.id));
            setFavoritedIds(favIds);
        };

        fetchDesigns();
        fetchFavorites();
    }, [user]);

    const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        runAnalysis(imageUrl);
    };

    const handleToggleFavorite = async (e, design) => {
        e.stopPropagation();
        if (!user?.uid) {
            console.log('Please log in to manage favorites.');
            return;
        }

        const newFavoritedIds = new Set(favoritedIds);
        const favoriteRef = doc(db, 'users', user.uid, 'favorites', design.id);

        try {
            if (favoritedIds.has(design.id)) {
                await deleteDoc(favoriteRef);
                newFavoritedIds.delete(design.id);
            } else {
                await setDoc(favoriteRef, {
                    prompt: design.prompt,
                    image: design.image,
                    favoritedAt: new Date(),
                });
                newFavoritedIds.add(design.id);
            }
            setFavoritedIds(newFavoritedIds);
        } catch (error) {
            console.error('Error updating favorite:', error);
        }
    };

    return (
        <div className={`min-h-screen -mt-4 transition-colors duration-300 ${themeMode === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800'}`}>
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

            <div className="container mx-auto pt-20 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-center gap-4 mb-8">
                    {user?.photoURL && (
                        <img
                            src={user.photoURL}
                            alt="User Avatar"
                            className={`w-12 h-12 rounded-full border-2 shadow ${themeMode === 'dark' ? 'border-gray-500' : 'border-gray-300'}`}
                        />
                    )}
                    <h1 className={`text-4xl font-extrabold animate-fade-in ${themeMode === 'dark' ? 'bg-gradient-to-r from-purple-300 to-pink-500 bg-clip-text text-transparent' : 'text-gray-900'}`}>
                        {t.welcomeBackUser.replace('{name}', user?.displayName || 'Guest')} 👋
                    </h1>
                </div>

                <RecommendedForYou />

                <h2 className={`text-4xl font-bold mb-14 mt-20 ${themeMode === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500' : 'text-gray-900'}`}>
                    {t.yourGeneratedDesigns}
                </h2>

                {fetchedDesigns.length === 0 ? (
                    <div className={`text-center mt-12 ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        <p className="text-xl">{t.noDesignsMessage || "You haven't created any designs yet."}</p>
                        <p className="text-sm mt-2">🎨 Start generating and save your favorites!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {fetchedDesigns.map((design) => {
                            const isFavorited = favoritedIds.has(design.id);
                            return (
                                <div
                                    key={design.id}
                                    className={`group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer ${themeMode === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'}`}
                                    
                                    onClick={() => handleImageClick(design.image)}
                                >
                                    <img
                                        src={design.image}
                                        alt={design.prompt}
                                        className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-4 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <p className="text-sm text-white line-clamp-2 drop-shadow">{design.prompt}</p>
                                    </div>
                                    <button
                                        onClick={(e) => handleToggleFavorite(e, design)}
                                        className={`absolute top-3 right-3 p-2 rounded-full transition-all ${isFavorited ? 'bg-red-500/90 text-white' : 'bg-black/40 text-white'} hover:scale-110`}
                                    >
                                        <svg
                                            className="h-6 w-6"
                                            fill={isFavorited ? 'currentColor' : 'none'}
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                                        </svg>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <Footer />
            <ThemeToggler />
        </div>
    );
};

export default Dashboard;