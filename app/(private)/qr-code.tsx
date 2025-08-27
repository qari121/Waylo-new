import { View, StyleSheet } from 'react-native'

import QRCodeScreen from '../../screens/qrcode'

export default function Page() {
	return (
		<View style={styles.container}>
			<QRCodeScreen />
		</View>
	)
}
const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
		gap: 20, // gap-5 (approx 20px)
		backgroundColor: 'rgba(241,245,249,0.3)', // bg-secondary/30, adjust as needed
		padding: 4, // p-6 (6*4=24)
	},
});