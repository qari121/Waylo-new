/* eslint-disable react-native/no-color-literals */
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Image, SafeAreaView, ScrollView, Text, useWindowDimensions, View, StyleSheet, Platform, Dimensions, Modal, TouchableOpacity, Pressable } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import { LineChart } from 'react-native-gifted-charts'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import { format } from 'date-fns'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ensureMacAddress } from '../utils/ensureMacAddress'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

import { Button } from '../components/ui/button'
import {
	Option,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '../components/ui/select'
import { Eye as EyeIcon } from 'lucide-react-native'
import { fetchDailyLogRanges, fetchWeeklyLogRanges } from '../slices/logs'
import { fetchSentimentsByDate } from '../slices/sentiments'
import { useAppDispatch, useAppSelector } from '../hooks'
import ClosedBookIcon from '../assets/icons/closed-book.svg'
import DownloadIcon from '../assets/icons/download.svg'
import CryingEmoji from '../assets/icons/emoji-loudly-crying-face.svg'
import NeutralEmoji from '../assets/icons/emoji-neutral-face.svg'
import SadEmoji from '../assets/icons/emoji-pensive-face.svg'
import AngryEmoji from '../assets/icons/emoji-pouting-face.svg'
import HappyEmoji from '../assets/icons/emoji-slightly-smiling-face.svg'
import OpenBookIcon from '../assets/icons/open-book.svg'
import MicrophoneIcon from '../assets/icons/microphone.svg'
import BrickBackground from '../assets/icons/brick_background.svg'
import Waves from '../assets/icons/waves.svg'

const WINDOW_DIMENSIONS = Dimensions.get('window')

const emojiIcons = {
	happy: HappyEmoji,
	excited: HappyEmoji,
	neutral: NeutralEmoji,
	angry: AngryEmoji,
	anxious: CryingEmoji,
	sad: SadEmoji
} as { [mood: string]: React.ElementType }

const isValidMac = (input: string) => /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(input)

type TimeSpan = 'morning' | 'afternoon' | 'evening' | 'night';
type MoodType = 'happy' | 'sad' | 'anxious' | 'neutral';

interface TimeSpanMoods {
	morning: MoodType | null;
	afternoon: MoodType | null;
	evening: MoodType | null;
	night: MoodType | null;
}

export const ReportScreen = () => {
	const router = useRouter()
	const insets = useSafeAreaInsets()
	const dispatch = useAppDispatch()
	const reportType = useLocalSearchParams()
	const sentimentsByDate = useAppSelector((state) => state.sentiments.sentimentsByDate)
	const weeklyLogRanges = useAppSelector((state) => state.logs.weeklyLogs)
	const dailyLogRanges = useAppSelector((state) => state.logs.dailyLogs)
	const toyLogs = useAppSelector((state) => state.logs.toyLogs)
	const auth = useAppSelector(state => state.auth)
	const [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold,
	})

	const [isLoading, setIsLoading] = useState(true)
	const [isInitialized, setIsInitialized] = useState(false)
	const [reportDuration, setReportDuration] = useState<Option>(
		reportType?.type === 'daily' ? { label: 'Day', value: 'day' } : { label: 'Week', value: 'week' }
	)
	const [showMoodModal, setShowMoodModal] = useState(false)
	const [summary, setSummary] = useState<string | null>(null)
	const [isSummarizing, setIsSummarizing] = useState(false)
	const [macAddress, setMacAddress] = useState<string | null>(null)
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
	const [timeSpanMoods, setTimeSpanMoods] = useState<TimeSpanMoods>({
		morning: null,
		afternoon: null,
		evening: null,
		night: null
	})
	const [macChecked, setMacChecked] = useState(false)

	const allowedDurations = auth.plan === "pro"
		? [{ label: 'Day', value: 'day' }, { label: 'Week', value: 'week' }]
		: [{ label: 'Week', value: 'week' }]

	const generateWeeklyChartData = () => {
		if (!weeklyLogRanges) return []

		const sortedWeeks = Object.entries(weeklyLogRanges).sort(
			([weekA], [weekB]) =>
				parseInt(weekA.replace(/\D/g, ''), 10) - parseInt(weekB.replace(/\D/g, ''), 10)
		)

		return sortedWeeks.map(([_, logs], index) => {
			const totalHours = logs.reduce((sum, log) => sum + log.hours, 0)

			return {
				value: totalHours,
				labelComponent: index % 2 === 0 ? () => customLabel(`Week ${index + 1}`) : undefined,
				hideDataPoint: true
			}
		})
	}

	const generateDailyChartData = () => {
		if (!dailyLogRanges || dailyLogRanges.length === 0) return []

		const sortedLogs = [...dailyLogRanges].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
		)

		return sortedLogs.map((log, index) => {
			return {
				value: log.hours,
				labelComponent: index % 2 === 0 ? () => customLabel(`Day ${index + 1}`) : undefined,
				hideDataPoint: true
			}
		})
	}

	const CHART_WIDTH = WINDOW_DIMENSIONS.width - 70

	const data =
		reportDuration?.value === 'week' ? generateWeeklyChartData() : generateDailyChartData()

	const contentInsets = {
		top: insets.top,
		bottom: insets.bottom,
		left: 12,
		right: 12
	}

	const customLabel = (val: string) => {
		return (
			<View style={styles.labelContainer}>
				<Text style={{ textAlign: 'right', color: '#666666', fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular' }}>{val}</Text>
			</View>
		)
	}

	// Initialize MAC address and data
	useEffect(() => {
		const initializeData = async () => {
			try {
				const storedMac = await AsyncStorage.getItem('macAddress')
				if (storedMac && isValidMac(storedMac)) {
					setMacAddress(storedMac)
					setIsLoading(true)
					
					// Fetch initial data
					if (reportDuration?.value === 'day') {
						await dispatch(fetchDailyLogRanges(storedMac)).unwrap()
					} else {
						await dispatch(fetchWeeklyLogRanges(storedMac)).unwrap()
					}
					await dispatch(fetchSentimentsByDate(storedMac)).unwrap()
				}
			} catch (err: any) {
				console.error('Error initializing data:', err)
				Toast.show({ type: 'error', text1: err?.message ?? 'Failed to initialize data' })
			} finally {
				setIsLoading(false)
				setIsInitialized(true)
			}
		}

		if (!isInitialized) {
			initializeData()
		}
	}, [isInitialized])

	// Handle report duration changes
	useEffect(() => {
		const fetchData = async () => {
			if (!macAddress || !isValidMac(macAddress)) {
				Toast.show({ type: 'error', text1: 'Please enter a valid MAC address before viewing reports.' })
				return
			}

			try {
				setIsLoading(true)
				if (reportDuration?.value === 'day') {
					await dispatch(fetchDailyLogRanges(macAddress)).unwrap()
				} else {
					await dispatch(fetchWeeklyLogRanges(macAddress)).unwrap()
				}
				await dispatch(fetchSentimentsByDate(macAddress)).unwrap()
			} catch (err: any) {
				console.error('Error fetching report data:', err)
				Toast.show({ type: 'error', text1: err?.message ?? 'Failed to fetch report data' })
			} finally {
				setIsLoading(false)
			}
		}

		if (isInitialized) {
			fetchData()
		}
	}, [reportDuration, macAddress, isInitialized])

	// Handle MAC address changes
	useEffect(() => {
		const checkMacAddress = async () => {
			const storedMac = await AsyncStorage.getItem('macAddress')
			if (storedMac !== macAddress) {
				setMacAddress(storedMac)
				setIsInitialized(false) // Reset initialization to trigger data reload
			}
			setMacChecked(true)
		}
		checkMacAddress()
	}, [])

	const showDatePicker = () => setDatePickerVisibility(true)
	const hideDatePicker = () => setDatePickerVisibility(false)
	const handleConfirm = (date: Date) => {
		setSelectedDate(date)
		hideDatePicker()
	}

	const fetchMoodsByDate = async (date: Date) => {
		if (!macAddress) return;
		try {
			const start = new Date(date);
			start.setHours(0, 0, 0, 0);
			const end = new Date(date);
			end.setHours(23, 59, 59, 999);
			const moodsRef = collection(db, 'sentiment_logs');
			const q = query(
				moodsRef,
				where('toy_mac_address', '==', macAddress)
			);
			const querySnapshot = await getDocs(q);
			const moods: TimeSpanMoods = {
				morning: null,
				afternoon: null,
				evening: null,
				night: null
			};
			querySnapshot.forEach((doc) => {
				const data = doc.data();
				const sentiment = data.sentiment as MoodType;
				let time: Date;
				if (data.time?.toDate) {
					time = data.time.toDate();
				} else if (data.time?.seconds) {
					time = new Date(data.time.seconds * 1000);
				} else {
					time = new Date();
				}
				if (time >= start && time <= end) {
					const hour = time.getHours();
					let span: TimeSpan | null = null;
					if (hour >= 5 && hour < 12) span = 'morning';
					else if (hour >= 12 && hour < 17) span = 'afternoon';
					else if (hour >= 17 && hour < 21) span = 'evening';
					else span = 'night';
					if (!moods[span]) {
						moods[span] = sentiment;
					}
				}
			});
			setTimeSpanMoods(moods);
		} catch (error) {
			Toast.show({ type: 'error', text1: 'Failed to fetch mood data' });
		}
	}

	useEffect(() => {
		if (macAddress) {
			fetchMoodsByDate(selectedDate)
		}
	}, [selectedDate, macAddress])

	console.log('MAC address in state:', macAddress);
	console.log('ensureMacAddress result:', ensureMacAddress(macAddress));

	if (!fontsLoaded) {
		return null
	}

	if (!macChecked) {
		return <View><Text>Loading...</Text></View>;
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView
				horizontal={false}
				bounces={false}
				showsVerticalScrollIndicator
				style={[styles.container, styles.scrollView]}
				showsHorizontalScrollIndicator={false}>
				<View style={styles.header}>
					<Text style={[styles.headerTitle, { fontFamily: 'PlusJakartaSans_700Bold', textAlign: 'center', flex: 1 }]}>Reports</Text>
				</View>

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
						<View style={[styles.wavesContainer, { borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }]}>
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

				<View style={styles.interactionReportContainer}>
					<Text style={[styles.interactionReportTitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Interaction Report</Text>
					<View style={styles.interactionReportControls}>
						<Select
							value={reportDuration}
							onValueChange={(option) => {
								setIsLoading(true)
								setReportDuration(option)
							}}>
							<SelectTrigger style={styles.selectTrigger}>
								<SelectValue
									style={styles.selectValue}
									placeholder="Duration"
								/>
							</SelectTrigger>
							<SelectContent insets={contentInsets} style={styles.selectContent}>
								{allowedDurations.map(opt => (
									<SelectItem key={opt.value} label={opt.label} value={opt.value}>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						
					</View>
				</View>
				<View style={styles.chartContainer}>
					{!ensureMacAddress(macAddress) ? (
						<View style={{ padding: 24, alignItems: 'center' }}>
							<Text style={{ color: '#7D65FC', fontSize: 16, textAlign: 'center' }}>
								Please pair your device and enter a MAC address to view interaction reports.
							</Text>
						</View>
					) : data.length === 0 ? (
						<View style={{ padding: 24, alignItems: 'center' }}>
							<Text style={{ color: '#7D65FC', fontSize: 16, textAlign: 'center' }}>
								No interaction data available for this device yet.
							</Text>
						</View>
					) : (
						<LineChart
							areaChart
							thickness={5}
							color="#AE9FFF"
							yAxisTextNumberOfLines={2}
							curved
							data={data}
							endSpacing={0}
							height={350}
							noOfSections={5}
							yAxisThickness={0}
							width={CHART_WIDTH}
							xAxisThickness={0}
							startOpacity={1}
							endOpacity={0.1}
							isAnimated
							yAxisTextStyle={{ color: '#666666', fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular' }}
							rulesColor="#D9E7FF"
							rulesType="solid"
							stepValue={2}
							yAxisLabelSuffix="hr"
							yAxisColor="#666666"
							pointerConfig={{
								pointerStripColor: '#D9E7FF',
								pointerStripWidth: 1,
								pointerStripUptoDataPoint: true,
								width: 8,
								height: 8,
								pointerLabelWidth: 60,
								pointerColor: '#0E2C76',
								activatePointersOnLongPress: true,
								pointerLabelComponent: (items: any) => (
									<View
										style={[styles.pointerLabel, { transform: [{ translateY: -20 }] }]}>
										<Text style={styles.pointerLabelText}>
											${items[0].value}
										</Text>
									</View>
								)
							}}
							xAxisColor="#666666"
							startFillColor={'#AE9FFF'}
							endFillColor={'#AE9FFF1A'}
						/>
					)}
				</View>
				<View style={styles.chartLegend}>
					<View style={styles.legendIndicator} />
					<Text style={[styles.legendText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>Interaction</Text>
				</View>
				<View style={styles.statsContainer}>
					<View style={[styles.moodReportCard, styles.moodReportCardFull, { elevation: 5 }]}>
						<View style={styles.moodReportContentRow}>
							<Text style={[styles.moodReportTitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Mood report</Text>
						</View>
						<View style={{ alignItems: 'center', marginBottom: 12 }}>
							<TouchableOpacity style={styles.datePickerButton} onPress={showDatePicker}>
								<Text style={styles.datePickerText}>{format(selectedDate, 'MMM dd, yyyy')}</Text>
							</TouchableOpacity>
							<DateTimePickerModal
								isVisible={isDatePickerVisible}
								mode="date"
								onConfirm={handleConfirm}
								onCancel={hideDatePicker}
								maximumDate={new Date()}
								date={selectedDate}
							/>
						</View>
						{(() => {
							if (!ensureMacAddress(macAddress)) {
								return (
									<View style={{ padding: 12, alignItems: 'center' }}>
										<Text style={{ color: '#7D65FC', fontSize: 14, textAlign: 'center' }}>
											Please pair your device to view mood reports.
										</Text>
									</View>
								);
							}
							const timeSpans = [
								{ label: 'Morning', key: 'morning' as TimeSpan },
								{ label: 'Afternoon', key: 'afternoon' as TimeSpan },
								{ label: 'Evening', key: 'evening' as TimeSpan },
								{ label: 'Night', key: 'night' as TimeSpan }
							];
							const hasAnyMood = Object.values(timeSpanMoods).some(Boolean);
							if (!hasAnyMood) {
								return (
									<View style={{ padding: 12, alignItems: 'center' }}>
										<Text style={{ color: '#7D65FC', fontSize: 14, textAlign: 'center' }}>
											No mood data available for this device yet.
										</Text>
									</View>
								);
							}
							return (
								<View style={styles.moodTimeSpansContainer}>
									{timeSpans.map(({ label, key }) => (
										<View key={key} style={styles.moodTimeSpanItem}>
											<Text style={[styles.moodTimeSpanLabel, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
												{label}
											</Text>
											<View style={styles.moodTimeSpanEmoji}>
												{timeSpanMoods[key] && emojiIcons[timeSpanMoods[key] as MoodType] 
													? React.createElement(emojiIcons[timeSpanMoods[key] as MoodType], { width: 32, height: 32 })
													: <Text style={styles.noMoodText}>-</Text>
												}
											</View>
										</View>
									))}
								</View>
							);
						})()}
					</View>
				</View>
				<View style={{ marginVertical: 16 }}>
					{isSummarizing ? (
						<Text>Summarizing...</Text>
					) : summary ? (
						<Text style={{ fontStyle: 'italic', color: '#333' }}>{summary}</Text>
					) : null}
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: 'white',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center', // Center the title horizontally
		paddingVertical: 10,
	},
	headerTitle: {
		fontSize: 18,
		letterSpacing: 0.2,
		color: 'black',
		flex: 1,
		textAlign: 'center'
	},
	content: {
		flex: 1,
	},
	statsContainer: {
		marginBottom: 112,
		marginTop: 24,
		flex: 1,
		flexDirection: 'column',
		alignItems: 'stretch',
		gap: 16,
	},
	moodReportCard: {
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
		alignSelf: 'stretch',
		overflow: 'hidden',
		borderRadius: 8,
		borderWidth: 0.5,
		borderColor: '#D9D9D9',
		paddingHorizontal: 12,
		paddingTop: 12,
	},
	moodReportCardFull: {
		width: '100%',
		alignSelf: 'center',
		marginTop: 24,
	},
	moodReportContentRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	moodReportTitle: {
		fontWeight: '500',
		color: '#515151',
	},
	moodReportScroll: {
		maxHeight: 400,
		flexDirection: 'column',
		gap: 12,
	},
	moodReportEntry: {
		flexDirection: 'column',
		gap: 8,
	},
	moodReportDate: {
		textAlign: 'center',
		fontSize: 12,
		fontWeight: '700',
	},
	moodReportList: {
		flexGrow: 1,
		flexDirection: 'column',
		alignItems: 'flex-start',
		gap: 4,
	},
	moodReportItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 4,
	},
	moodText: {
		flex: 2,
		fontSize: 14,
		textTransform: 'capitalize',
		textAlign: 'left',
	},
	moodEmojiCol: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		right: 80,
	},
	moodCount: {
		flex: 1,
		fontSize: 14,
		textAlign: 'right',
	},
	moodReportImage: {
		width: '100%',
		height: '50%',
		marginLeft: 5,
		marginTop: -150,
	},
	moodReportImageNew: {
		width: '100%',
		height: 180,
		marginTop: 8,
		resizeMode: 'contain',
	},
	container: {
		flex: 1,
		flexDirection: 'column',
		paddingHorizontal: 20,
		...(Platform.OS === 'web' && {
			marginHorizontal: 'auto',
			width: '33.333333%',
		}),
	},
	scrollView: {
		flex: 1,
	},
	labelContainer: {
		width: 64,
	},
	loadingContainer: {
		flex: 1,
		height: '100%',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	loadingText: {
		fontSize: 18,
		color: '#0E2C76',
	},
	interactionReportContainer: {
		marginTop: 40,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	interactionReportTitle: {
		fontWeight: '500',
		color: 'black',
	},
	interactionReportControls: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	selectTrigger: {
		width: 79,
		borderRadius: 8,
		borderWidth: 0.5,
		borderColor: '#D9D9D9',
		padding: 10,
	},
	selectValue: {
		fontSize: 12,
		color: '#92929D',
	},
	selectContent: {
		width: 79,
	},
	downloadButton: {
		width: 36,
		height: 36,
		borderRadius: 8,
		borderWidth: 0.5,
		borderColor: '#D9D9D9',
		backgroundColor: 'white',
	},
	chartContainer: {
		marginTop: 16,
		width: '100%',
	},
	pointerLabel: {
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 35,
		backgroundColor: '#0E2C76',
		paddingHorizontal: 18,
		paddingVertical: 5,
	},
	pointerLabelText: {
		color: 'white',
		fontSize: 12,
		flexShrink: 0,
		fontFamily: 'PlusJakartaSans_400Regular',
	},
	chartLegend: {
		marginTop: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
	},
	legendIndicator: {
		width: 15,
		height: 15,
		borderRadius: 15,
		backgroundColor: '#AE9FFF',
	},
	legendText: {
		fontSize: 14,
		color: '#666666',
	},
	moodSummaryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: -2,
		marginBottom: 8,
	},
	moodSummaryItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 0,
	},
	moodPlusButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#F2F2F2',
		alignItems: 'center',
		justifyContent: 'center',
		marginLeft: 8,
	},
	moodPlusText: {
		fontSize: 24,
		color: '#515151',
		fontWeight: '700',
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.4)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	moodModalContent: {
		backgroundColor: 'white',
		borderRadius: 20,
		padding: 24,
		width: '90%',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 5,
	},
	moodModalTitle: {
		fontSize: 22,
		fontWeight: '700',
		marginBottom: 4,
		color: '#7D65FC',
	},
	moodModalDate: {
		fontSize: 16,
		color: '#888',
		marginBottom: 16,
	},
	moodGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		width: '100%',
		marginTop: 8,
	},
	moodGridItem: {
		width: '45%',
		alignItems: 'center',
		marginVertical: 12,
		backgroundColor: '#F7F6FD',
		borderRadius: 12,
		padding: 12,
	},
	moodEmojiWrapper: {
		marginBottom: 8,
	},
	moodGridLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: '#515151',
	},
	moodGridMood: {
		fontSize: 14,
		color: '#7D65FC',
		marginTop: 2,
	},
	modalCloseButton: {
		position: 'absolute',
		top: 10,
		right: 10,
		zIndex: 10,
	},
	modalCloseText: {
		fontSize: 28,
		color: '#515151',
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
	wavesOverlay: {
		position: 'absolute',
		zIndex: 40,
		height: '100%',
		width: '100%',
		backgroundColor: '#AE9FFF99',
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
	noMoodText: {
		fontSize: 14,
		color: '#888',
	},
	datePickerButton: {
		backgroundColor: '#F2F2F2',
		padding: 12,
		borderRadius: 8,
	},
	datePickerText: {
		fontSize: 16,
		fontWeight: '600',
		color: '#515151',
	},
	moodTimeSpansContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	moodTimeSpanItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	moodTimeSpanLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: '#515151',
	},
	moodTimeSpanEmoji: {
		marginLeft: 8,
	},
})

export default ReportScreen
