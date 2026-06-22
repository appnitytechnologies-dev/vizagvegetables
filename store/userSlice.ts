import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserProfile = {
  name: string;
  phone: string;
  email: string;
  profileImage: string | null;
};

const initialState: UserProfile = {
  name: 'Ravi Kumar',
  phone: '+91 98765 43210',
  email: '',
  profileImage: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateProfile(state, action: PayloadAction<Partial<UserProfile>>) {
      return { ...state, ...action.payload };
    },
  },
});

export const { updateProfile } = userSlice.actions;
export default userSlice.reducer;

export const selectUserProfile = (state: { user: UserProfile }) => state.user;
