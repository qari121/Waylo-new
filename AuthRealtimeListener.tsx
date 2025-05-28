import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks'; // adjust path if needed
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { setUser } from './slices/auth'; // instead of login

const AuthRealtimeListener = () => {
  const auth = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!auth.uid) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.uid), (docSnap) => {
      if (docSnap.exists()) {
        dispatch(setUser(docSnap.data() as AuthState));
      }
    });
    return () => unsubscribe();
  }, [auth.uid, dispatch]);

  return null;
};

export default AuthRealtimeListener;
