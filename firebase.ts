import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
	apiKey: 'AIzaSyBaBPvrQVS8jsAqloKsTt49YkEEpIxciwk',
	authDomain: 'waylo-251e0.firebaseapp.com',
	projectId: 'waylo-251e0',
	storageBucket: 'waylo-251e0.firebasestorage.app',
	messagingSenderId: '899185164510',
	appId: '1:899185164510:web:786296bb1ba2690744824f'
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

export { app, auth, db }

