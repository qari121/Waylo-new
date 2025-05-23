import { useRouter } from 'expo-router'
import { Image, Pressable, ScrollView, Text, View, StyleSheet, Platform } from 'react-native'

import { Button } from '../components/ui/button'
import { QRCodeIcon, WiFiIcon } from './qrcode'

import ChevronLeftIcon from '../assets/icons/chevron-left.svg'
import TripleArrowsIcon from '../assets/icons/triple-arrows.svg'

export const WifiPairingScreen = () => {
	const router = useRouter()
	return (
		<ScrollView
			horizontal={false}
			bounces={false}
			showsVerticalScrollIndicator
			stickyHeaderIndices={[0]}
			style={styles.scrollView}
			showsHorizontalScrollIndicator={false}>
			<View style={styles.header}>
				<Pressable onPress={() => router.dismiss()}>
					<ChevronLeftIcon />
				</Pressable>
			</View>
			<Text style={styles.title}>Connect device</Text>
			<View style={styles.contentContainer}>
				<View style={styles.stepsContainer}>
					<View style={styles.stepContainer}>
						<Button style={styles.scanButton}>
							<QRCodeIcon color="#B0AEAE" />
							<Text style={styles.scanButtonText}>Scan QR</Text>
						</Button>
						<Text style={styles.stepText}>Step 1</Text>
					</View>
					<TripleArrowsIcon
						style={[styles.arrowIcon, { transform: [{ rotate: '90deg' }] }]}
					/>
					<View style={styles.stepContainer}>
						<Button style={styles.wifiButton}>
							<WiFiIcon color="white" />
							<Text style={styles.wifiButtonText}>Wifi</Text>
						</Button>
						<Text style={styles.stepText}>Step 2</Text>
					</View>
				</View>
				<View style={styles.imageContainer}>
					<Image source={require('@assets/images/wifi.png')} resizeMode="contain" />
				</View>
				<View style={styles.textContainer}>
					<Text style={styles.connectText}>Connect</Text>
					<Text style={styles.connectText}>to Wifi</Text>
					<Text style={styles.instructionText}>
						Go to settings and connect to wifi network and add correct password
					</Text>
				</View>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		flexDirection: 'column',
		paddingHorizontal: 20,
		...(Platform.OS === 'web' && {
			marginHorizontal: 'auto',
			'@media (min-width: 768px)': {
				width: '33.333333%',
			},
		}),
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		paddingTop: 24,
	},
	title: {
		marginTop: 6,
		textAlign: 'center',
		fontSize: 24,
		fontWeight: '600',
		color: 'black',
	},
	contentContainer: {
		position: 'relative',
		zIndex: 10,
		marginBottom: 80,
		marginTop: 21,
		flexDirection: 'column',
		borderRadius: 16,
		backgroundColor: '#EAE6FF',
		paddingHorizontal: 20,
		paddingBottom: 70,
		paddingTop: 20,
		...(Platform.OS === 'web' && {
			'@media (min-width: 768px)': {
				marginHorizontal: 'auto',
				width: '83.333333%',
			},
		}),
	},
	stepsContainer: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'center',
		gap: 12,
		...(Platform.OS === 'web' && {
			'@media (min-width: 768px)': {
				gap: 24,
			},
		}),
	},
	stepContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		gap: 2,
	},
	scanButton: {
		flexDirection: 'row',
		height: 56,
		alignItems: 'center',
		gap: 12,
		borderRadius: 32,
		backgroundColor: 'white',
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	scanButtonText: {
		fontWeight: '600',
		color: '#B0AEAE',
	},
	wifiButton: {
		flexDirection: 'row',
		height: 56,
		alignItems: 'center',
		gap: 12,
		borderRadius: 32,
		backgroundColor: '#0E2C76',
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	wifiButtonText: {
		fontWeight: '600',
		color: 'white',
	},
	stepText: {
		fontSize: 14,
		fontWeight: '600',
		color: '#404040',
	},
	arrowIcon: {
		marginTop: 8,
		flexShrink: 0,
	},
	imageContainer: {
		marginVertical: 40,
		alignItems: 'center',
	},
	textContainer: {
		flexDirection: 'column',
	},
	connectText: {
		fontSize: 24,
		fontWeight: '800',
		lineHeight: 32,
		color: '#404040',
	},
	instructionText: {
		marginTop: 6,
		fontSize: 12,
		fontWeight: '600',
		color: '#515151',
	},
})
