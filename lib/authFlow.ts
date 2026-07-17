import { router } from 'expo-router';
import { AppDispatch } from '../store';
import { clearPendingAction, PendingAction } from '../store/authSlice';
import { addToCart, clearCart, CartItem } from '../store/cartSlice';
import { toggleFavourite, setFavourites } from '../store/favouritesSlice';
import { api } from './api';

/** Call after a successful login (Google, or profile completion right after it)
 *  to hydrate favourites/cart from the server and resume whatever the user
 *  was doing before being asked to log in. */
export async function finishLogin(dispatch: AppDispatch, pendingAction: PendingAction) {
  try {
    const favIds = await api.get<string[]>('/api/favorites');
    dispatch(setFavourites(favIds));
  } catch {}
  try {
    const cartItems = await api.get<CartItem[]>('/api/cart');
    if (cartItems.length > 0) {
      dispatch(clearCart());
      cartItems.forEach(item => dispatch(addToCart(item)));
    }
  } catch {}

  if (pendingAction) {
    if (pendingAction.type === 'ADD_TO_CART' && pendingAction.payload) {
      dispatch(addToCart(pendingAction.payload as CartItem));
    } else if (pendingAction.type === 'TOGGLE_FAVOURITE' && pendingAction.payload) {
      const favId = pendingAction.payload as string;
      dispatch(toggleFavourite(favId));
      api.post(`/api/favorites/${favId}`, {}).catch(() => {});
    }
    const returnTo = pendingAction.returnTo;
    dispatch(clearPendingAction());
    router.replace(returnTo as any);
  } else {
    router.replace('/(tabs)/home');
  }
}
