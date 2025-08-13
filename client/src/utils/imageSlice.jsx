import {createSlice} from '@reduxjs/toolkit';
const imageSlice= createSlice({
    name: 'image',
    initialState: {
        imageurl: '',
        loading: false,
        recentDesign:[],
        allDesign: []
    },
    reducers: {
        setImageUrl: (state, action) => {
            state.imageurl = action.payload;
        },
        setLoading : (state, action) => {
            state.loading = action.payload;
        },
        addDesign: (state, action) => {
            const { prompt, image } = action.payload;

            state.recentDesign.unshift({ prompt, image });
            if (state.recentDesign.length > 5) {
                state.recentDesign.pop();
            }
            state.allDesign.push({ prompt, image });
        },
        clearDesigns(state) {
            state.recentDesign = [];
            state.allDesign = [];
        },
    }

})

export const { setImageUrl, setLoading, addDesign, clearDesigns } = imageSlice.actions;
export default imageSlice.reducer;