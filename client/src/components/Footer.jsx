import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Github } from 'lucide-react';
import { useSelector } from 'react-redux';
import { translations } from '../utils/translations';

const Footer = () => {
    const currentLanguage = useSelector((state) => state.language.currentLanguage);
    const t = translations[currentLanguage]; 

    return (
        <footer className="bg-zinc-900 border-t border-zinc-800 text-gray-400">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center space-x-3 mb-4">
                            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                            </svg>
                            <span className="text-xl font-bold text-white">Vastra AI: Weaving Ideas into Reality</span>
                        </Link>
                        <p className="text-sm">
                            {t.footerDescription}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">{t.quickLinks}</h3>
                        <ul className="space-y-2">
                            <li><Link to="/" className="hover:text-white transition-colors">{t.generate}</Link></li>
                            <li><Link to="/trending" className="hover:text-white transition-colors">{t.trendingDresses}</Link></li>
                            <li><Link to="/dashboard" className="hover:text-white transition-colors">{t.dashboard}</Link></li>
                            <li><Link to="/find-tailor" className="hover:text-white transition-colors">{t.findFashionServices}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">{t.followUs}</h3>
                        <div className="flex space-x-4">
                            <a href="https://www.linkedin.com/in/gurnoor-singh-191029290/" className="text-gray-400 hover:text-white transition-colors">
                                <Linkedin size={24} />
                            </a>
                            <a href="https://github.com/SinghGurnoor283" className="text-gray-400 hover:text-white transition-colors">
                                <Github size={24} />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="mt-8 border-t border-zinc-800 pt-8 text-center text-sm">
                    <p>&copy; {new Date().getFullYear()} Vastra AI: Weaving Ideas into Reality. {t.copyright}</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
