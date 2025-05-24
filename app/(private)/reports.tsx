import { View, StyleSheet } from 'react-native'

import { FloatingMenu } from '../../components/floating-menu'
import { ReportScreen } from '../../screens/reports'

export default function Page() {
	return (
		<View style={styles.container}>
			<ReportScreen />
			<FloatingMenu />
		</View>
	)
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
		gap: 20, // gap-5 (approx 20px)
		backgroundColor: 'white', // bg-secondary/30, adjust as needed
		padding: 0,
		marginTop: -10, // p-6 (6*4=24)
	},
});