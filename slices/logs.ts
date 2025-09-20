import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { differenceInCalendarWeeks, min, parseISO } from 'date-fns'
import { db } from '../firebase'
import { collection, getDocs, orderBy, query, where, limit } from 'firebase/firestore'

export const toyLogs = createAsyncThunk('logs/toy', async (macAddress: string, thunkAPI) => {
	try {
		const toyLogsRef = collection(db, 'toy_logs')
		const q = query(
			toyLogsRef,
			where('toy_mac_address', '==', macAddress),
			orderBy('time', 'asc'),
			limit(1000) // Limit to prevent memory issues
		)
		const querySnapshot = await getDocs(q)

		const logs: any[] = []
		querySnapshot.forEach((doc) => {
			const data = doc.data()
			let timeValue: string
			
			// Safe timestamp conversion
			try {
				if (data.time?.toDate && typeof data.time.toDate === 'function') {
					timeValue = data.time.toDate().toISOString()
				} else if (data.time?.seconds && typeof data.time.seconds === 'number') {
					timeValue = new Date(data.time.seconds * 1000).toISOString()
				} else if (data.time) {
					timeValue = new Date(data.time).toISOString()
				} else {
					console.warn('[Logs] Log without valid time field:', doc.id)
					timeValue = new Date().toISOString() // Fallback to current time
				}
			} catch (timeError) {
				console.error('[Logs] Error converting timestamp:', timeError, 'for doc:', doc.id)
				timeValue = new Date().toISOString() // Fallback to current time
			}
			
			logs.push({ id: doc.id, ...data, time: timeValue })
		})
		return thunkAPI.fulfillWithValue(logs)
	} catch (error: any) {
		return thunkAPI.rejectWithValue(error.message)
	}
})

export const fetchDailyLogRanges = createAsyncThunk(
	'logs/fetchDailyRanges',
	async (macAddress: string, thunkAPI) => {
		try {
			const logsQuery = query(
				collection(db, 'toy_logs'),
				where('toy_mac_address', '==', macAddress)
			)
			const querySnapshot = await getDocs(logsQuery)

			const logsByDate: { [date: string]: number[] } = {}

			querySnapshot.forEach((doc) => {
				const { time } = doc.data()
				
				// Safe date parsing
				let date: string
				let timestamp: number
				
				try {
					if (time?.seconds && typeof time.seconds === 'number') {
						timestamp = time.seconds
						date = new Date(time.seconds * 1000).toISOString().split('T')[0]
					} else if (time?.toDate && typeof time.toDate === 'function') {
						const dateObj = time.toDate()
						timestamp = dateObj.getTime() / 1000
						date = dateObj.toISOString().split('T')[0]
					} else {
						console.warn('[Logs] Invalid time field in document:', doc.id)
						return
					}
				} catch (error) {
					console.error('[Logs] Error parsing time for document:', doc.id, error)
					return
				}

				if (!logsByDate[date]) {
					logsByDate[date] = []
				}
				logsByDate[date].push(timestamp)
			})

			const dailyTimeRanges: { date: string; hours: number }[] = []

			Object.entries(logsByDate).forEach(([date, timestamps]) => {
				if (timestamps.length < 2) return

				// Safe min/max calculation
				try {
					const earliest = Math.min(...timestamps)
					const latest = Math.max(...timestamps)
					
					// Validate timestamps
					if (isNaN(earliest) || isNaN(latest)) {
						console.warn('[Logs] Invalid timestamps for date:', date)
						return
					}
					
					const hours = (latest - earliest) / 3600
					dailyTimeRanges.push({ date, hours: Math.round(hours) })
				} catch (error) {
					console.error('[Logs] Error calculating time range for date:', date, error)
				}
			})

			if (dailyTimeRanges.length > 0) {
				const allDates = dailyTimeRanges.map((d) => new Date(d.date))
				const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
				const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

				for (let d = new Date(minDate); d <= maxDate; d.setDate(d.getDate() + 1)) {
					const dateStr = d.toISOString().split('T')[0]
					if (!dailyTimeRanges.some((entry) => entry.date === dateStr)) {
						dailyTimeRanges.push({ date: dateStr, hours: 0 })
					}
				}
			}

			return thunkAPI.fulfillWithValue(dailyTimeRanges)
		} catch (error: any) {
			return thunkAPI.rejectWithValue(error.message)
		}
	}
)

