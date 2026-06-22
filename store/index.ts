import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import favouritesReducer from './favouritesSlice';
import authReducer from './authSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    favourites: favouritesReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
