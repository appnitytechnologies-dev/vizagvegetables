import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  toggleFavourite,
  selectFavouriteIds,
  selectIsFavourite,
} from '../store/favouritesSlice';

export const useFavourites = () => {
  const dispatch = useDispatch<AppDispatch>();
  const ids = useSelector(selectFavouriteIds);

  return {
    ids,
    toggle: (id: string) => dispatch(toggleFavourite(id)),
  };
};

export const useIsFavourite = (id: string) =>
  useSelector(selectIsFavourite(id));
