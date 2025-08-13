import {configureStore} from '@reduxjs/toolkit';
import imageReducer from './imageSlice';
import  userReducer  from './userSlice';
import languageSlice from './languageSlice';
import themeReducer from './themeSlice';
const appStore = configureStore({
    reducer: {
        image: imageReducer,
        user: userReducer,
        language: languageSlice,
        theme: themeReducer,
    }
})
export default appStore;