import { View, StyleSheet } from 'react-native'

import { FloatingMenu } from '../../components/floating-menu'
import { NotificationScreen } from '../../screens/notifications'

export default function Page() {
	return (
		<View style={styles.container}>
			<NotificationScreen />
			<FloatingMenu />
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'white', 
		marginTop: -70,
	},
});
