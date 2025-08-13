
import { createSlice } from '@reduxjs/toolkit';

const themeSlice = createSlice({
    name: 'theme',
    initialState: {
        mode: 'light', 
    },
    reducers: {
        setTheme: (state, action) => {
            state.mode = action.payload;
        },
    },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;