export const fetchWeeklyLogRanges = createAsyncThunk(
	'logs/fetchWeeklyRanges',
	async (macAddress: string, thunkAPI) => {
		try {
			const logsQuery = query(
				collection(db, 'toy_logs'),
				where('toy_mac_address', '==', macAddress)
			)
			const querySnapshot = await getDocs(logsQuery)

			const logsByDate: { [date: string]: number[] } = {}

			querySnapshot.forEach((doc) => {
				const { time } = doc.data()
				const date = new Date(time.seconds * 1000).toISOString().split('T')[0] // YYYY-MM-DD format
				const timestamp = time.seconds

				if (!logsByDate[date]) {
					logsByDate[date] = []
				}
				logsByDate[date].push(timestamp)
			})

			const allDates = Object.keys(logsByDate).map((d) => parseISO(d))
			const earliestDate = min(allDates)

			const dailyTimeRanges: { date: string; week: number; hours: number }[] = []

			Object.entries(logsByDate).forEach(([date, timestamps]) => {
				if (timestamps.length < 2) return

				const earliest = Math.min(...timestamps)
				const latest = Math.max(...timestamps)
				const hours = (latest - earliest) / 3600

				const week = differenceInCalendarWeeks(parseISO(date), earliestDate) + 1

				dailyTimeRanges.push({ date, week, hours: Math.round(hours) })
			})

			const weeks: { [week: string]: { date: string; hours: number }[] } = {}

			dailyTimeRanges.forEach((entry) => {
				const weekKey = `Week ${entry.week}`
				if (!weeks[weekKey]) {
					weeks[weekKey] = []
				}
				weeks[weekKey].push({ date: entry.date, hours: entry.hours })
			})

			return thunkAPI.fulfillWithValue(weeks)
		} catch (error: any) {
			return thunkAPI.rejectWithValue(error.message)
		}
	}
)

export const fetchInterestLogs = createAsyncThunk(
	'logs/fetchInterestLogs',
	async ({ interestValue, macAddress }: { interestValue: string; macAddress: string }, thunkAPI) => {
		try {
			const interestQuery = query(
				collection(db, 'interest_logs'),
				where('interest', '==', interestValue),
				where('toy_mac_address', '==', macAddress)
			)
			const querySnapshot = await getDocs(interestQuery)

			const interestLogs: InterestLogs[] = querySnapshot.docs.map((doc) => ({
				id: doc.id,
				intensity: doc.data().intensity,
				interest: doc.data().interest,
				request_id: doc.data().request_id,
				response_id: doc.data().response_id,
				time: doc.data().time,
				toy_mac_address: doc.data().toy_mac_address
			}))

			return thunkAPI.fulfillWithValue(interestLogs)
		} catch (error: any) {
			return thunkAPI.rejectWithValue(error.message)
		}
	}
)

const initialState = {
	toyLogs: [],
	weeklyLogs: null,
	dailyLogs: [],
	interestLogs: []
} as LogState

const logSlice = createSlice({
	name: 'logs',
	initialState,
	reducers: {
		addMessage: (state, action: PayloadAction<any>) => {
			state.toyLogs = [...state.toyLogs, action.payload]
		}
	},
	extraReducers: (builder) => {
		builder.addCase(toyLogs.fulfilled, (state, action: PayloadAction<ToyLogs[]>) => {
			return { ...state, toyLogs: action.payload }
		}),
			builder.addCase(
				fetchWeeklyLogRanges.fulfilled,
				(state, action: PayloadAction<LogState['weeklyLogs']>) => {
					return { ...state, weeklyLogs: action.payload }
				}
			),
			builder.addCase(
				fetchDailyLogRanges.fulfilled,
				(state, action: PayloadAction<LogState['dailyLogs']>) => {
					return { ...state, dailyLogs: action.payload }
				}
			),
			builder.addCase(
				fetchInterestLogs.fulfilled,
				(state, action: PayloadAction<LogState['interestLogs']>) => {
					return { ...state, interestLogs: action.payload }
				}
			),
			builder.addCase(toyLogs.rejected, (state) => {
				return { ...state, toyLogs: [] }
			})
		builder.addCase(fetchWeeklyLogRanges.rejected, (state) => {
			return { ...state, weeklyLogs: null }
		})
		builder.addCase(fetchInterestLogs.rejected, (state) => {
			return { ...state, interestLogs: [] }
		})
		builder.addCase(fetchDailyLogRanges.rejected, (state) => {
			return { ...state, dailyLogs: [] }
		})
	}
})

export const { addMessage } = logSlice.actions
const { reducer } = logSlice

export default reducer
