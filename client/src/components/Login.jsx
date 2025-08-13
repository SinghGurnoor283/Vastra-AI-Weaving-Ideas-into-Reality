import React, { useRef, useState } from 'react';
import { auth } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import {createUserWithEmailAndPassword,signInWithEmailAndPassword,updateProfile,} from 'firebase/auth';
import checkValidateData from '../utils/validate';
import { useDispatch, useSelector } from 'react-redux';
import { addUser } from '../utils/userSlice';
import Header from './Header';
import { account } from '../appwriteClient';
import ThemeToggler from './ThemeToggler';
import BackgroundPhoto from '../assets/Background.webp'; 

const Login = () => {
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const nameRef = useRef(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const dispatch = useDispatch();
    const themeMode = useSelector((state) => state.theme.mode);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const email = emailRef.current.value;
        const password = passwordRef.current.value;
        const name = nameRef?.current?.value;

        const validationError = checkValidateData(email, password, isSignUp);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            let userCred;
            if (isSignUp) {
                userCred = await createUserWithEmailAndPassword(auth, email, password);
                const firebaseUser = userCred.user;
                await updateProfile(firebaseUser, { displayName: name });
                await account.create(firebaseUser.uid, email, password, name);
                await account.createEmailPasswordSession(email, password);
            } else {
                userCred = await signInWithEmailAndPassword(auth, email, password);
                await account.createEmailPasswordSession(email, password);
            }

            dispatch(
                addUser({
                    uid: userCred.user.uid,
                    email: userCred.user.email,
                    name: userCred.user.displayName,
                })
            );
            navigate('/');

        } catch (err) {
            if (err.code === 'auth/email-already-in-use' || err.message.includes('A user with the same email already exists')) {
                setError('This email address is already registered. Please log in.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid email or password.');
            }
            else {
                setError('An unexpected error occurred. Please try again.');
            }
            console.error("Authentication Error:", err);
        }
    };

    return (
        <div className={`min-h-screen -mt-18.5 transition-colors duration-300 ${themeMode === 'dark' ? 'bg-black' : 'bg-gray-100'}`}>
            <Header />
            <div className="relative min-h-screen flex items-center justify-center py-12 px-4">
             
                <div className="absolute inset-0">
                    <img src={BackgroundPhoto} alt="background" className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 ${themeMode === 'dark' ? 'bg-black/70' : 'bg-white/50'}`}></div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className={`relative z-10 mt-8 p-8 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-300 ${themeMode === 'dark' ? 'bg-black/60 backdrop-blur-lg border border-zinc-800' : 'bg-white/80 backdrop-blur-lg border'}`}
                >
                    <h2 className={`text-3xl font-bold mb-6 text-center ${themeMode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {isSignUp ? 'Create Account' : 'Welcome Back'}
                    </h2>
                    
                    {error && <p className="bg-red-500/20 text-red-400 text-sm text-center p-3 rounded-lg mb-4">{error}</p>}
                    
                    {isSignUp && (
                        <input
                            type="text"
                            placeholder="Name"
                            ref={nameRef}
                            className={`w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-300 ${themeMode === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-pink-500' : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:ring-blue-500'}`}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        ref={emailRef}
                        className={`w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-300 ${themeMode === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-pink-500' : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:ring-blue-500'}`}
                        autoComplete="email"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        ref={passwordRef}
                        className={`w-full p-3 mb-6 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-300 ${themeMode === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:ring-pink-500' : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500 focus:ring-blue-500'}`}
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                        required
                    />
                    <button
                        type="submit"
                        className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-105 ${themeMode === 'dark' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-pink-600/30' : 'bg-black text-white hover:bg-gray-800'}`}
                    >
                        {isSignUp ? 'Sign Up' : 'Login'}
                    </button>
                    <p
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                        }}
                        className="mt-6 text-sm text-center cursor-pointer"
                    >
                        <span className={`${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        </span>
                        <span className={`font-semibold ml-1 ${themeMode === 'dark' ? 'text-pink-400 hover:text-pink-300' : 'text-blue-600 hover:text-blue-500'}`}>
                            {isSignUp ? 'Login' : 'Sign up'}
                        </span>
                    </p>
                </form>
            </div>
            <ThemeToggler />
        </div>
    );
};

export default Login;
