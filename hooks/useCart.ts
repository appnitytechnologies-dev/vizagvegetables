import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  addToCart,
  removeFromCart,
  increaseQty,
  decreaseQty,
  clearCart,
  selectCartItems,
  selectCartCount,
  selectCartTotal,
  selectItemQuantity,
  CartItem,
} from '../store/cartSlice';

export const useCart = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector(selectCartItems);
  const count = useSelector(selectCartCount);
  const total = useSelector(selectCartTotal);

  return {
    items,
    count,
    total,
    addItem: (product: CartItem) => dispatch(addToCart(product)),
    removeItem: (id: string) => dispatch(removeFromCart(id)),
    increase: (id: string) => dispatch(increaseQty(id)),
    decrease: (id: string) => dispatch(decreaseQty(id)),
    clear: () => dispatch(clearCart()),
  };
};

export const useItemQuantity = (id: string) =>
  useSelector(selectItemQuantity(id));
