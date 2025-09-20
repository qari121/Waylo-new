import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SignupForm } from '@screens/register'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const login = createAsyncThunk(
	'auth/login',
	async (data: { email: string; password: string }, thunkAPI) => {
		try {
			const response = await signInWithEmailAndPassword(auth, data.email, data.password)
			const userDoc = await getDoc(doc(db, 'users', response.user.uid))
			if (userDoc.exists()) {
				const rawData = userDoc.data() as any;
				
				// Convert Firestore timestamps to serializable strings
				const userData = {
					...rawData,
					createdAt: rawData.createdAt?.toDate?.()?.toISOString() || rawData.createdAt || '',
					updatedAt: rawData.updatedAt?.toDate?.()?.toISOString() || rawData.updatedAt || '',
					profileImageUrl: rawData.profileImageUrl || '',
				} as AuthState;
				
				
				// sync MAC to local storage for first-install restore
				if (userData?.mac_address) {
					await AsyncStorage.setItem('macAddress', userData.mac_address as string);
					await AsyncStorage.setItem('macAddressEntered', 'true');
				}
				return thunkAPI.fulfillWithValue(userData)
			} else {
				return thunkAPI.rejectWithValue('User data not found in Firestore')
			}
		} catch (error: any) {
			return thunkAPI.rejectWithValue(error.message)
		}
	}
)

export const register = createAsyncThunk('auth/register', async (data: SignupForm, thunkAPI) => {
	try {
		const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
		const user = userCredential.user

		const userData = {
			uid: user.uid,
			email: data.email,
			firstName: data.firstName,
			lastName: data.lastName,
			username: data.username,
			createdAt: new Date().toISOString(),
			plan: "freemium" as "freemium",
		}

		await setDoc(doc(db, 'users', user.uid), userData)
        // Also create a toy document for this user (with empty mac_address for now)
        await setDoc(doc(db, 'toy', user.uid), {
          user_uid: user.uid,
          mac_address: '',
          createdAt: new Date().toISOString(),
        });
		return thunkAPI.fulfillWithValue(userData)
	} catch (error: any) {
		return thunkAPI.rejectWithValue(error?.message)
	}
})

const initialState: AuthState = {
	uid: '',
	username: '',
	email: '',
	firstName: '',
	lastName: '',
	createdAt: '',
	updatedAt: '',
	plan: 'freemium',
	mac_address: undefined,
	profileImageUrl: '',
}

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		logout() {
			return initialState
		},
		setUser(_, action: PayloadAction<AuthState>) {
			return action.payload
		}
	},
	extraReducers: (builder) => {
		builder
			.addCase(login.fulfilled, (_, action: PayloadAction<AuthState>) => {
				return action.payload
			})
			.addCase(login.rejected, () => {
				return initialState
			})
			.addCase(register.fulfilled, (_, action: PayloadAction<AuthState>) => {
				return action.payload
			})
			.addCase(register.rejected, () => {
				return initialState
			})
	}
})

const { reducer } = authSlice

export const { logout, setUser } = authSlice.actions

export default reducer
