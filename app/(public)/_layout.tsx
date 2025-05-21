import { Redirect, Stack } from 'expo-router'
import { useAppSelector } from 'hooks'
import { View, Text } from 'react-native'
import React from 'react'

export default function PublicLayout() {
	console.log('PublicLayout rendering');
	const auth = useAppSelector((state) => {
		console.log('Auth state:', state.auth);
		return state.auth;
	});

	if (auth.uid) {
		console.log('Redirecting to private route');
		return <Redirect href="/(private)" />;
	}

	console.log('Rendering public stack');
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: 'none',
				presentation: 'card',
				orientation: 'portrait',
				gestureEnabled: false
			}}>
			<Stack.Screen name="login" />
			<Stack.Screen name="register" />
		</Stack>
	);
}
