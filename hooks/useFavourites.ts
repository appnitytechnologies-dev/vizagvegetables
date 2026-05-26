import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import {
  toggleFavourite,
  selectFavouriteIds,
  selectIsFavourite,
} from '../store/favouritesSlice';
import { selectAuth } from '../store/authSlice';
import { api } from '../lib/api';

export const useFavourites = () => {
  const dispatch  = useDispatch<AppDispatch>();
  const ids       = useSelector(selectFavouriteIds);
  const auth      = useSelector(selectAuth);

  const toggle = async (id: string) => {
    if (!auth.isLoggedIn) return;          // guest — do nothing (caller should guard)
    dispatch(toggleFavourite(id));         // optimistic update
    try {
      await api.post(`/api/favorites/${id}`, {});
    } catch {
      dispatch(toggleFavourite(id));       // revert on API failure
    }
  };

  return { ids, toggle };
};

export const useIsFavourite = (id: string) =>
  useSelector(selectIsFavourite(id));
