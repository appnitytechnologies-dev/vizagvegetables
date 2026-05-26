import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';
import { AppDispatch } from '../store';
import { selectIsGuest, setPendingAction, PendingAction } from '../store/authSlice';

export const useAuthGuard = () => {
  const isGuest = useSelector(selectIsGuest);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const guard = (action: NonNullable<PendingAction>, callback: () => void) => {
    if (isGuest) {
      dispatch(setPendingAction(action));
      router.push('/(auth)/otp-number');
      return;
    }
    callback();
  };

  return { isGuest, guard };
};
