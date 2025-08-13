import React, { useEffect, useState } from 'react';
import { createBrowserRouter,RouterProvider } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import { onAuthStateChanged } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { auth } from '../firebaseConfig';
import { addUser, removeUser } from './utils/userSlice';
import Dashboard from './components/Dashboard';
import Trending from './components/Trending';
import FindTailor from './components/FindTailor';
import Favorites from './components/Favorites';
function App() {
  const dispatch = useDispatch();
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      dispatch(addUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }));
      // navigate("/")
    } else {
      dispatch(removeUser());
    }
  });

  return () => unsubscribe();
}, []);
  const router = createBrowserRouter([
    {
      path: '/',
      element: <Home/>,
    },
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/dashboard',
      element: <Dashboard/>,
    },
    {
      path: '/trending',
      element: <Trending/>,
    },{
      path:'find-tailor',
      element: <FindTailor/>,

    },
    {
        path: '/favorites',
        element: <Favorites/>,
    }
  ])
 return (
    <RouterProvider router={router} />
  )
}

export default App;
