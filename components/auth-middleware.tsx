import { Redirect } from 'expo-router'
import { useAppSelector } from 'hooks'
import React, { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'

const AuthMiddleware = ({ children }: { children: React.ReactNode }) => {
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

	if (!auth.uid) {
		return <Redirect href="/login" />
	}

	return children
}

export default AuthMiddleware
