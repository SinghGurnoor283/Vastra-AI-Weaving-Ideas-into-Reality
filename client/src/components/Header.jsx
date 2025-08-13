import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Globe, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { account } from '../appwriteClient';
import { removeUser } from '../utils/userSlice';
import { setLanguage } from '../utils/languageSlice';
import { translations } from '../utils/translations';
import Logo from '../assets/Logo_AI_Advisor.png';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const menuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const languageMenuRef = useRef(null); 

  const user = useSelector((state) => state.user);
  const currentLanguage = useSelector((state) => state.language.currentLanguage);
  const theme = useSelector((state) => state.theme.mode);
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const t = translations[currentLanguage];
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleNavigate = (path) => {
    setMenuOpen(false);
    setProfileOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await account.deleteSession('current');
      dispatch(removeUser());
      setProfileOpen(false);
      setMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error("❌ Error during logout:", error);
      dispatch(removeUser());
      navigate('/login');
    }
  };

  const handleLanguageChange = (lang) => {
    dispatch(setLanguage(lang));
    setLanguageOpen(false);
  };

  return (
    <header
      className={`sticky top-3 z-50 mt-2.5 mx-3 rounded-2xl sm:rounded-4xl shadow-md transition-colors duration-300 ${
        isHomePage ? 'bg-white' : theme === 'light' ? 'bg-zinc-900' : 'bg-white'
      }`}
    >
      <div className="px-3 py-1 max-w-10xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img src={Logo} alt="Logo" className="h-14 w-14 object-contain" />
          <span
            className={`text-lg font-semibold whitespace-nowrap ${
              isHomePage ? 'text-black' : theme === 'light' ? 'text-white' : 'text-black'
            }`}
          >
            Vastra AI
          </span>
          <span className={`hidden sm:inline text-base ${isHomePage ? 'text-gray-900' : theme === 'light' ? 'text-white' : 'text-gray-900' }`}>
                : Weaving Ideas into Reality
          </span>

        </Link>

        <div
          className={`lg:hidden relative ${
            isHomePage ? 'text-black' : theme === 'light' ? 'text-white' : 'text-black'
          }`}
          ref={menuRef}
        >
          <button onClick={() => setMenuOpen(!menuOpen)} className="focus:outline-none" aria-label="Toggle menu">
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          {menuOpen && (
            <div className="absolute top-full right-0 mt-2 w-64 rounded-xl shadow-lg bg-zinc-900 text-white p-2 z-50">
             
              <div className="flex flex-col space-y-1">
                <Link onClick={() => handleNavigate('/')} to="/" className="block text-left px-3 py-2 rounded-md hover:bg-zinc-700">{t.home}</Link>
                <Link onClick={() => handleNavigate('/trending')} to="/trending" className="block text-left px-3 py-2 rounded-md hover:bg-zinc-700">{t.trendingDresses}</Link>
                <Link onClick={() => handleNavigate('/find-tailor')} to="/find-tailor" className="block text-left px-3 py-2 rounded-md hover:bg-zinc-700">{t.findFashionServices}</Link>
                <hr className="border-zinc-700 my-1" />
                {user ? (
                  <>
                    <Link onClick={() => handleNavigate('/dashboard')} to="/dashboard" className="block text-left px-3 py-2 rounded-md hover:bg-zinc-700">{t.dashboard}</Link>
                    <Link onClick={() => handleNavigate('/favorites')} to="/favorites" className="block text-left px-3 py-2 rounded-md hover:bg-zinc-700">{t.favorites}</Link>
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md hover:bg-zinc-700">{t.logout}</button>
                  </>
                ) : (
                  <Link onClick={() => handleNavigate('/login')} to="/login" className="block text-left px-3 py-2 rounded-md hover:bg-zinc-700">{t.login}</Link>
                )}
                <hr className="border-zinc-700 my-1" />
                <div className="text-sm px-3 pt-2 pb-1 text-zinc-400">Language</div>
                <div className="flex justify-around items-center pt-1 pb-2">
                    <button onClick={() => handleLanguageChange('en')} className={`px-2 py-1 rounded-md text-sm ${currentLanguage === 'en' && 'bg-zinc-700'}`}>EN</button>
                    <button onClick={() => handleLanguageChange('hi')} className={`px-2 py-1 rounded-md text-sm ${currentLanguage === 'hi' && 'bg-zinc-700'}`}>HI</button>
                    <button onClick={() => handleLanguageChange('pa')} className={`px-2 py-1 rounded-md text-sm ${currentLanguage === 'pa' && 'bg-zinc-700'}`}>PA</button>
                    <button onClick={() => handleLanguageChange('fr')} className={`px-2 py-1 rounded-md text-sm ${currentLanguage === 'fr' && 'bg-zinc-700'}`}>FR</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <nav
          className={`hidden lg:flex lg:items-center lg:space-x-6 ${
            isHomePage ? 'text-black' : theme === 'light' ? 'text-white' : 'text-black'
          }`}
        >
          <Link to="/" className="hover:text-gray-700">{t.home}</Link>
          <Link to="/trending" className="hover:text-gray-700">{t.trendingDresses}</Link>
          <Link to="/find-tailor" className="hover:text-gray-500">{t.findFashionServices}</Link>

          <div className="relative" ref={languageMenuRef}>
            <button
              onClick={() => setLanguageOpen(!languageOpen)}
              className="flex items-center focus:outline-none"
            >
              <Globe size={20} />
            </button>
            {languageOpen && (
              <div className="absolute right-0 mt-2 bg-white text-black rounded shadow-lg py-2 w-40 z-50">
                <button onClick={() => handleLanguageChange('en')} className="w-full text-left px-4 py-2 hover:bg-gray-200">English</button>
                <button onClick={() => handleLanguageChange('hi')} className="w-full text-left px-4 py-2 hover:bg-gray-200">हिन्दी</button>
                <button onClick={() => handleLanguageChange('pa')} className="w-full text-left px-4 py-2 hover:bg-gray-200">ਪੰਜਾਬੀ</button>
                <button onClick={() => handleLanguageChange('fr')} className="w-full text-left px-4 py-2 hover:bg-gray-200">Français</button>
              </div>
            )}
          </div>

           {user ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold focus:outline-none border ${
                    theme === 'dark'
                      ? 'bg-zinc-800 text-white border-zinc-700'
                      : 'bg-gray-200 text-black border-gray-300'
                  }`}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </button>
                {profileOpen && (
                  <div
                    className={`absolute right-0 mt-2 rounded-lg shadow-lg py-2 w-48 z-50 border ${
                      theme === 'dark'
                        ? 'bg-zinc-900 text-white border-zinc-800'
                        : 'bg-white text-black border-gray-200'
                    }`}
                  >
                    <button onClick={() => handleNavigate('/dashboard')} className="w-full text-left px-4 py-2 hover:bg-zinc-700">{t.dashboard}</button>
                    <button onClick={() => handleNavigate('/favorites')} className="w-full text-left px-4 py-2 hover:bg-zinc-700">{t.favorites}</button>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-zinc-700">{t.logout}</button>
                  </div>
                )}
              </div>
            ) : (
                <Link
                to="/login"
                className={`px-4 py-2 rounded-md ${
                  isHomePage
                    ? 'bg-black text-white'
                    : theme === 'light'
                    ? 'bg-white text-black hover:bg-gray-300'
                    : 'bg-black text-white hover:bg-gray-700'
                }`}
              >
                {t.login}
              </Link>
            )}
        </nav>
      </div>
    </header>
  );
}