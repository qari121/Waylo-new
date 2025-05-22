import { View } from 'react-native'

import { FloatingMenu } from '../../components/floating-menu'
import { QRCodeScreen } from '../../screens/qrcode'

export default function Page() {
	return (
		<View className="relative flex-1 gap-5 bg-secondary/30 p-6">
			<QRCodeScreen />
			<FloatingMenu />
		</View>
	)
}
