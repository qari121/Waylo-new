import AuthMiddleware from '../../components/auth-middleware'
import { Stack } from 'expo-router'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function PrivateLayout() {
	const insets = useSafeAreaInsets()
	
	return (
		<AuthMiddleware>
			<View style={{ flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'ios' ? insets.top : 0 }}>
				<Stack
					screenOptions={{
						headerShown: false,
						animation: Platform.select({
							ios: 'default',
							android: 'none'
						}),
						presentation: 'card',
						orientation: 'portrait',
						gestureEnabled: Platform.OS === 'ios',
						fullScreenGestureEnabled: false,
						contentStyle: { backgroundColor: 'white' }
					}}>
					<Stack.Screen name="index" />
					<Stack.Screen name="wylo-register" />
					<Stack.Screen name="toy-logs" />
					<Stack.Screen name="subscription" />
					<Stack.Screen name="reports" />
					<Stack.Screen name="qr-code" />
					<Stack.Screen name="profile" />
					<Stack.Screen name="notifications" />
					<Stack.Screen name="character-management" />
				</Stack>
			</View>
		</AuthMiddleware>
	)
}
