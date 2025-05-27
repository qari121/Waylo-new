/* eslint-disable react-native/no-color-literals */
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Image, SafeAreaView, ScrollView, Text, useWindowDimensions, View, StyleSheet, Platform, Dimensions, Modal, TouchableOpacity } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import { LineChart } from 'react-native-gifted-charts'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import { format } from 'date-fns'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

export const ReportScreen = () => {
	const router = useRouter()
	const insets = useSafeAreaInsets()
	const dispatch = useAppDispatch()
	const reportType = useLocalSearchParams()
	const sentimentsByDate = useAppSelector((state) => state.sentiments.sentimentsByDate)
	const weeklyLogRanges = useAppSelector((state) => state.logs.weeklyLogs)
	const dailyLogRanges = useAppSelector((state) => state.logs.dailyLogs)
	const toyLogs = useAppSelector((state) => state.logs.toyLogs)
	const [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold,
	})

	const [isLoading, setIsLoading] = useState(true)
	const [reportDuration, setReportDuration] = useState<Option>(
		reportType?.type === 'daily' ? { label: 'Day', value: 'day' } : { label: 'Week', value: 'week' }
	)
	const [showMoodModal, setShowMoodModal] = useState(false)
	const [summary, setSummary] = useState<string | null>(null)
	const [isSummarizing, setIsSummarizing] = useState(false)

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

	const fetchWeeklyLogs = useCallback(async () => {
		try {
			await dispatch(fetchWeeklyLogRanges()).unwrap()
			setIsLoading(false)
		} catch (err: any) {
			Toast.show({ type: 'error', text1: err ?? 'Failed to fetch weekly logs' })
		}
	}, [])

	const fetchDailyLogs = useCallback(async () => {
		try {
			await dispatch(fetchDailyLogRanges()).unwrap()
			setIsLoading(false)
		} catch (err: any) {
			Toast.show({ type: 'error', text1: err ?? 'Failed to fetch daily logs' })
		}
	}, [])

	const getLogsForSelectedTimeframe = () => {
		if (!toyLogs || toyLogs.length === 0) return []
		if (reportDuration?.value === 'day') {
			const latestDay = dailyLogRanges?.[0]?.date
			return toyLogs.filter(log => {
				const logDate = new Date(log.time).toISOString().split('T')[0]
				return logDate === latestDay
			})
		} else {
			const latestWeek = Object.keys(weeklyLogRanges ?? {}).sort().reverse()[0]
			const weekDates = (weeklyLogRanges?.[latestWeek] ?? []).map(l => l.date)
			return toyLogs.filter(log => {
				const logDate = new Date(log.time).toISOString().split('T')[0]
				return weekDates.includes(logDate)
			})
		}
	}

	const fetchSummary = async (text: string) => {
		setIsSummarizing(true)
		try {
			const response = await fetch('https://summarize-k3jpln37bq-uc.a.run.app', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text }),
			})
			const data = await response.json()
			setSummary(data.summary)
		} catch (err: any) {
			Toast.show({ type: 'error', text1: err.message || 'Failed to summarize' })
		} finally {
			setIsSummarizing(false)
		}
	}

	useEffect(() => {
		const fetchData = async () => {
			try {
				const macAddress = await AsyncStorage.getItem('macAddress')
				if (!macAddress || !isValidMac(macAddress)) {
					Toast.show({ type: 'error', text1: 'Please enter a valid MAC address before viewing reports.' })
					setIsLoading(false)
					return
				}
				if (reportDuration?.value === 'day') {
					await dispatch(fetchDailyLogRanges(macAddress)).unwrap()
				} else {
					await dispatch(fetchWeeklyLogRanges(macAddress)).unwrap()
				}
				await dispatch(fetchSentimentsByDate(macAddress)).unwrap()
				setIsLoading(false)
			} catch (err: any) {
				Toast.show({ type: 'error', text1: err ?? 'Failed to fetch report data' })
				setIsLoading(false)
			}
		}
		fetchData()
	}, [reportDuration])

	useEffect(() => {
		const logs = getLogsForSelectedTimeframe()
		const textToSummarize = logs.map(log => log.message).join(' ')
		if (textToSummarize) {
			fetchSummary(textToSummarize)
		} else {
			setSummary(null)
		}
	}, [reportDuration, toyLogs, dailyLogRanges, weeklyLogRanges])

	if (!fontsLoaded) {
		return null
	}

	return (
		<React.Fragment>
			{isLoading ? (
				<View style={styles.loadingContainer}>
					<Chase size={24} color="#CBC0FE" />
					<Text style={[styles.loadingText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>Loading Reports...</Text>
				</View>
			) : (
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
										<SelectItem label="Day" value="day">
											Day
										</SelectItem>
										<SelectItem label="Week" value="week">
											Week
										</SelectItem>
									</SelectContent>
								</Select>
								<Button
									style={[styles.downloadButton, { elevation: 5 }]}>
									<DownloadIcon />
								</Button>
							</View>
						</View>
						<View style={styles.chartContainer}>
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
						</View>
						<View style={styles.chartLegend}>
							<View style={styles.legendIndicator} />
							<Text style={[styles.legendText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>Interaction</Text>
						</View>
						<View style={styles.statsContainer}>
							<View style={[styles.moodReportCard, styles.moodReportCardFull, { elevation: 5 }]}>
								<View style={styles.moodReportContentRow}>
									<Text style={[styles.moodReportTitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Mood report</Text>
									<TouchableOpacity style={styles.moodPlusButton} onPress={() => setShowMoodModal(true)}>
										<Text style={styles.moodPlusText}>+</Text>
									</TouchableOpacity>
								</View>
								{(() => {
									const latestDate = Object.keys(sentimentsByDate ?? {}).sort().reverse()[0]
									const latestRecords = latestDate ? (sentimentsByDate ?? {})[latestDate] : {}
									return (
										<View style={styles.moodSummaryRow}>
											{Object.entries(latestRecords ?? {}).map(([mood], idx) => (
												<View key={idx} style={styles.moodSummaryItem}>
													{emojiIcons[mood] ? React.createElement(emojiIcons[mood], { width: 32, height: 32 }) : null}
												</View>
											))}
										</View>
									)
								})()}
								<Image source={require('../assets/images/mood-report-image.png')} style={styles.moodReportImageNew} />
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
					<Modal
						visible={showMoodModal}
						animationType="slide"
						transparent
						onRequestClose={() => setShowMoodModal(false)}>
						<View style={styles.modalOverlay}>
							<View style={styles.modalContent}>
								<TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowMoodModal(false)}>
									<Text style={styles.modalCloseText}>×</Text>
								</TouchableOpacity>
								<ScrollView
									horizontal={false}
									bounces={false}
									nestedScrollEnabled
									showsVerticalScrollIndicator
									showsHorizontalScrollIndicator={false}
									style={styles.moodReportScroll}>
									{Object.entries(sentimentsByDate ?? {}).map(([date, records], index) => (
										<View key={index} style={styles.moodReportEntry}>
											<Text style={[styles.moodReportDate, { fontFamily: 'PlusJakartaSans_700Bold' }]}>
												{format(new Date(date), 'dd MMM yyyy')}
											</Text>
											<View style={styles.moodReportList}>
												{Object.entries(records ?? {}).map(([mood, number], index) => (
													<View key={index} style={styles.moodReportItem}>
														<View style={styles.moodLabel}>
															<Text style={[styles.moodText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>{mood}</Text>
															{emojiIcons[mood] ? React.createElement(emojiIcons[mood]) : null}
														</View>
														<Text style={[styles.moodCount, { fontFamily: 'PlusJakartaSans_400Regular' }]}>{number}</Text>
													</View>
												))}
											</View>
										</View>
									))}
								</ScrollView>
							</View>
						</View>
					</Modal>
				</SafeAreaView>
			)}
		</React.Fragment>
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
		width: '91.666667%',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	moodLabel: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2,
	},
	moodText: {
		fontSize: 12,
		marginRight: 30,
		textTransform: 'capitalize',
	},
	moodCount: {
		fontSize: 14,
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
	modalContent: {
		width: '90%',
		minHeight: '55%',
		backgroundColor: 'white',
		borderRadius: 16,
		padding: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
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
})

export default ReportScreen
