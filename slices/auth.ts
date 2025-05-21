import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { SignupForm } from '@screens/register'
import { auth, db } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export const login = createAsyncThunk(
	'auth/login',
	async (data: { email: string; password: string }, thunkAPI) => {
		try {
			const response = await signInWithEmailAndPassword(auth, data.email, data.password)
			const userDoc = await getDoc(doc(db, 'users', response.user.uid))
			if (userDoc.exists()) {
				return thunkAPI.fulfillWithValue(userDoc.data() as AuthState)
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

		await setDoc(doc(db, 'users', user.uid), {
			uid: user.uid,
			email: data.email,
			firstName: data.firstName,
			lastName: data.lastName,
			username: data.username,
			createdAt: new Date().toISOString()
		})
		return thunkAPI.fulfillWithValue({ ...data, id: user.uid })
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
	createdAt: ''
}

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		logout() {
			return initialState
		}
	},
	extraReducers: (builder) => {
		builder.addCase(login.fulfilled, (_, action: PayloadAction<AuthState>) => {
			return action.payload
		}),
			builder.addCase(login.rejected, () => {
				return initialState
			})
	}
})

const { reducer } = authSlice

export const { logout } = authSlice.actions

export default reducer
