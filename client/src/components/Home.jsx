import React, { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import ColorStudio from './ColorStudio'; 

import { useColorAnalysis } from '../hooks/useColorAnalysis';
import Header from './Header';
import Footer from './Footer';
import GeneratingImage from './GeneratingImage';
import ThemeToggler from './ThemeToggler';
import BackgroundPhoto from '../assets/Background.webp';
import { setLoading } from '../utils/imageSlice';
import generatePhotos from '../utils/generatePhotos';
import fetchUserDesigns from '../utils/fetchUserDesigns';
import { translations } from '../utils/translations';
import { db } from '../../firebaseConfig';
import {collection,getDocs,doc,setDoc,deleteDoc} from 'firebase/firestore';
// db: your initialized Firestore instance.
// collection: builds a reference to a Firestore collection (e.g., users/{uid}/favorites).
// getDocs: runs a one-time read query to fetch documents in a collection.
// doc: builds a reference to a single document (e.g., users/{uid}/favorites/{designId}).
// setDoc: creates/overwrites a document (used to add a favorite).
// deleteDoc: deletes a document (used to remove a favorite).
const Home = () => {
    const searchedText = useRef(null);
    const [userDesigns, setUserDesigns] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [isLoadingRecs, setIsLoadingRecs] = useState(true);
    const [selectedImage, setSelectedImage] = useState(null);
    const [favoritedIds, setFavoritedIds] = useState(new Set());  // We can easily delete from set and add, can also serch using .has()
    
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const loading = useSelector((state) => state.image.loading);
    const user = useSelector((store) => store.user);
    const currentLanguage = useSelector((state) => state.language.currentLanguage);
    const themeMode = useSelector((state) => state.theme.mode); 
    const t = translations[currentLanguage];
    const [showCreationAlert, setShowCreationAlert] = useState(false);

     const { colorAnalysis, isAnalyzing, runAnalysis } = useColorAnalysis();
 
    useEffect(() => {
        let intervalId;

        if (searchedText.current) { //searchedText.current points to the input DOM element. just checks:Does the input element exist in the DOM
            if (user) {
                let placeholderIndex = 0;
                searchedText.current.placeholder = t.searchPlaceholder[placeholderIndex]; 
                
                intervalId = setInterval(() => {
                    placeholderIndex = (placeholderIndex + 1) % t.searchPlaceholder.length;
                    if (searchedText.current) {
                       searchedText.current.placeholder = t.searchPlaceholder[placeholderIndex];
                    }
                }, 3000);
            } else {
                searchedText.current.placeholder = "Please log in to generate images";
                
            }
        }
        // If user changes multiple times or we select diff language, multiple intervals would run concurrently → logs “tick” multiple times per second.
        //Cleanup prevents this by stopping the previous interval before starting a new one.
        //Avoid memory leaks and duplicate interval executions
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [user, t.searchPlaceholder]);

    useEffect(() => {
        if (!user?.uid) {
            setIsLoadingRecs(false);
            setUserDesigns([]);
            setRecommendations([]);
            return;
        }

        const unsubscribe = fetchUserDesigns(user?.uid, setUserDesigns);

        const fetchFavorites = async () => {
            const favoritesCol = collection(db, 'users', user.uid, 'favorites');
            const favoriteSnapshot = await getDocs(favoritesCol);
            const favIds = new Set(favoriteSnapshot.docs.map(doc => doc.id)); // storing each design id in a set for efficient lookup using doc.id
            setFavoritedIds(favIds);
        };

        const fetchRecommendations = async () => {
            setIsLoadingRecs(true);
            try {
                const mlServiceUrl = import.meta.env.VITE_ML_SERVICE_URL || 'http://localhost:5001';
                const response = await fetch(`${mlServiceUrl}/recommendations/${user.uid}`);
                if (!response.ok) {
                    setRecommendations([]);
                    return;
                }
                const data = await response.json();
                setRecommendations(data.slice(0, 3));
            } catch (error) {
                console.error("Failed to fetch recommendations:", error);
            } finally {
                setIsLoadingRecs(false);
            }
        };

        fetchRecommendations();
        fetchFavorites();
        
        return () => unsubscribe && unsubscribe();
    }, [user]);


        useEffect(() => {
            if (showCreationAlert) {
                const timer = setTimeout(() => {
                    setShowCreationAlert(false);
                }, 4000); 
                return () => clearTimeout(timer);
            }
        }, [showCreationAlert]);

    const handleToggleFavorite = async (e, design) => {
        e.stopPropagation(); // prevent event bubbling - Prevents the card’s onClick from firing which would have opened the large preview image.
        if (!user?.uid) {
            console.log('Please log in to manage favorites.');
            navigate('/login');
            return;
        }

        const newFavoritedIds = new Set(favoritedIds);
        const favoriteRef = doc(db, 'users', user.uid, 'favorites', design.id); // reference to the document in the favorites collection

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

    const handleSearch = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        const prompt = searchedText.current.value.trim();
        if (!prompt) return;
        dispatch(setLoading(true));
        const result = await generatePhotos(prompt, user);
         if (result.success) {
            setShowCreationAlert(true); 
        } 
        if (!result.success) {
            console.log(result.message);
        }
        dispatch(setLoading(false));
    };


     const handleImageClick = (imageUrl) => {
        setSelectedImage(imageUrl);
        runAnalysis(imageUrl);
    };

    const LoginPrompt = ({ message, icon }) => (
        <div className={`text-center p-10 rounded-lg transition-colors duration-300 ${themeMode === 'dark' ? '' : ''}`}>
            {icon}
            <p className={`mb-4 mt-2 text-lg ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
            <Link to="/login" className={`px-6 py-2 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 ${themeMode === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}>
                Login to Continue
            </Link>
        </div>
    );
    
    const RecommendationSkeleton = () => (
        <div className="overflow-x-auto hide-scrollbar">
            {/*_ is just a placeholder variable name to indicate: “I’m ignoring this parameter*/}
            <div className="flex space-x-6 pb-2">
                {[...Array(3)].map((_, index) => (  
                    <div key={index} className={`group relative w-[300px] flex-shrink-0 aspect-[3/4] rounded-xl shadow-lg animate-pulse ${themeMode === 'dark' ? 'bg-zinc-900' : 'bg-gray-200'}`}>
                        <div className={`w-full h-full ${themeMode === 'dark' ? 'bg-zinc-800' : 'bg-gray-300'}`}></div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen  transition-colors duration-300 ${themeMode === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800'}`}>
            <style>
                {`
                    @keyframes fadeInOut {
                        0%, 100% { opacity: 0; }
                        20%, 80% { opacity: 1; }
                    }
                    .placeholder-animate::placeholder {
                        animation: fadeInOut 3s infinite;
                    }
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .hide-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}
            </style>
            
            <Header />
            
             <div aria-live="polite" aria-atomic="true" className="fixed top-5 right-5 z-[60] w-full sm:w-auto">
                <div className={`transition-all duration-500 ease-in-out ${showCreationAlert ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'}`}>
                    <div className="max-w-sm w-full bg-white dark:bg-zinc-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 dark:ring-white/10 overflow-hidden">
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3 w-0 flex-1 pt-0.5">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.creationSaved}</p>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t.creationSavedSub}</p>
                                </div>
                                <div className="ml-4 flex-shrink-0 flex">
                                    <button onClick={() => setShowCreationAlert(false)} className="bg-white dark:bg-zinc-800 rounded-md inline-flex text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                        <span className="sr-only">Close</span>
                                        &times;
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main>
                {loading && (
                    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
                        <GeneratingImage />
                    </div>
                )}
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



                <div className="relative h-[calc(100vh-50px)] w-full flex items-center justify-center -mt-20">
                    <img src={BackgroundPhoto} alt="Background" className="absolute inset-0 w-full h-full object-cover" />
                    <div className={`absolute inset-0 ${themeMode === 'dark' ? 'bg-black/60' : 'bg-white/30'}`}></div>

                    <div className="relative z-10 flex flex-col items-center text-center px-4">
                        <div className="w-[90vw] sm:w-[85vw] md:w-[70vw] lg:w-[60vw] xl:w-[50vw] bg-black/50 backdrop-blur-md rounded-full p-2 flex items-center ring-1 ring-white/20">
                            <input 
                                ref={searchedText} 
                                type="text" 
                                className="placeholder-animate flex-grow bg-transparent text-white placeholder-gray-400 focus:outline-none px-6 text-base sm:text-lg" 
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                onFocus={() => {
                                    if (!user) navigate("/login"); 
                                }}

                            />
                            <button className="bg-white text-black font-semibold px-6 sm:px-8 py-2 sm:py-3 rounded-full hover:bg-gray-200 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" onClick={handleSearch} disabled={loading || !user}>
                                {t.searchButton}
                            </button>
                        </div>
                        
                        <div className="mt-4 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
                            <p className="text-sm text-gray-300">{t.languageTip}</p>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-20">
                    <section>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                            <h2 className={`text-3xl font-bold ${themeMode === 'dark' ? 'text-white' : 'text-black'}`}>{t.latestCreations}</h2>
                              {user && userDesigns.length > 0 && (
                                <div className="flex items-center mt-2 sm:hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${themeMode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <p className={`text-sm ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t.clickForColorStudio}
                                    </p>
                                </div>
                            )}
                            {user && <Link to="/dashboard" className={`flex items-center font-semibold transition-colors self-start sm:self-center ${themeMode === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>{t.seeAll}<svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg></Link>}
                        </div>
                        {user && userDesigns.length > 0 && (
                            <div className="hidden sm:flex items-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${themeMode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <p className={`text-sm ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t.clickForColorStudio}
                                </p>
                            </div>
                        )}
                        {!user ? (
                            <LoginPrompt 
                                message="Log in to see your creations."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className={`mx-auto h-12 w-12 ${themeMode === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                            />
                        ) : userDesigns.length > 0 ? (
                            <div className="overflow-x-auto hide-scrollbar"><div className="flex space-x-6 pb-2">{userDesigns.map((design) => {
                                const isFavorited = favoritedIds.has(design.id);
                                return (
                                    <div key={design.id} className="group relative min-w-[250px] aspect-[4/5] bg-zinc-900 rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-transform duration-300" onClick={() => handleImageClick(design.image)}>
                                        <img src={design.image} alt={design.prompt} className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110" />
                                        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <p className="text-sm text-gray-200 line-clamp-3">{design.prompt}</p></div>
                                        <button onClick={(e) => handleToggleFavorite(e, design)} className={`absolute top-3 right-3 bg-black/50 p-2 rounded-full transition-colors ${isFavorited ? 'text-red-500' : 'text-white'} hover:bg-black/75`} aria-label="Toggle favorite">
                                            <svg className="h-6 w-6" fill={isFavorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })}</div></div>
                        ) : (<div className="text-center py-10 text-gray-500"><p>Your generated designs will appear here.</p></div>)}
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
                        <section className="lg:col-span-2">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                                <h2 className={`text-3xl font-bold ${themeMode === 'dark' ? 'text-white' : 'text-black'}`}>{t.recommendedForYou}</h2>
                                {user && userDesigns.length > 0 && (
                                <div className="flex items-center mt-2 sm:hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${themeMode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <p className={`text-sm ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t.clickForColorStudio}
                                    </p>
                                </div>
                            )}
                                {user && <Link to="/dashboard" className={`flex items-center font-semibold transition-colors self-start sm:self-center ${themeMode === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}>{t.seeAll}<svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg></Link>}
                            </div>
                            {user && userDesigns.length > 0 && (
                            <div className="hidden sm:flex items-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 ${themeMode === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <p className={`text-sm ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t.clickForColorStudio}
                                </p>
                            </div>
                        )}

                            {!user ? (
                                <LoginPrompt 
                                    message="Log in to get personalized recommendations."
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" className={`mx-auto h-12 w-12 ${themeMode === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                />
                            ) : isLoadingRecs ? (
                                <RecommendationSkeleton />
                            ) : (
                                <div className="overflow-x-auto hide-scrollbar">
                                    <div className="flex space-x-6 pb-2">{recommendations.map((rec) => {
                                    const isFavorited = favoritedIds.has(rec.id);
                                    return (
                                        <div key={rec.id} className={`group relative w-[300px] flex-shrink-0 aspect-[3/4] rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:-translate-y-2 transition-transform duration-300 ${themeMode === 'dark' ? 'bg-zinc-900' : 'bg-gray-100'}`} onClick={() => handleImageClick(rec.image)}>
                                            <img src={rec.image} alt={rec.prompt} className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110" />
                                            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <p className="text-sm text-gray-200 line-clamp-3">{rec.prompt}</p>
                                            </div>
                                            <button onClick={(e) => handleToggleFavorite(e, rec)} className={`absolute top-3 right-3 p-2 rounded-full transition-all ${isFavorited ? 'bg-red-500/90 text-white' : 'bg-black/40 text-white'} hover:scale-110 group-hover:opacity-100`}>
                                                <svg className="h-5 w-5" fill={isFavorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 20.25l-7.682-7.682a4.5 4.5 0 010-6.364z" />
                                                </svg>
                                            </button>
                                        </div>
                                    );
                                })}</div></div>
                            )}
                        </section>
                        
                        <section>
                            <h2 className={`text-3xl font-bold mb-8 ${themeMode === 'dark' ? 'text-white' : 'text-black'}`}>{t.findATailor}</h2>
                            <Link to="/find-tailor" className={`block p-8 h-80 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 text-center hover:scale-105 ${themeMode === 'dark' ? 'bg-zinc-900 hover:shadow-white/10' : 'bg-gray-100'}`}>
                                <svg className={`w-16 mt-14 h-16 mx-auto mb-4 ${themeMode === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <p className={`font-semibold text-lg ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{t.findServicesNearYou}</p>
                            </Link>
                        </section>
                    </div>
                </div>
            </main>

            <Footer/>
            
            <ThemeToggler />
        </div>
    );
};

export default Home;