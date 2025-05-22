import { View } from 'react-native'

import { FloatingMenu } from '../../components/floating-menu'
import { CharacterManagementScreen } from '../../screens/character-management'

export default function Page() {
	return (
		<View className="relative flex-1 gap-5 bg-secondary/30 p-6">
			<CharacterManagementScreen />
			<FloatingMenu />
		</View>
	)
}

