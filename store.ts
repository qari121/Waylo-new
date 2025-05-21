import AsyncStorage from '@react-native-async-storage/async-storage'
import { Action, combineReducers, configureStore, ThunkAction } from '@reduxjs/toolkit'
import { FLUSH, PAUSE, PERSIST, persistReducer, PURGE, REGISTER, REHYDRATE } from 'redux-persist'

import authReducer from '@slices/auth'
import logReducer from '@slices/logs'
import notificationReducer from '@slices/notifications'
import sentimentReducer from '@slices/sentiments'

const persistConfig = {
	key: 'root',
	storage: AsyncStorage,
	whitelist: ['auth', 'notifications']
}

const rootReducer = combineReducers({
	auth: authReducer,
	logs: logReducer,
	sentiments: sentimentReducer,
	notifications: notificationReducer
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

const store = configureStore({
	reducer: persistedReducer,
	devTools: true,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
			}
		})
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
	ReturnType,
	RootState,
	unknown,
	Action<string>
>

export default store
