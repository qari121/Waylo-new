import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet, Platform, SafeAreaView, Modal, TouchableOpacity, StatusBar, Dimensions, ActivityIndicator, AppState } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks';
import Toast from 'react-native-toast-message';
import { Auth, getAuth } from 'firebase/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../store';
import { ensureMacAddress } from '../utils/ensureMacAddress';
import { useFocusEffect } from 'expo-router';

import { cn } from '../lib/utils';
import { auth as firebaseAuth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { theme } from '../lib/theme';

import { logout } from '../slices/auth';
import { fetchSentimentsCount } from '../slices/sentiments';
import { toyLogs } from '../slices/logs';

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
import CalendarIcon from '../assets/icons/calendar.svg';

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
		{ day: 'Mon', mood: 'none' },
		{ day: 'Tue', mood: 'none' },
		{ day: 'Wed', mood: 'none' },
		{ day: 'Thu', mood: 'none' },
		{ day: 'Fri', mood: 'none' },
		{ day: 'Sat', mood: 'none' },
		{ day: 'Sun', mood: 'none' }
	]

	const reduxMac = useAppSelector((state: RootState) => (state.auth as any).mac_address) as string | undefined;
	const [macAddress, setMacAddress] = useState<string | null>(reduxMac ?? null);
	const { sentimentRecord: cachedSentiments, fetchedAt } = useAppSelector((state: RootState) => state.sentiments);
	const ttlMs = .5 * 60_000;
	const pageReadyRedux = useMemo(() => {
		if (!reduxMac) return true;                    // no device yet → render immediately with prompt
		if (!ensureMacAddress(reduxMac)) return true; // invalid stored value → same prompt
		const cacheValid = fetchedAt && (Date.now() - fetchedAt < ttlMs);
		return cacheValid && !!cachedSentiments;      // we have fresh data in cache
	}, [reduxMac, fetchedAt, cachedSentiments]);
	const [dataFetched, setDataFetched] = useState<boolean>(!!pageReadyRedux);
	const [deviceModalVisible, setDeviceModalVisible] = useState(false);
	const [showScheduling, setShowScheduling] = useState(false);
	const logs = useAppSelector((state) => state.logs.toyLogs);
	const [logsLoading, setLogsLoading] = useState(false);
	const [logsError, setLogsError] = useState<string | null>(null);

	// Show ActivityIndicator only when redux says we don't have fresh cached data yet.
	const pageReady = pageReadyRedux && dataFetched;

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
		sad: SadEmoji,
		none: () => <Text style={{ fontSize: 24, color: '#C5C5C5' }}>—</Text>,
	} as { [mood: string]: React.ElementType }

	const isOnline = true; // or useAppSelector(state => state.network.isOnline)
	const hasPaidModule = true; // or useAppSelector(state => state.user.hasPaidModule)

	const screenWidth = Dimensions.get('window').width;
	const cardWidth = screenWidth * 0.75;
	const cardHeight = 245;
	const cardBorderRadius = 32;

	// Calculate today's usage time from toyLogs
	const today = new Date().toISOString().split('T')[0];
	const todayLogs = logs
		? logs.filter((log: any) => {
			const logDate = new Date(log.time).toISOString().split('T')[0];
			return logDate === today;
		})
		: [];
	let usageSeconds = 0;
	if (todayLogs.length >= 2) {
		const times = todayLogs.map((log: any) => new Date(log.time).getTime() / 1000);
		usageSeconds = Math.max(...times) - Math.min(...times);
	}
	const usageMinutes = Math.floor(usageSeconds / 60);
	const usageHours = Math.floor(usageMinutes / 60);
	const usageMins = usageMinutes % 60;
	const usageDisplay = usageHours > 0 ? `${usageHours}h ${usageMins}m` : `${usageMins}m`;

	// Restore useFocusEffect for schedule fetching
	useFocusEffect(
		React.useCallback(() => {
			const fetchData = async () => {
				try {
					const val = await AsyncStorage.getItem('schedule-downtime');
					console.log('HomeScreen - Loaded schedule from AsyncStorage:', val);
					if (val) {
						try {
							const sched = JSON.parse(val);
							console.log('HomeScreen - Parsed schedule:', sched);
							if (sched && sched.start && sched.end) {
								setSchedule(sched);
								let text = '';
								if (sched.date) {
									try {
										const dateObj = new Date(sched.date);
										if (!isNaN(dateObj.getTime())) {
											const dateStr = dateObj.toLocaleDateString(undefined, { 
												weekday: 'short',
												month: 'short', 
												day: 'numeric', 
												year: 'numeric' 
											});
											text = `Downtime ${dateStr} ${sched.start} – ${sched.end}`;
										} else {
											text = `Current Restriction: ${sched.start} – ${sched.end}`;
										}
									} catch (dateError) {
										console.error('HomeScreen - Error parsing date:', dateError);
										text = `Current Restriction: ${sched.start} – ${sched.end}`;
									}
								} else if (sched.start && sched.end) {
									text = `Current Restriction: ${sched.start} – ${sched.end}`;
								} else {
									text = 'No schedule set';
								}
								console.log('HomeScreen - Setting schedule text:', text);
								setScheduleText(text);
							} else {
								console.log('HomeScreen - Invalid schedule structure:', sched);
								setSchedule(null);
								setScheduleText('No schedule set');
							}
						} catch (parseError) {
							console.error('HomeScreen - Error parsing schedule:', parseError);
							setSchedule(null);
							setScheduleText('No schedule set');
							// Clear corrupted data
							try {
								await AsyncStorage.removeItem('schedule-downtime');
								console.log('HomeScreen - Cleared corrupted schedule data');
							} catch (clearError) {
								console.error('HomeScreen - Error clearing corrupted data:', clearError);
							}
						}
					} else {
						console.log('HomeScreen - No schedule found in AsyncStorage');
						setSchedule(null);
						setScheduleText('No schedule set');
					}
				} catch (error) {
					console.error('HomeScreen - Error fetching data:', error);
					setSchedule(null);
					setScheduleText('No schedule set');
				}
			};
			fetchData();
		}, [])
	);

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
		if (reduxMac && isValidMac(reduxMac)) {
			setMacAddress(reduxMac);
		} else {
			AsyncStorage.getItem('macAddress').then(setMacAddress);
		}
	}, [reduxMac]);

	const fetchSentimentsData = useCallback(async () => {
		if (!macAddress || !isValidMac(macAddress)) return;
		const cacheValid = fetchedAt && Date.now() - fetchedAt < ttlMs;
		if (cacheValid && cachedSentiments) {
			const updated = defaultSentiments.map((entry) => {
				const fullDay = entry.day;
				if (!fullDay || !cachedSentiments[fullDay]) return entry;
				const most = Object.entries(cachedSentiments[fullDay]).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
				return { ...entry, mood: most };
			});
			setSentiments(updated);
			setDataFetched(true);
		} else {
			try {
				const response = await dispatch(fetchSentimentsCount(macAddress)).unwrap();
				const updated = defaultSentiments.map((entry) => {
					const fullDay = entry.day;
					if (!fullDay || !response[fullDay]) return entry;
					const most = Object.entries(response[fullDay]).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
					return { ...entry, mood: most };
				});
				setSentiments(updated);
				setDataFetched(true);
			} catch (err: any) {
				Toast.show({ type: 'error', text1: err ?? 'Failed to fetch sentiment records' });
			}
		}
	}, [macAddress, fetchedAt, cachedSentiments, dispatch]);

	// Initial fetch when dependencies change
	useEffect(() => {
		fetchSentimentsData();
	}, [fetchSentimentsData]);

	// Refresh whenever the home screen gains focus (e.g., user navigates back later in the week)
	useFocusEffect(
		useCallback(() => {
			fetchSentimentsData();
		}, [fetchSentimentsData])
	);

	// helper to convert sentiment record to the list used by UI
	const buildSentiments = (record: Record<string, Record<string, number>> | null) => {
		if (!record) return defaultSentiments;
		return defaultSentiments.map((entry) => {
			const dayData = record[entry.day];
			if (!dayData) return { ...entry, mood: 'none' };
			const most = Object.entries(dayData).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
			return { ...entry, mood: most };
		});
	};

	const [sentiments, setSentiments] = useState<{ day: string; mood: string }[]>(
		pageReadyRedux ? buildSentiments(cachedSentiments) : defaultSentiments
	);

	// Fetch logs if not present
	useEffect(() => {
		if (!macAddress || !isValidMac(macAddress)) return;
		if (logs && logs.length > 0) return;
		setLogsLoading(true);
		dispatch(toyLogs(macAddress))
			.unwrap()
			.catch((err: any) => setLogsError(err?.message || 'Failed to fetch usage logs'))
			.finally(() => setLogsLoading(false));
	}, [macAddress, dispatch]);

	// Get last 3 used app icons (show only if appIcon exists)
	const appIcons = logs
		.filter((log: any) => !!log.appIcon)
		.map((log: any, idx: number) => (
			<Image
				key={idx}
				source={{ uri: log.appIcon }}
				style={styles.usageAppIcon}
			/>
		));

	const [schedule, setSchedule] = useState<{date: string, start: string, end: string, label: string} | null>(null);
	const [scheduleText, setScheduleText] = useState('No schedule set');

	// Also load schedule on component mount
	useEffect(() => {
		const loadSchedule = async () => {
			try {
				const val = await AsyncStorage.getItem('schedule-downtime');
				console.log('HomeScreen - Initial load schedule from AsyncStorage:', val);
				if (val) {
					try {
						const sched = JSON.parse(val);
						console.log('HomeScreen - Initial parsed schedule:', sched);
						if (sched && sched.start && sched.end) {
							setSchedule(sched);
							let text = '';
							if (sched.date) {
								try {
									const dateObj = new Date(sched.date);
									if (!isNaN(dateObj.getTime())) {
										const dateStr = dateObj.toLocaleDateString(undefined, { 
											weekday: 'short',
											month: 'short', 
											day: 'numeric', 
											year: 'numeric' 
										});
										text = `Downtime ${dateStr} ${sched.start} – ${sched.end}`;
									} else {
										text = `Current Restriction: ${sched.start} – ${sched.end}`;
									}
								} catch (dateError) {
									console.error('HomeScreen - Initial error parsing date:', dateError);
									text = `Current Restriction: ${sched.start} – ${sched.end}`;
								}
							} else if (sched.start && sched.end) {
								text = `Current Restriction: ${sched.start} – ${sched.end}`;
							} else {
								text = 'No schedule set';
							}
							console.log('HomeScreen - Initial setting schedule text:', text);
							setScheduleText(text);
						} else {
							console.log('HomeScreen - Initial invalid schedule structure:', sched);
							setSchedule(null);
							setScheduleText('No schedule set');
						}
					} catch (parseError) {
						console.error('HomeScreen - Initial error parsing schedule:', parseError);
						setSchedule(null);
						setScheduleText('No schedule set');
						// Clear corrupted data
						try {
							await AsyncStorage.removeItem('schedule-downtime');
							console.log('HomeScreen - Initial cleared corrupted schedule data');
						} catch (clearError) {
							console.error('HomeScreen - Initial error clearing corrupted data:', clearError);
						}
					}
				} else {
					console.log('HomeScreen - Initial no schedule found in AsyncStorage');
					setSchedule(null);
					setScheduleText('No schedule set');
				}
			} catch (error) {
				console.error('HomeScreen - Initial error fetching data:', error);
				setSchedule(null);
				setScheduleText('No schedule set');
			}
		};
		loadSchedule();
	}, []);

	const [nearestSchedule, setNearestSchedule] = useState<{ start: string; end: string; date: string | null } | null>(null);

	// Load and find nearest schedule
	useEffect(() => {
		const loadNearestSchedule = async () => {
			try {
				const val = await AsyncStorage.getItem('schedules-downtime');
				if (val) {
					const arr = JSON.parse(val);
					if (Array.isArray(arr) && arr.length > 0) {
						const now = new Date();
						// Map schedules to their next occurrence (date+start time)
						const withDate = arr.map((sched: any) => {
							let schedDate: Date;
							if (sched.date) {
								// Use the schedule's date
								const [h, m] = sched.start.split(':');
								schedDate = new Date(sched.date);
								schedDate.setHours(Number(h), Number(m), 0, 0);
							} else {
								// No date: treat as today
								const [h, m] = sched.start.split(':');
								schedDate = new Date();
								schedDate.setHours(Number(h), Number(m), 0, 0);
							}
							return { ...sched, schedDate };
						});
						// Filter to future or currently active
						const futureOrActive = withDate.filter((sched: any) => {
							const [endH, endM] = sched.end.split(':');
							const endDate = new Date(sched.schedDate);
							endDate.setHours(Number(endH), Number(endM), 0, 0);
							return endDate >= now;
						});
						// Sort by soonest start time
						futureOrActive.sort((a: any, b: any) => a.schedDate.getTime() - b.schedDate.getTime());
						setNearestSchedule(futureOrActive.length > 0 ? futureOrActive[0] : null);
					} else {
						setNearestSchedule(null);
					}
				} else {
					setNearestSchedule(null);
				}
			} catch {
				setNearestSchedule(null);
			}
		};
		loadNearestSchedule();
	}, []);

	if (!pageReady) {
		return (
			<SafeAreaView style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'white' }}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
			<StatusBar translucent backgroundColor="white" barStyle="dark-content" />

			<ScrollView contentContainerStyle={[styles.scrollViewContent, { paddingTop: insets.top }]}>
				<Text style={[styles.greeting, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Hello {auth.username}</Text>
				<Text style={[styles.welcomeText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>Welcome back, check the latest activities</Text>

				{/* Connected Device Box - moved up */}
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
					<Image 
						source={require('../assets/images/avatar.png')} 
						style={styles.connectedDeviceImage} 
						resizeMode="contain"
						fadeDuration={0}
						loadingIndicatorSource={require('../assets/images/avatar-2.png')}
					/>
					<Text style={styles.connectedDeviceTitle}>Connected{"\n"}Device</Text>
				</TouchableOpacity>

				{/* Usage Info Card - moved below Connected Device */}
				<View style={styles.usageInfoCard}>
					<View>
						<Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', fontFamily: 'PlusJakartaSans_700Bold' }}>
							{logsLoading ? '...' : usageDisplay}
						</Text>
						<Text style={{ color: '#C5C5C5', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular' }}>Time spent today</Text>
					</View>
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						{appIcons}
					</View>
				</View>

				{/* Schedules Box */}
				<TouchableOpacity
					style={styles.scheduleCard}
					activeOpacity={0.8}
					onPress={() => router.replace('/parental-controls')}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<View
							style={{
								width: 44,
								height: 44,
								borderRadius: 22,
								backgroundColor: 'white',
								alignItems: 'center',
								justifyContent: 'center',
								marginRight: 14,
							}}
						>
							<CalendarIcon width={28} height={28} />
						</View>
						<View>
							<Text style={{ color: 'white', fontSize: 17, fontWeight: 'bold', fontFamily: 'PlusJakartaSans_600SemiBold' }}>Schedule</Text>
							<Text style={{ color: '#C5C5C5', fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', marginTop: 2 }}>
								{nearestSchedule
									? `Next: ${(nearestSchedule.date ? new Date(nearestSchedule.date).toLocaleDateString() : 'Any')} ${nearestSchedule.start} – ${nearestSchedule.end}`
									: 'No schedule set'}
							</Text>
						</View>
					</View>
				</TouchableOpacity>
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
		backgroundColor: theme.colors.buttonPrimary,
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
		backgroundColor: theme.colors.buttonPrimary + '99',
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
		paddingVertical: 24,
		paddingHorizontal: 8,
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
		flexDirection: 'column',
		gap: 12,
	},
	moodHistoryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	moodHistoryRowActive: {
		backgroundColor: '#F4F3EC',
		borderRadius: 12,
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	moodHistoryDayActive: {
		color: '#7D65FC',
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
		right: -20,
		bottom: -20,
		zIndex: 1,
		width: 250,
		height: 250,
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
		backgroundColor: theme.colors.buttonPrimary,
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
		backgroundColor: theme.colors.buttonPrimary,
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
		marginTop: 12,
		width: '100%',
		backgroundColor: theme.colors.buttonPrimary,
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
	moodHistoryCard: {
		width: '100%',
		backgroundColor: '#fff',
		borderRadius: 20,
		padding: 24,
		marginTop: 18,
		marginBottom: 112,
		flexDirection: 'column',
		gap: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
	},
	moodHistoryTitle: {
		color: '#404040',
	},
	usageInfoCard: {
		width: '100%',
		backgroundColor: '#A6A6A6',
		borderRadius: 20,
		padding: 24,
		marginTop: 18,
		marginBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 4,
	},
	usageAppIcon: {
		width: 36,
		height: 36,
		borderRadius: 10,
		marginLeft: -8,
		borderWidth: 2,
		borderColor: '#23232B',
		backgroundColor: '#fff',
	},
	usageAppIconPlaceholder: {
		width: 36,
		height: 36,
		borderRadius: 10,
		marginLeft: -8,
		backgroundColor: '#444',
		opacity: 0.3,
	},
	scheduleCard: {
		width: '100%',
		backgroundColor: theme.colors.buttonPrimary,
		opacity: 0.8,
		borderRadius: 20,
		padding: 24,
		marginTop: 18,
		marginBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 4,
	},
	scheduleIconWrapper: {
		width: 44,
		height: 44,
		borderRadius: 12,
		backgroundColor: '#3B5BDB',
		alignItems: 'center',
		justifyContent: 'center',
	},
})
