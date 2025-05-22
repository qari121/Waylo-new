// firebase-auth-react-native.d.ts
declare module 'firebase/auth/react-native' {
    export * from 'firebase/auth';
    export const getReactNativePersistence: (
      storage: any
    ) => import('firebase/auth').Persistence;
  }
  