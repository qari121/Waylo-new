import { View } from 'react-native'

import AuthMiddleware from '@components/auth-middleware'
import { FloatingMenu } from '@components/floating-menu'
import { HomeScreen } from '@screens/home'

export default function Page() {
	return (
		<AuthMiddleware>
			<View className="relative flex-1 gap-5 bg-secondary/30 p-6">
				<HomeScreen />
				<FloatingMenu />
			</View>
		</AuthMiddleware>
	)
}
