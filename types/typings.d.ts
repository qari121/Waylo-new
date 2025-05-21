interface AuthState {
	uid: string
	username: string
	email: string
	firstName: string
	lastName: string
	createdAt: string
}

interface ToyLogs {
	id: string
	message: string
	time: string
	toy_mac_address?: string
	type: 'user_request' | 'system_response'
	audioUri?: string
}

interface InterestLogs {
	id: string
	intensity: number
	interest: string
	request_id: string
	response_id: string
	time: string
	toy_mac_address: string
}

interface LogState {
	toyLogs: ToyLogs[] | []
	interestLogs: InterestLogs[] | []
	dailyLogs:
	| {
		date: string
		hours: number
	}[]
	| []
	weeklyLogs: {
		[week: string]: {
			date: string
			hours: number
		}[]
	} | null
}

interface SentimentState {
	sentimentRecord: Record<string, Record<string, number>> | null
	sentimentsByDate: {
		[date: string]: {
			[sentiment: string]: number
		}
	} | null
}
