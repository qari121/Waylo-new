import { SafeAreaView, StyleSheet } from 'react-native'

export const Container = ({ children }: { children: React.ReactNode }) => {
	return <SafeAreaView style={styles.container}>{children}</SafeAreaView>
}

const styles = StyleSheet.create({
	container: {
		margin: 24, // m-6 (6*4=24)
		flex: 1,
	},
});
