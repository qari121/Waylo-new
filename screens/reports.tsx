/* eslint-disable react-native/no-color-literals */
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, SafeAreaView, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import { LineChart } from 'react-native-gifted-charts'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

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
import { Eye } from '../lib/icons/Eye'
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
import EyeIcon from '../assets/icons/eye.svg'
import OpenBookIcon from '../assets/icons/open-book.svg'

// Remove useFonts and expo-font

export const ReportScreen = () => {
	const router = useRouter()
	const insets = useSafeAreaInsets()
	const dispatch = useAppDispatch()
	const reportType = useLocalSearchParams()
	const sentimentsByDate = useAppSelector((state) => state.sentiments.sentimentsByDate)
	const weeklyLogRanges = useAppSelector((state) => state.logs.weeklyLogs)
	const dailyLogRanges = useAppSelector((state) => state.logs.dailyLogs)

	// Remove useFonts and font loading logic

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

	const WINDOW_DIMENSIONS = useWindowDimensions()
	const CHART_WIDTH = WINDOW_DIMENSIONS.width - 70

	const data =
		reportDuration?.value === 'week' ? generateWeeklyChartData() : generateDailyChartData()

	const contentInsets = {
		top: insets.top,
		bottom: insets.bottom,
		left: 12,
		right: 12
	}

	const emojiIcons = {
		happy: <HappyEmoji width={14} height={14} className="size-3.5" />,
		excited: <HappyEmoji width={14} height={14} className="size-3.5" />,
		positive: <HappyEmoji width={14} height={14} className="size-3.5" />,
		neutral: <NeutralEmoji width={14} height={14} className="size-3.5" />,
		angry: <AngryEmoji width={14} height={14} className="size-3.5" />,
		anxious: <CryingEmoji width={14} height={14} className="size-3.5" />,
		sad: <SadEmoji width={14} height={14} className="size-3.5" />
	} as { [mood: string]: React.ReactElement }

	const customLabel = (val: string) => {
		return (
			<View className="w-16">
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

	return (
		<React.Fragment>
			{isLoading ? (
				<View className="flex h-screen flex-col items-center justify-center gap-2">
					<Chase size={24} color="#CBC0FE" />
					<Text className="text-lg text-primary" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>Loading Reports...</Text>
				</View>
			) : (
				<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
					<ScrollView
						horizontal={false}
						bounces={false}
						nestedScrollEnabled
						showsVerticalScrollIndicator
						stickyHeaderIndices={[0]}
						className="flex flex-col px-5 web:mx-auto md:web:w-1/3"
						showsHorizontalScrollIndicator={false}>
						<View className="flex w-full flex-row items-center justify-between bg-white py-5">
							<Pressable onPress={() => router.dismiss()}>
								<ChevronLeftIcon />
							</Pressable>
							<Text
								className="text-center text-black"
								style={{
									fontFamily: 'PlusJakartaSans_700Bold',
									fontSize: 18,
									letterSpacing: 0.2,
								}}
							>
								Reports
							</Text>
							<Text />
						</View>
						<View className="mt-10 flex flex-row items-center justify-between">
							<Text className="font-medium text-black" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Interaction Report</Text>
							<View className="flex flex-row items-center gap-2">
								<Select
									value={reportDuration}
									onValueChange={(option) => {
										setIsLoading(true)
										setReportDuration(option)
									}}>
									<SelectTrigger className="w-[79px] rounded-lg border-[0.5px] border-[#D9D9D9] !p-2.5">
										<SelectValue
											className="native:text-xs text-xs !text-[#92929D]"
											placeholder="Duration"
										/>
									</SelectTrigger>
									<SelectContent insets={contentInsets} className="w-[79px]">
										<SelectItem label="Day" value="day">
											Day
										</SelectItem>
										<SelectItem label="Week" value="week">
											Week
										</SelectItem>
									</SelectContent>
								</Select>
								<Button
									style={{ elevation: 5 }}
									className="size-9 rounded-lg border-[0.5px] border-[#D9D9D9] bg-white">
									<DownloadIcon />
								</Button>
							</View>
						</View>
						<View className="mt-4 w-full">
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
											style={{ transform: 'translateY(-20px)' }}
											className="relative flex flex-row items-center justify-center rounded-[35px] bg-[#0E2C76] px-[18px] py-[5px]">
											<Text
												style={{ color: 'white', fontSize: 12, flexShrink: 0, fontFamily: 'PlusJakartaSans_400Regular' }}
												className="shrink-0 text-xs text-white">
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
						<View className="mt-4 flex flex-row items-center justify-center gap-1.5">
							<View className="size-[15px] rounded bg-[#AE9FFF]" />
							<Text className="text-sm text-[#666]" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>Interaction</Text>
						</View>
						<View className="mb-28 mt-6 flex flex-1 flex-row items-stretch gap-4">
							<View className="flex flex-1 grow basis-1/2 flex-col gap-4">
								<View className="relative flex min-h-[104px] w-full flex-1 flex-col justify-between overflow-hidden rounded-lg p-3">
									<Image
										resizeMode="stretch"
										height={104}
										width={WINDOW_DIMENSIONS.width}
										source={require('../assets/images/sleep-image.png')}
										className="absolute inset-0 web:!h-full web:!w-full"
									/>
									<View className="flex flex-row items-center justify-between">
										<Text className="font-medium text-white" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Sleep</Text>
										<EyeIcon />
									</View>
									<View className="flex flex-col">
										<Text className="text-xs font-light text-white" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>Avg. time</Text>
										<Text className="font-medium text-white" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>8hrs 20mins</Text>
									</View>
								</View>
								<View
									style={{ elevation: 5 }}
									className="flex min-h-[88px] flex-1 flex-col justify-between rounded-lg border-[0.5px] border-[#D9D9D9] bg-white p-3">
									<View className="flex grow flex-row items-center justify-between">
										<View className="flex grow flex-col justify-between gap-3">
											<View className="flex flex-row items-center gap-2">
												<Text className="font-medium text-[#515151]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Study</Text>
												<OpenBookIcon />
											</View>
											<ClosedBookIcon />
											<View className="flex flex-row items-center gap-1">
												<Text className="text-xs text-[#515151]" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>8 lessons</Text>
											</View>
										</View>
										<Image source={require('../assets/images/study-image.png')} />
									</View>
								</View>
							</View>
							<View
								style={{ elevation: 5 }}
								className="flex flex-1 grow basis-1/2 flex-col justify-between self-stretch overflow-hidden rounded-lg border-[0.5px] border-[#D9D9D9] px-3 pt-3">
								<View className="flex flex-col gap-3">
									<View className="flex w-full grow flex-row items-center justify-between">
										<Text className="font-medium text-[#515151]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Mood Report</Text>
										<Eye className="size-4 text-[#C5C5C5]" />
									</View>
									<ScrollView
										horizontal={false}
										bounces={false}
										nestedScrollEnabled
										showsVerticalScrollIndicator
										showsHorizontalScrollIndicator={false}
										className="flex h-[80px] flex-col gap-3">
										{Object.entries(sentimentsByDate ?? {}).map(([date, records], index) => (
											<View key={index} className="flex flex-col gap-2">
												<Text className="text-center text-sm font-bold" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
													{format(new Date(date), 'dd MMM yyyy')}
												</Text>
												<View className="flex grow flex-col items-start gap-1">
													{Object.entries(records ?? {}).map(([mood, number], index) => (
														<View
															key={index}
															className="flex w-11/12 flex-row items-center justify-between">
															<View className="flex flex-row items-center gap-0.5">
																<Text className="text-sm capitalize" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>{mood}</Text>
																{emojiIcons[mood]}
															</View>
															<Text className="text-sm" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>{number}</Text>
														</View>
													))}
												</View>
											</View>
										))}
									</ScrollView>
								</View>
								<Image source={require('../assets/images/mood-report-image.png')} />
							</View>
						</View>
					</ScrollView>
				</SafeAreaView>
			)}
		</React.Fragment>
	)
}
