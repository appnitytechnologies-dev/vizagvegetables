import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import cartReducer from './cartSlice';
import favouritesReducer from './favouritesSlice';
import authReducer from './authSlice';
import userReducer from './userSlice';

const cartPersistConfig = {
  key:     'cart',
  storage: AsyncStorage,
};

const favPersistConfig = {
  key:     'favourites',
  storage: AsyncStorage,
};

const rootReducer = combineReducers({
  auth:       authReducer,
  cart:       persistReducer(cartPersistConfig, cartReducer),
  favourites: persistReducer(favPersistConfig, favouritesReducer),
  user:       userReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
