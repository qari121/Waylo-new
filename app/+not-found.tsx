import { Text } from '@components/ui/text'
import { Link, Stack } from 'expo-router'
import React from 'react'
import { View } from 'react-native'

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: 'Oops!' }} />
			<View>
				<Text>This screen doesn&apos;t exist.</Text>

				<Link href="/" replace>
					<Text>Go to home screen!</Text>
				</Link>
			</View>
		</>
	)
}
