import { Redirect } from 'expo-router'
import { useAppSelector } from 'hooks'
import { useEffect } from 'react'

export default function Page() {
	const auth = useAppSelector((state: any) => state.auth)
	
	useEffect(() => {
		console.log('Index page mounted')
		console.log('Auth state:', auth)
	}, [auth])

	if (!auth) {
		console.log('No auth state, redirecting to login')
		return <Redirect href="/(public)/login" />
	}

	if (auth.uid) {
		console.log('User authenticated, redirecting to private')
		return <Redirect href="/(private)" />
	}

	console.log('No uid, redirecting to login')
	return <Redirect href="/(public)/login" />
}
