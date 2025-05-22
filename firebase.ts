import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import { getReactNativePersistence } from 'firebase/auth/react-native'; 
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyBaBPvrQVS8jsAqloKsTt49YkEEpIxciwk',
  authDomain: 'waylo-251e0.firebaseapp.com',
  projectId: 'waylo-251e0',
  storageBucket: 'waylo-251e0.appspot.com',      // fixed typo
  messagingSenderId: '899185164510',
  appId: '1:899185164510:web:786296bb1ba2690744824f',
};

const app  = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db   = getFirestore(app);

export { app, auth, db };
