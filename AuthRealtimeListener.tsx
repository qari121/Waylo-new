import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './hooks'; // adjust path if needed
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { setUser } from './slices/auth'; // instead of login
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthRealtimeListener = () => {
  const auth = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!auth.uid) return;
    console.log('AuthRealtimeListener - User UID:', auth.uid);
    const unsubscribe = onSnapshot(doc(db, 'users', auth.uid), (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        console.log('AuthRealtimeListener - User document data:', rawData);
        
        // Convert Firestore timestamps to serializable strings
        const data = {
          ...rawData,
          createdAt: rawData.createdAt?.toDate?.()?.toISOString() || rawData.createdAt || '',
          updatedAt: rawData.updatedAt?.toDate?.()?.toISOString() || rawData.updatedAt || '',
          profileImageUrl: rawData.profileImageUrl || '',
        } as AuthState;
        
        dispatch(setUser(data));

        // ────────────────────────────────────────────────
        // Keep MAC address in local storage in sync
        // ────────────────────────────────────────────────
        const mac = (data as any).mac_address as string | undefined;
        console.log('AuthRealtimeListener - MAC from user data:', mac);
        if (mac) {
          console.log('AuthRealtimeListener - Setting MAC in AsyncStorage:', mac);
          AsyncStorage.setItem('macAddress', mac);
          AsyncStorage.setItem('macAddressEntered', 'true');
        } else {
          console.log('AuthRealtimeListener - No MAC address in user data');
        }
      } else {
        console.log('AuthRealtimeListener - User document does not exist');
      }
    });
    return () => unsubscribe();
  }, [auth.uid, dispatch]);

  // ──────────────────────────────────────────────────
  // Clear cached MAC when user logs out / auth.uid→''
  // ──────────────────────────────────────────────────
  useEffect(() => {
    if (!auth.uid) {
      AsyncStorage.multiRemove(['macAddress', 'macAddressEntered']).catch(() => {});
    }
  }, [auth.uid]);

  return null;
};

export default AuthRealtimeListener;
