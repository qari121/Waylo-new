import { View } from 'react-native'

import { FloatingMenu } from '@components/floating-menu'
import { NotificationScreen } from '@screens/notifications'

export default function Page() {
	return (
		<View className="relative flex-1 gap-5 bg-secondary/30 p-6">
			<NotificationScreen />
			<FloatingMenu />
		</View>
	)
}
