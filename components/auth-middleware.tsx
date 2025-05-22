import { Redirect } from 'expo-router'
import { useAppSelector } from 'hooks'
import React from 'react'

const AuthMiddleware = ({ children }: { children: React.ReactNode }) => {
	const auth = useAppSelector((state) => state.auth)

	if (!auth.uid) {
		return <Redirect href="/login" />
	}

	return children
}

export default AuthMiddleware
