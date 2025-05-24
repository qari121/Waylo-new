import { View, StyleSheet } from 'react-native'

import { FloatingMenu } from '../../components/floating-menu'
import { ProfileScreen } from '../../screens/profile'

export default function Page() {
	return (
		<View style={styles.container}>
			<ProfileScreen />
			<FloatingMenu />
		</View>
	)
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
		gap: 20, // gap-5 (approx 20px)
		backgroundColor: 'rgba(241,245,249,0.3)', // bg-secondary/30, adjust as needed
		padding: 1, // p-6 (6*4=24)
	},

});