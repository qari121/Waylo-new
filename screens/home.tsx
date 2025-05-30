import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet, Platform, SafeAreaView, Modal, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks';
import Toast from 'react-native-toast-message';
import { Auth, getAuth } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { cn } from '../lib/utils';
import { auth as firebaseAuth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

import { logout } from '../slices/auth';
import { fetchSentimentsCount } from '../slices/sentiments';

import BookIcon from '../assets/icons/book.svg';
import ClockIcon from '../assets/icons/clock.svg';
import CryingEmoji from '../assets/icons/emoji-loudly-crying-face.svg';
import NeutralEmoji from '../assets/icons/emoji-neutral-face.svg';
import SadEmoji from '../assets/icons/emoji-pensive-face.svg';
import AngryEmoji from '../assets/icons/emoji-pouting-face.svg';
import HappyEmoji from '../assets/icons/emoji-slightly-smiling-face.svg';
import GameIcon from '../assets/icons/game.svg';
import HealthIcon from '../assets/icons/health.svg';
import Microphone2Icon from '../assets/icons/microphone-2.svg';
import MicrophoneIcon from '../assets/icons/microphone.svg';
import NoteIcon from '../assets/icons/note.svg';
import VideoVerticalIcon from '../assets/icons/video-vertical.svg';
import VideoIcon from '../assets/icons/video.svg';
import { Button } from '../components/ui/button';
import { Chase } from 'react-native-animated-spinkit';
import ConnectedDeviceIcon from '../assets/icons/connected_device.svg';
import BrickBackground from '../assets/icons/brick_background.svg';
import Waves from '../assets/icons/waves.svg';

const isValidMac = (input: string) => /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(input);

export const HomeScreen = () => {
	const router = useRouter()
	const dispatch = useAppDispatch()
	const auth = useAppSelector((state) => state.auth)
	const insets = useSafeAreaInsets();
	const [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold,
	})

	const defaultSentiments = [
		{ day: 'Mon', mood: 'neutral' },
		{ day: 'Tue', mood: 'neutral' },
		{ day: 'Wed', mood: 'neutral' },
		{ day: 'Thu', mood: 'neutral' },
		{ day: 'Fri', mood: 'neutral' },
		{ day: 'Sat', mood: 'neutral' },
		{ day: 'Sun', mood: 'neutral' }
	]

	const [macAddress, setMacAddress] = useState<string | null>(null);
	const [sentiments, setSentiments] = useState<{ day: string; mood: string }[]>(defaultSentiments)
	const [deviceModalVisible, setDeviceModalVisible] = useState(false);
	const [showScheduling, setShowScheduling] = useState(false);

	const activities = [
		{
			icon: MicrophoneIcon,
			title: 'Voice Interaction',
			time: '2 hours ago',
		},
		{
			icon: VideoIcon,
			title: 'Video Capture',
			time: '3 hours ago',
		},
		{
			icon: NoteIcon,
			title: 'Daily Report',
			time: '5 hours ago',
		},
	]

	const emojiIcons = {
		happy: HappyEmoji,
		excited: HappyEmoji,
		neutral: NeutralEmoji,
		angry: AngryEmoji,
		anxious: CryingEmoji,
		sad: SadEmoji
	} as { [mood: string]: React.ElementType }

	const isOnline = true; // or useAppSelector(state => state.network.isOnline)
	const hasPaidModule = true; // or useAppSelector(state => state.user.hasPaidModule)

	const screenWidth = Dimensions.get('window').width;
	const cardWidth = screenWidth * 0.75;
	const cardHeight = 245;
	const cardBorderRadius = 32;

	useEffect(() => {
		const auth = getAuth()
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (!user) {
				dispatch(logout())
				Toast.show({
					type: 'error',
					text1: 'Session expired',
					text2: 'Please login again',
				})
				router.replace('/login')
			}
		})

		return () => unsubscribe()
	}, [dispatch, router])

	useEffect(() => {
		const fetchSentimentRecords = async () => {
			try {
				const mac = await AsyncStorage.getItem('macAddress');
				setMacAddress(mac ? mac : null);
				if (!mac || !isValidMac(mac)) {
					// No Toast, just set state
					return;
				}
				const response = await dispatch(fetchSentimentsCount(mac)).unwrap();
				const updatedSentiments = defaultSentiments.map((entry) => {
					const fullDay = entry.day;
					if (!fullDay || !response[fullDay]) return entry;
					const mostFrequentSentiment = Object.entries(response[fullDay]).reduce((a, b) =>
						a[1] > b[1] ? a : b
					)[0];
					return { ...entry, mood: mostFrequentSentiment };
				});
				setSentiments(updatedSentiments);
			} catch (err: any) {
				Toast.show({ type: 'error', text1: err ?? 'Failed to fetch sentiment records' });
			}
		};
		fetchSentimentRecords();
	}, []);

	if (!fontsLoaded) {
		return null; // Or a loading component
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
			<StatusBar translucent backgroundColor="white" barStyle="dark-content" />

			<ScrollView contentContainerStyle={[styles.scrollViewContent, { paddingTop: insets.top }]}>
				<Text style={[styles.greeting, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Hello {auth.username}</Text>
				<Text style={[styles.welcomeText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>Welcome back, check the latest activities</Text>

				<TouchableOpacity
					activeOpacity={0.8}
					onPress={() => router.push('/ConnectedDevice')}
					style={styles.connectedDeviceBox}
				>
					<View style={StyleSheet.absoluteFill} pointerEvents="none">
						<BrickBackground width="100%" height="100%" preserveAspectRatio="none" />
					</View>
					<View style={styles.connectedDeviceCircle}>
						<ConnectedDeviceIcon width={26} height={26} />
					</View>
					<Image source={require('../assets/images/avatar.png')} style={styles.connectedDeviceImage} resizeMode="contain" />
					<Text style={styles.connectedDeviceTitle}>Connected{"\n"}Device</Text>
				</TouchableOpacity>

				<View style={styles.cardsContainer}>
					<Pressable
						onPress={() => router.push('/toy-logs')}
						style={styles.voiceCard}
					>
						<View style={StyleSheet.absoluteFill} pointerEvents="none">
							<BrickBackground width="100%" height="100%" preserveAspectRatio="none" />
						</View>
						<View style={styles.voiceCardIconCircle}>
							<MicrophoneIcon style={styles.icon} />
						</View>
						<View style={[styles.wavesContainer, { borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }] }>
							<Waves width="100%" height={60} preserveAspectRatio="none" />
							<View style={styles.wavesOverlay} />
						</View>
						<Image
							source={require('../assets/images/avatar.png')}
							style={styles.connectedDeviceImage}
							resizeMode="contain"
						/>
						<View style={styles.cardFooter}>
							<Text style={[styles.cardTitle, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>Chat Interactions</Text>
							<View style={styles.avatarGroup}>
								<Image
									source={require('../assets/images/home_img_1.png')}
									style={styles.avatarThumbnail}
								/>
								<Image
									source={require('../assets/images/home_img_2.png')}
									style={[styles.avatarThumbnail, styles.avatarThumbnailOverlap]}
								/>
							</View>
						</View>
					</Pressable>
				</View>
				{isOnline && hasPaidModule && (
					macAddress && isValidMac(macAddress) ? (
						<View style={styles.moodHistoryContainer}>
							<Text style={[styles.sectionTitle, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>Mood History</Text>
							<View style={styles.moodHistoryList}>
								{sentiments.map((sentiment) => (
									<View
										key={sentiment.day}
										style={[
											styles.moodHistoryItem,
											sentiments[((new Date().getDay() + 6) % 7)].day === sentiment.day && styles.moodHistoryItemActive
										]}
									>
										{emojiIcons[sentiment.mood] && React.createElement(emojiIcons[sentiment.mood])}
										<Text style={[styles.moodHistoryDay, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}> {sentiment.day} </Text>
									</View>
								))}
							</View>
						</View>
					) : (
						<View style={styles.macPromptBox}>
							<Text style={styles.macPromptText}>Enter MAC Address to View Mood History</Text>
						</View>
					)
				)}
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		backgroundColor: 'white',
	},
	greeting: {
		paddingBottom: 12,
		fontSize: 32,
		color: '#404040',
		marginTop: -25,
	},
	welcomeText: {
		color: '#9A9A9A',
	},
	cardsContainer: {
		marginTop: 20,
		flexDirection: 'row',
		alignItems: 'stretch',
		gap: 12,
	},
	voiceCard: {
		width: '100%',
		height: 245,
		borderRadius: 32,
		backgroundColor: '#AE9FFF',
		marginBottom: 14,
		marginTop: 0,
		padding: 24,
		justifyContent: 'flex-end',
		alignItems: 'flex-start',
		position: 'relative',
		overflow: 'hidden',
	},
	voiceCardIconCircle: {
		position: 'absolute',
		top: 24,
		left: 24,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'white',
		zIndex: 2,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconContainer: {
		marginLeft: 16,
		width: 36,
		height: 36,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 18,
		backgroundColor: 'white',
		padding: 16,
	},
	icon: {
		width: 24,
		height: 24,
		flexShrink: 0,
	},
	wavesContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 80,
		overflow: 'hidden',
	},
	wavesImage: {
		width: '100%',
	},
	wavesOverlay: {
		position: 'absolute',
		zIndex: 40,
		height: '100%',
		width: '100%',
		backgroundColor: '#AE9FFF99',
	},
	avatarImage: {
		position: 'absolute',
		right: 0,
		top: 16,
		zIndex: 10,
		width: 150,
		height: 150,
	},
	cardFooter: {
		marginHorizontal: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	cardTitle: {
		width: '50%',
		lineHeight: 24,
		color: 'black',
		fontSize: 20,
		fontWeight: '600',
	},
	avatarGroup: {
		flexDirection: 'row',
		alignItems: 'center',
		left: 120,
		top: 20,
	},
	avatarThumbnail: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: 'white',
		zIndex: 30,
	},
	avatarThumbnailOverlap: {
		position: 'relative',
		zIndex: 20,
		marginLeft: -6,
	},
	moodHistoryContainer: {
		marginBottom: 112,
		marginTop: 18,
		flexDirection: 'column',
		gap: 10,
	},
	moodHistoryList: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 24,
	},
	moodHistoryItem: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'center',
		gap: 6,
	},
	moodHistoryItemActive: {
		borderRadius: 16,
		borderWidth: 0.5,
		borderColor: '#C5C5C5',
		backgroundColor: '#F4F3EC',
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	moodHistoryDay: {
		fontSize: 12,
		color: 'black',
	},
	sectionTitle: {
		color: '#404040',
	},
	connectedDeviceBox: {
		width: '100%',
		height: 245,
		borderRadius: 32,
		backgroundColor: '#A6A6A6',
		marginBottom: 14,
		marginTop: 20,
		padding: 24,
		justifyContent: 'flex-end',
		alignItems: 'flex-start',
		position: 'relative',
		overflow: 'hidden',
	},
	connectedDeviceCircle: {
		position: 'absolute',
		top: 24,
		left: 24,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: 'white',
		zIndex: 2,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	connectedDeviceImage: {
		position: 'absolute',
		right: 24,
		bottom: 24,
		zIndex: 1,
		width: 140,
		height: 140,
		resizeMode: 'contain',
	},
	connectedDeviceTitle: {
		position: 'absolute',
		bottom: 50,
		left: 24,
		fontSize: 20,
		fontWeight: '600',
		color: 'black',
		zIndex: 2,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	deviceModalContentBig: {
		backgroundColor: 'white',
		padding: 30,
		borderRadius: 24,
		width: '90%',
		maxWidth: 500,
		maxHeight: '90%',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	deviceInfoSection: {
		width: '100%',
		marginBottom: 24,
		alignItems: 'center',
	},
	parentalControlsSection: {
		width: '100%',
		alignItems: 'center',
	},
	parentalButtonWrapper: {
		marginHorizontal: 8,
	},
	parentalButton: {
		backgroundColor: '#AE9FFF',
		color: '#fff',
		paddingVertical: 10,
		paddingHorizontal: 18,
		borderRadius: 8,
		fontWeight: 'bold',
		fontSize: 16,
		textAlign: 'center',
	},
	schedulingSection: {
		marginTop: 16,
		alignItems: 'center',
	},
	schedulingInputBox: {
		backgroundColor: '#F2F2F2',
		paddingHorizontal: 16,
		paddingVertical: 6,
		borderRadius: 6,
		marginHorizontal: 4,
	},
	schedulingSaveButton: {
		marginTop: 12,
		backgroundColor: '#7F67FF',
		paddingVertical: 10,
		paddingHorizontal: 32,
		borderRadius: 8,
	},
	closeModalButton: {
		backgroundColor: '#AE9FFF',
		padding: 12,
		borderRadius: 8,
		marginTop: 12,
	},
	scrollViewContent: {
		paddingHorizontal: 20,
		flexGrow: 1,
		justifyContent: 'flex-start',
	},
	macPromptBox: {
		marginTop: 18,
		marginBottom: 112,
		width: '100%',
		backgroundColor: '#AE9FFF',
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
		justifyContent: 'center',
	},
	macPromptText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
	},
})
