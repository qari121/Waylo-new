import { SafeAreaView, StatusBar, StyleSheet } from 'react-native'

import AuthMiddleware from '../../components/auth-middleware'
import { FloatingMenu } from '../../components/floating-menu'
import { HomeScreen } from '../../screens/home'

const Page = () => {
	return (
		<AuthMiddleware>
			<SafeAreaView style={styles.safeArea}>
				<StatusBar barStyle="dark-content" backgroundColor="#f6f6f6" />
				<HomeScreen />
				<FloatingMenu />
			</SafeAreaView>
		</AuthMiddleware>
	)
}
export default Page;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#f6f6f6', // or whatever color you want
	},
});