import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { format } from 'date-fns'
import { db } from '../firebase'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'

// Always check for a valid MAC address before dispatching these thunks from your components/screens.

export const fetchSentimentsCount = createAsyncThunk('sentiment/count', async (macAddress: string, thunkAPI) => {
	try {
		const sentimentLogsRef = collection(db, 'sentiment_logs')
		const q = query(
			sentimentLogsRef,
			where('toy_mac_address', '==', macAddress),
			orderBy('time', 'asc')
		)

		const querySnapshot = await getDocs(q)

		const sentiments = ['neutral', 'happy', 'anxious', 'sad', 'negative', 'excited', 'angry']

		const groupedData: Record<string, Record<string, number>> = {}

		querySnapshot.forEach((doc) => {
			const data = doc.data()
			const sentiment = data.sentiment
			const date = data.time.toDate()
			const day = format(date, 'EEE')

			if (sentiments.includes(sentiment)) {
				if (!groupedData[day]) {
					groupedData[day] = sentiments.reduce((acc, s) => ({ ...acc, [s]: 0 }), {})
				}

				groupedData[day][sentiment]++
			}
		})

		return thunkAPI.fulfillWithValue(groupedData)
	} catch (error: any) {
		return thunkAPI.rejectWithValue(error.message)
	}
})

export const fetchSentimentsByDate = createAsyncThunk(
	'sentiments/fetchByDate',
	async (macAddress: string, thunkAPI) => {
		try {
			const sentimentQuery = query(
				collection(db, 'sentiment_logs'),
				where('toy_mac_address', '==', macAddress),
				orderBy('time', 'asc')
			)
			const querySnapshot = await getDocs(sentimentQuery)

			const sentimentsByDate: { 
				[date: string]: { 
					[sentiment: string]: {
						count: number;
						timestamps: number[];
					}
				} 
			} = {}

			querySnapshot.forEach((doc) => {
				const { time, sentiment } = doc.data()
				const timestamp = time.seconds * 1000
				const date = new Date(timestamp).toISOString().split('T')[0]

				if (!sentimentsByDate[date]) {
					sentimentsByDate[date] = {}
				}
				if (!sentimentsByDate[date][sentiment]) {
					sentimentsByDate[date][sentiment] = {
						count: 0,
						timestamps: []
					}
				}
				sentimentsByDate[date][sentiment].count++
				sentimentsByDate[date][sentiment].timestamps.push(timestamp)
			})

			return thunkAPI.fulfillWithValue(sentimentsByDate)
		} catch (error: any) {
			return thunkAPI.rejectWithValue(error.message)
		}
	}
)

interface SentimentState {
	sentimentsByDate: {
		[date: string]: {
			[sentiment: string]: {
				count: number;
				timestamps: number[];
			}
		}
	} | null;
	sentimentRecord: Record<string, Record<string, number>> | null;
	fetchedAt: number | null;
}

const initialState: SentimentState = {
	sentimentsByDate: null,
	sentimentRecord: null,
	fetchedAt: null,
}

const sentimentSlice = createSlice({
	name: 'sentiments',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(
			fetchSentimentsCount.fulfilled,
			(state, action: PayloadAction<SentimentState['sentimentRecord']>) => {
				state.sentimentRecord = action.payload;
				state.fetchedAt = Date.now();
			}
		)
		builder.addCase(
			fetchSentimentsByDate.fulfilled,
			(state, action: PayloadAction<SentimentState['sentimentsByDate']>) => {
				state.sentimentsByDate = action.payload;
			}
		)
		builder.addCase(fetchSentimentsByDate.rejected, (state) => {
			return { ...state, sentimentsByDate: null }
		})
		builder.addCase(fetchSentimentsCount.rejected, (state) => {
			return { ...state, sentimentRecord: null }
		})
	}
})

const { reducer } = sentimentSlice

export default reducer
