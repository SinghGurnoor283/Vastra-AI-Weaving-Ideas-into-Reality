import React, {useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Header from './Header';
import Footer from './Footer';
import L from 'leaflet';
import { useSelector } from 'react-redux';
import { translations } from '../utils/translations';
import ThemeToggler from './ThemeToggler';

const createIcon = (color) => {
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

const icons = {
    tailor: createIcon('blue'),
    boutique: createIcon('red'),
    fabric_store: createIcon('green'),
    fashion_designer: createIcon('purple'),
    embroidery_shop: createIcon('orange'),
    user: createIcon('yellow') 
};

const FindTailor = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [places, setPlaces] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    
    const currentLanguage = useSelector((state) => state.language.currentLanguage);
    const themeMode = useSelector((state) => state.theme.mode);
    const t = translations[currentLanguage];

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setUserLocation({ lat: latitude, lng: longitude });
            },
            (err) => {
                setError(t.couldNotGetLocation);
                setIsLoading(false);
                console.error(err);
            }
        );
    }, [t.couldNotGetLocation]); 

    useEffect(() => {
        if (userLocation) {
            const fetchPlaces = async () => {
                setIsLoading(true);
                setError('');
                try {
                    const response = await fetch(`https://vastra-ai-weaving-ideas-into-reality-kun1.onrender.com/api/nearby-places?lat=${userLocation.lat}&lng=${userLocation.lng}`);

                    if (!response.ok) {
                    throw new Error('Failed to fetch data from the server.');
                    }
                    const data = await response.json();
                    setPlaces(data);
                } catch (err) {
                    setError('Could not find nearby places. Please try again later.');
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPlaces();
        }
    }, [userLocation]);

    const mapTileUrl = themeMode === 'dark' 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const mapAttribution = themeMode === 'dark'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    return (
        <div className={`min-h-screen -mt-4 transition-colors duration-300 ${themeMode === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800'}`}>
            <Header />
            <div className="container mx-auto pt-28 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className={`text-5xl font-bold ${themeMode === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500' : 'text-black'}`}>
                        {t.findFashionServices}
                    </h1>
                    <p className={`mt-4 text-lg max-w-3xl mx-auto ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Discover local boutiques, tailors, and fabric stores to bring your fashion ideas to life.
                    </p>
                </div>
                
                {error && <div className={`p-4 rounded-md mb-4 ${themeMode === 'dark' ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'}`}>{error}</div>}

                {isLoading && !userLocation && (
                    <div className="text-center py-10"><p className="text-gray-400">{t.gettingLocation}</p></div>
                )}

                {userLocation && (
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Map */}
                        <div className={`w-full md:w-2/3 h-[500px] rounded-lg shadow-md overflow-hidden border-2 ${themeMode === 'dark' ? 'border-zinc-800' : 'border-gray-200'}`}>
                            <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url={mapTileUrl} attribution={mapAttribution} />
                                <Marker position={[userLocation.lat, userLocation.lng]} icon={icons.user}>
                                    <Popup>You are here</Popup>
                                </Marker>
                                {places.map(place => (
                                    <Marker 
                                        key={place.place_id} 
                                        position={[place.geometry.location.lat, place.geometry.location.lng]}
                                        icon={icons[place.type] || icons.tailor}
                                    >
                                        <Popup>
                                            <b>{place.name}</b><br />
                                            {place.vicinity}
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </div>
                        {/* List */}
                        <div className={`w-full md:w-1/3 h-[500px] overflow-y-auto p-4 rounded-lg ${themeMode === 'dark' ? 'bg-zinc-900' : 'bg-gray-50 border'}`}>
                             <h2 className={`text-2xl font-bold mb-4 ${themeMode === 'dark' ? 'text-white' : 'text-black'}`}>{t.nearbyPlaces}</h2>
                             <div className="space-y-4">
                                {isLoading ? (
                                    <p className="text-gray-400">{t.searching}</p>
                                ) : (
                                    places.map(place => (
                                        <div key={place.place_id} className={`p-4 rounded-lg ${themeMode === 'dark' ? 'bg-zinc-800' : 'bg-white border'}`}>
                                            <h3 className={`font-bold text-lg ${themeMode === 'dark' ? 'text-white' : 'text-black'}`}>{place.name}</h3>
                                            <p className={`${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{place.vicinity}</p>
                                            <p className="text-yellow-400 font-bold mt-2">{place.rating} ⭐ ({place.user_ratings_total} reviews)</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
            <ThemeToggler />
        </div>
    );
};

export default FindTailor;
