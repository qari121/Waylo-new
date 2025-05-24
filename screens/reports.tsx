/* eslint-disable react-native/no-color-literals */
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View, StyleSheet, Platform, Dimensions } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import { LineChart } from 'react-native-gifted-charts'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import { Ionicons } from '@expo/vector-icons'

import { format } from 'date-fns'

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
import ChevronLeftIcon from '../assets/icons/chevron-left.svg'
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

export const ReportScreen = () => {
	const router = useRouter()
	const insets = useSafeAreaInsets()
	const dispatch = useAppDispatch()
	const reportType = useLocalSearchParams()
	const sentimentsByDate = useAppSelector((state) => state.sentiments.sentimentsByDate)
	const weeklyLogRanges = useAppSelector((state) => state.logs.weeklyLogs)
	const dailyLogRanges = useAppSelector((state) => state.logs.dailyLogs)
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

	useEffect(() => {
		const fetchSentiments = async () => {
			try {
				await dispatch(fetchSentimentsByDate()).unwrap()
			} catch (err: any) {
				Toast.show({ type: 'error', text1: err ?? 'Failed to fetch sentiment records' })
			}
		}
		if (reportDuration?.value === 'day') {
			fetchDailyLogs()
		} else {
			fetchWeeklyLogs()
		}
		fetchSentiments()
	}, [reportDuration])

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
							<Pressable onPress={() => router.dismiss()}>
								<ChevronLeftIcon />
							</Pressable>
							<Text style={[styles.headerTitle, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Reports</Text>
							<Text />
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
							<View style={styles.statsLeftColumn}>
								<View style={styles.sleepCard}>
									<Image
										resizeMode="stretch"
										height={104}
										width={WINDOW_DIMENSIONS.width}
										source={require('../assets/images/sleep-image.png')}
										style={styles.sleepImage}
									/>
									<View style={styles.sleepHeader}>
										<Text style={[styles.sleepTitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Sleep</Text>
										<EyeIcon size={16} color="#C5C5C5" />
									</View>
									<View style={styles.sleepContent}>
										<Text style={[styles.sleepLabel, { fontFamily: 'PlusJakartaSans_400Regular' }]}>Avg. time</Text>
										<Text style={[styles.sleepValue, { fontFamily: 'PlusJakartaSans_500Medium' }]}>8hrs 20mins</Text>
									</View>
								</View>
								<View style={[styles.studyCard, { elevation: 5 }]}>
									<View style={styles.studyContent}>
										<View style={styles.studyHeader}>
											<Text style={[styles.studyTitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Study</Text>
											<OpenBookIcon />
										</View>
										<ClosedBookIcon />
										<View style={styles.studyStats}>
											<Text style={[styles.studyStatsText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>8 lessons</Text>
										</View>
									</View>
									<Image source={require('../assets/images/study-image.png')} />
								</View>
							</View>
							<View style={[styles.moodReportCard, { elevation: 5 }]}>
								<View style={styles.moodReportContent}>
									<View style={styles.moodReportHeader}>
										<Text style={[styles.moodReportTitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Mood Report</Text>
										<Ionicons name="eye-outline" size={16} color="#C5C5C5" />
									</View>
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
								<Image source={require('../assets/images/mood-report-image.png')} style={styles.moodReportImage} />
							</View>
						</View>
					</ScrollView>
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
		justifyContent: 'space-between',
		paddingVertical: 10,
	},
	backButton: {
		color: '#0E2C76',
	},
	headerTitle: {
		fontSize: 18,
		letterSpacing: 0.2,
		color: 'black',
	},
	content: {
		flex: 1,
	},
	statsContainer: {
		marginBottom: 112,
		marginTop: 24,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'stretch',
		gap: 16,
	},
	statsLeftColumn: {
		flex: 1,
		flexDirection: 'column',
		gap: 16,
	},
	sleepCard: {
		position: 'relative',
		minHeight: 104,
		width: '100%',
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
		overflow: 'hidden',
		borderRadius: 8,
		padding: 12,
	},
	sleepImage: {
		position: 'absolute',
		inset: 0,
		...(Platform.OS === 'web' && {
			height: '100%',
			width: '100%',
		}),
	},
	sleepHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	sleepTitle: {
		fontWeight: '500',
		color: 'white',
	},
	sleepContent: {
		flexDirection: 'column',
	},
	sleepLabel: {
		fontSize: 12,
		fontWeight: '300',
		color: 'white',
	},
	sleepValue: {
		fontWeight: '500',
		color: 'white',
	},
	studyCard: {
		minHeight: 88,
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
		borderRadius: 8,
		borderWidth: 0.5,
		borderColor: '#D9D9D9',
		backgroundColor: 'white',
		padding: 12,
	},
	studyContent: {
		flexGrow: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	studyHeader: {
		flexGrow: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
		gap: 12,
	},
	studyTitle: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		fontWeight: '500',
		color: '#515151',
	},
	studyStats: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	studyStatsText: {
		fontSize: 12,
		color: '#515151',
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
	moodReportContent: {
		flexDirection: 'column',
		gap: 18,
	},
	moodReportHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
	},
	moodReportTitle: {
		fontWeight: '500',
		color: '#515151',
	},
	moodReportScroll: {
		maxHeight: 60,
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
})
