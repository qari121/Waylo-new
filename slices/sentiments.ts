import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { format } from 'date-fns'
import { db } from 'firebase'
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore'

export const fetchSentimentsCount = createAsyncThunk('sentiment/count', async (_, thunkAPI) => {
	try {
		const sentimentLogsRef = collection(db, 'sentiment_logs')
		const q = query(
			sentimentLogsRef,
			where('toy_mac_address', '==', 'C0:F5:35:ED:FD:25'),
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
	async (_, thunkAPI) => {
		try {
			const toyMacAddress = 'C0:F5:35:ED:FD:25'
			const sentimentQuery = query(
				collection(db, 'sentiment_logs'),
				where('toy_mac_address', '==', toyMacAddress)
			)
			const querySnapshot = await getDocs(sentimentQuery)

			const sentimentsByDate: { [date: string]: { [sentiment: string]: number } } = {}

			querySnapshot.forEach((doc) => {
				const { time, sentiment } = doc.data()
				const date = new Date(time.seconds * 1000).toISOString().split('T')[0]

				if (!sentimentsByDate[date]) {
					sentimentsByDate[date] = {}
				}
				sentimentsByDate[date][sentiment] = (sentimentsByDate[date][sentiment] || 0) + 1
			})

			return thunkAPI.fulfillWithValue(sentimentsByDate)
		} catch (error: any) {
			return thunkAPI.rejectWithValue(error.message)
		}
	}
)

const initialState = {} as SentimentState

const sentimentSlice = createSlice({
	name: 'sentiments',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(
			fetchSentimentsCount.fulfilled,
			(state, action: PayloadAction<SentimentState['sentimentsByDate']>) => {
				return { ...state, sentimentRecord: action.payload }
			}
		),
			builder.addCase(
				fetchSentimentsByDate.fulfilled,
				(
					state,
					action: PayloadAction<{
						[date: string]: {
							[sentiment: string]: number
						}
					}>
				) => {
					return { ...state, sentimentsByDate: action.payload }
				}
			),
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
