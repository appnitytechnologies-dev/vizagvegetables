import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';

interface FavouritesState {
  ids: string[];
}

const initialState: FavouritesState = { ids: [] };

const favouritesSlice = createSlice({
  name: 'favourites',
  initialState,
  reducers: {
    toggleFavourite(state, action: PayloadAction<string>) {
      const idx = state.ids.indexOf(action.payload);
      if (idx >= 0) {
        state.ids.splice(idx, 1);
      } else {
        state.ids.push(action.payload);
      }
    },
  },
});

export const { toggleFavourite } = favouritesSlice.actions;

export const selectFavouriteIds = (state: RootState) => state.favourites.ids;
export const selectIsFavourite = (id: string) => (state: RootState) =>
  state.favourites.ids.includes(id);

export default favouritesSlice.reducer;
