// firebase.ts
import { initializeApp, getApps } from 'firebase/app';
// @ts-ignore

import { getAuth, initializeAuth, getReactNativePersistence, Auth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Prevent initializing more than once
const firebaseConfig = {
  apiKey: 'AIzaSyBaBPvrQVS8jsAqloKsTt49YkEEpIxciwk',
  authDomain: 'waylo-251e0.firebaseapp.com',
  projectId: 'waylo-251e0',
  storageBucket: 'waylo-251e0.appspot.com',
  messagingSenderId: '899185164510',
  appId: '1:899185164510:web:786296bb1ba2690744824f',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e: any) {
  if (e.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw e;
  }
}

const db = getFirestore(app);

export { app, auth, db };
