import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from './cartSlice';

export type PendingAction = {
  type: 'ADD_TO_CART' | 'TOGGLE_FAVOURITE' | 'VIEW_PROFILE';
  payload?: CartItem | string;
  returnTo: string;
} | null;

interface AuthState {
  isLoggedIn:    boolean;
  isGuest:       boolean;
  id:            string;
  phone:         string;
  name:          string;
  token:         string;
  avatarUrl:     string | null;
  pendingAction: PendingAction;
}

const initialState: AuthState = {
  isLoggedIn:    false,
  isGuest:       false,
  id:            '',
  phone:         '',
  name:          '',
  token:         '',
  avatarUrl:     null,
  pendingAction: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ token: string; id: string; phone: string; name: string }>) {
      state.isLoggedIn = true;
      state.isGuest    = false;
      state.token      = action.payload.token;
      state.id         = action.payload.id;
      state.phone      = action.payload.phone;
      state.name       = action.payload.name;
    },
    logout(state) {
      state.isLoggedIn = false;
      state.isGuest    = false;
      state.token      = '';
      state.id         = '';
      state.phone      = '';
      state.name       = '';
      state.avatarUrl  = null;
    },
    /* legacy — keep for guest browsing */
    setGuest(state) {
      state.isGuest    = true;
      state.isLoggedIn = false;
      state.token      = '';
      state.id         = '';
      state.phone      = '';
      state.name       = '';
      state.avatarUrl  = null;
    },
    setLoggedIn(state) { state.isLoggedIn = true; state.isGuest = false; },
    setPendingAction(state, action: PayloadAction<PendingAction>) {
      state.pendingAction = action.payload;
    },
    clearPendingAction(state) { state.pendingAction = null; },
    updateUserName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setProfile(state, action: PayloadAction<{ name: string; phone: string }>) {
      state.name  = action.payload.name;
      state.phone = action.payload.phone;
    },
    setAvatarUrl(state, action: PayloadAction<string | null>) {
      state.avatarUrl = action.payload;
    },
  },
});

export const {
  loginSuccess, logout,
  setGuest, setLoggedIn,
  setPendingAction, clearPendingAction,
  updateUserName, setProfile, setAvatarUrl,
} = authSlice.actions;

export const selectAuth          = (s: { auth: AuthState }) => s.auth;
export const selectIsGuest       = (s: { auth: AuthState }) => s.auth.isGuest;
export const selectIsLoggedIn    = (s: { auth: AuthState }) => s.auth.isLoggedIn;
export const selectPendingAction = (s: { auth: AuthState }) => s.auth.pendingAction;

export default authSlice.reducer;
