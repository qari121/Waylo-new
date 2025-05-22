import { Redirect } from 'expo-router'
import { useAppSelector } from 'hooks'
import { View, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'

export default function Page() {
	const [isInitialized, setIsInitialized] = useState(false)
	const auth = useAppSelector((state) => state.auth)

	useEffect(() => {
		// Give a small delay to ensure store is initialized
		const timer = setTimeout(() => {
			setIsInitialized(true)
		}, 100)
		return () => clearTimeout(timer)
	}, [])

	if (!isInitialized) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
				<ActivityIndicator size="large" color="#0000ff" />
			</View>
		)
	}

	return auth.uid ? <Redirect href="(private)/" /> : <Redirect href="(public)/login" />
}
