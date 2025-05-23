import { View, StyleSheet } from 'react-native'

import AuthMiddleware from '../../components/auth-middleware'
import { FloatingMenu } from '../../components/floating-menu'
import { HomeScreen } from '../../screens/home'

const Page = () => {
	return (
		<AuthMiddleware>
			<View style={styles.container}>
				<HomeScreen />
				<FloatingMenu />
			</View>
		</AuthMiddleware>
	)
}
export default Page;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
		gap: 20, // gap-5 (approx 20px)
		backgroundColor: 'rgba(241,245,249,0.3)', // bg-secondary/30, adjust as needed
		padding: 24, // p-6 (6*4=24)
	},
});