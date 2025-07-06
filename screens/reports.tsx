/* eslint-disable react-native/no-color-literals */
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState, useRef } from 'react'
import { Image, SafeAreaView, ScrollView, Text, View, StyleSheet, Platform, Dimensions, TouchableOpacity, Pressable, Animated } from 'react-native'
import { BarChart, PieChart } from 'react-native-gifted-charts'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import { format } from 'date-fns'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ensureMacAddress } from '../utils/ensureMacAddress'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { LinearGradient } from 'expo-linear-gradient'
import Svg, { Circle, G, Path, Text as SvgText, Defs, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg'

import { fetchSentimentsByDate } from '../slices/sentiments'
import { useAppDispatch, useAppSelector } from '../hooks'
import CryingEmoji from '../assets/icons/emoji-loudly-crying-face.svg'
import NeutralEmoji from '../assets/icons/emoji-neutral-face.svg'
import SadEmoji from '../assets/icons/emoji-pensive-face.svg'
import AngryEmoji from '../assets/icons/emoji-pouting-face.svg'
import HappyEmoji from '../assets/icons/emoji-slightly-smiling-face.svg'
import MicrophoneIcon from '../assets/icons/microphone.svg'
import BrickBackground from '../assets/icons/brick_background.svg'
import Waves from '../assets/icons/waves.svg'

const WINDOW_DIMENSIONS = Dimensions.get('window')

// Beautiful Pie Chart Component
interface BeautifulPieChartProps {
	data: {interest: string, pct: number}[];
	radius: number;
	innerRadius: number;
	colors: {start: string, end: string}[];
	onSegmentPress?: (index: number) => void;
	selectedSegment?: number | null;
}

const BeautifulPieChart: React.FC<BeautifulPieChartProps> = ({
	data,
	radius,
	innerRadius,
	colors,
	onSegmentPress,
	selectedSegment,
}) => {
	const centerX = radius + 30;
	const centerY = radius + 30;

	// Store animated values in refs to avoid changing hooks count
	const scalesRef = React.useRef<Animated.Value[]>([]);
	const offsetsRef = React.useRef<Animated.Value[]>([]);

	// Initialize or update animated values when data length changes
	React.useEffect(() => {
		if (scalesRef.current.length !== data.length) {
			scalesRef.current = data.map((_, i) => new Animated.Value(selectedSegment === i ? 1.08 : 1));
		}
		if (offsetsRef.current.length !== data.length) {
			offsetsRef.current = data.map((_, i) => new Animated.Value(selectedSegment === i ? 16 : 0));
		}
	}, [data.length]);

	// Animate on selectedSegment change
	React.useEffect(() => {
		data.forEach((_, i) => {
			Animated.spring(scalesRef.current[i], {
				toValue: selectedSegment === i ? 1.08 : 1,
				useNativeDriver: true,
				speed: 16,
				bounciness: 8,
			}).start();
			Animated.spring(offsetsRef.current[i], {
				toValue: selectedSegment === i ? 16 : 0,
				useNativeDriver: true,
				speed: 16,
				bounciness: 8,
			}).start();
		});
	}, [selectedSegment, data]);

	const createPieSegment = (startAngle: number, endAngle: number, color: {start: string, end: string}, index: number) => {
		const scale = scalesRef.current[index] || new Animated.Value(1);
		const offset = offsetsRef.current[index] || new Animated.Value(0);
		const strokeWidth = 2;

		const midAngle = (startAngle + endAngle) / 2;
		const midRad = (midAngle - 90) * Math.PI / 180;
		const offsetX = Animated.multiply(offset, Math.cos(midRad));
		const offsetY = Animated.multiply(offset, Math.sin(midRad));

		const startRad = (startAngle - 90) * Math.PI / 180;
		const endRad = (endAngle - 90) * Math.PI / 180;

		const x1 = centerX + (radius * Math.cos(startRad));
		const y1 = centerY + (radius * Math.sin(startRad));
		const x2 = centerX + (radius * Math.cos(endRad));
		const y2 = centerY + (radius * Math.sin(endRad));

		const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

		const outerPath = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
		const innerPath = `M ${centerX} ${centerY} L ${centerX + (innerRadius * Math.cos(startRad))} ${centerY + (innerRadius * Math.sin(startRad))} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${centerX + (innerRadius * Math.cos(endRad))} ${centerY + (innerRadius * Math.sin(endRad))} Z`;

		return (
			<Pressable key={index} onPress={() => onSegmentPress?.(index)} style={{ position: 'absolute', left: 0, top: 0 }}>
				<Animated.View
					style={{
						transform: [
							{ scale },
							{ translateX: offsetX },
							{ translateY: offsetY },
						],
					}}
				>
					<Svg width={(radius + 30) * 2} height={(radius + 30) * 2} style={{ position: 'absolute', left: 0, top: 0 }}>
						<Defs>
							<SvgLinearGradient id={`gradient${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
								<Stop offset="0%" stopColor={color.start} />
								<Stop offset="100%" stopColor={color.end} />
							</SvgLinearGradient>
						</Defs>
						<Path
							d={outerPath}
							fill={`url(#gradient${index})`}
							stroke="#fff"
							strokeWidth={strokeWidth}
						/>
						<Path
							d={innerPath}
							fill="white"
							stroke="transparent"
						/>
					</Svg>
				</Animated.View>
			</Pressable>
		);
	};

	const renderSegments = () => {
		let currentAngle = 0;
		return data.map((item, index) => {
			const angle = (item.pct / 100) * 360;
			const segment = createPieSegment(currentAngle, currentAngle + angle, colors[index % colors.length], index);
			currentAngle += angle;
			return segment;
		});
	};

	return (
		<View style={{ alignItems: 'center', justifyContent: 'center', padding: 8, marginBottom: 8 }}>
			<View style={{ width: (radius + 30) * 2, height: (radius + 30) * 2, position: 'relative', zIndex: 1 }}>
				{renderSegments()}
				{/* Center circle for donut effect */}
				<Svg width={(radius + 30) * 2} height={(radius + 30) * 2} style={{ position: 'absolute', left: 0, top: 0 }}>
					<Circle
						cx={centerX}
						cy={centerY}
						r={innerRadius}
						fill="white"
						stroke="#f0f0f0"
						strokeWidth={1}
					/>
				</Svg>
			</View>
		</View>
	);
};

const emojiIcons = {
	happy: HappyEmoji,
	excited: HappyEmoji,
	neutral: NeutralEmoji,
	angry: AngryEmoji,
	anxious: CryingEmoji,
	sad: SadEmoji
} as { [mood: string]: React.ElementType }

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
	const auth = useAppSelector(state => state.auth)
	const [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold,
	})

	const [isLoading, setIsLoading] = useState(true)
	const [isInitialized, setIsInitialized] = useState(false)
	const [showMoodModal, setShowMoodModal] = useState(false)
	const [summary, setSummary] = useState<string | null>(null)
	const [isSummarizing, setIsSummarizing] = useState(false)
	const [macAddress, setMacAddress] = useState<string | null>(null)
	const [macLoaded, setMacLoaded] = useState<boolean>(false)
	const [macChecked, setMacChecked] = useState(false)
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
	const [timeSpanMoods, setTimeSpanMoods] = useState<TimeSpanMoods>({
		morning: null,
		afternoon: null,
		evening: null,
		night: null
	})
	const [interestBreakdown, setInterestBreakdown] = useState<{interest:string,pct:number}[] | null>(null);
	const [interestLoading, setInterestLoading] = useState<boolean>(false);
	const [dailyUsageData, setDailyUsageData] = useState<{day: string, hours: number}[]>([]);
	const [usageLoading, setUsageLoading] = useState<boolean>(false);
	const [barTooltip, setBarTooltip] = useState<{visible: boolean, index: number, hours: number} | null>(null);
	const [selectedInterestIndex, setSelectedInterestIndex] = useState<number | null>(null);
	const [pieAnimation] = useState(new Animated.Value(0));
	const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
	const [pieTooltip, setPieTooltip] = useState<{visible: boolean, x: number, y: number, data: any} | null>(null);
	const PIE_RADIUS = 130;
	const PIE_INNER_RADIUS = 90;
	const PIE_PADDING = 30;
	const PIE_CENTER_X = WINDOW_DIMENSIONS.width / 2 - 20; // 20 is horizontal padding
	const PIE_CENTER_Y = 110 + 16; // radius + vertical padding
	const [tooltip, setTooltip] = useState<{x: number, y: number, index: number} | null>(null);
	const [chartLayout, setChartLayout] = useState<{x: number, y: number, width: number, height: number} | null>(null);
	const chartContainerRef = useRef<View>(null);
	const [chartScreenPos, setChartScreenPos] = useState<{x: number, y: number, width: number, height: number} | null>(null);

	// Define a multi-color palette for the pie chart
	const PIE_COLORS = [
		'#FF6384', // red/pink
		'#36A2EB', // blue
		'#FFCE56', // yellow
		'#4BC0C0', // teal
		'#9966FF', // violet
		'#FF9F40', // orange
		'#C9CBCF', // gray
		'#2ecc71', // green
		'#e67e22', // dark orange
		'#e74c3c', // dark red
	];

	// Modern gradient color palette for the beautiful pie chart
	const PIE_GRADIENT_COLORS = [
		{ start: '#FF6384', end: '#FF6384' }, // Vibrant Red
		{ start: '#36A2EB', end: '#36A2EB' }, // Bright Blue
		{ start: '#4BC0C0', end: '#4BC0C0' }, // Teal
		{ start: '#FFCE56', end: '#FFCE56' }, // Yellow
		{ start: '#9966FF', end: '#9966FF' }, // Purple
		{ start: '#FF9F40', end: '#FF9F40' }, // Orange
		{ start: '#2ecc71', end: '#2ecc71' }, // Green
		{ start: '#e67e22', end: '#e67e22' }, // Dark Orange
		{ start: '#e74c3c', end: '#e74c3c' }, // Dark Red
		{ start: '#00b894', end: '#00b894' }, // Mint
	];

	const generateWeeklyBarChartData = () => {
		if (dailyUsageData.length === 0) return []

		return dailyUsageData.map((dayData) => {
			const isZero = dayData.hours === 0;
			return {
				value: isZero ? -0.00001 : dayData.hours,
				label: dayData.day,
				labelComponent: () => customLabel(dayData.day),
				frontColor: isZero ? 'transparent' : '#AE9FFF',
				barWidth: BAR_WIDTH,
				topLabelComponent: !isZero ? () => (
					<Text style={{ color: '#666666', fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular' }}>
						{dayData.hours.toFixed(1)}h
					</Text>
				) : undefined,
			}
		})
	}

	const fetchWeeklyUsageData = async () => {
		if (!ensureMacAddress(macAddress)) return;
		setUsageLoading(true);
		try {
			// Use selectedDate to determine week
			const dateToUse = selectedDate || new Date();
			const startOfWeek = new Date(dateToUse);
			const dayOfWeek = dateToUse.getDay();
			const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
			startOfWeek.setDate(dateToUse.getDate() - daysToSubtract);
			startOfWeek.setHours(0, 0, 0, 0);
			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setDate(startOfWeek.getDate() + 6);
			endOfWeek.setHours(23, 59, 59, 999);
			const tsStart = Timestamp.fromDate(startOfWeek);
			const tsEnd = Timestamp.fromDate(endOfWeek);

			// Fetch toy logs from Firestore
			const toyLogsRef = collection(db, 'toy_logs');
			const q = query(
				toyLogsRef,
				where('toy_mac_address', '==', macAddress),
				where('time', '>=', tsStart),
				where('time', '<=', tsEnd),
				orderBy('time', 'asc')
			);
			const querySnapshot = await getDocs(q);

			// Group logs by date
			const logsByDate: { [key: string]: number[] } = {};
			querySnapshot.forEach((doc) => {
				const data = doc.data();
				let logTime: Date;
				if (data.time?.toDate) {
					logTime = data.time.toDate();
				} else if (data.time?.seconds) {
					logTime = new Date(data.time.seconds * 1000);
				} else {
					logTime = new Date(data.time);
				}
				if (logTime >= startOfWeek && logTime <= endOfWeek) {
					const dayKey = logTime.toISOString().split('T')[0];
					const timestamp = logTime.getTime();
					if (!logsByDate[dayKey]) logsByDate[dayKey] = [];
					logsByDate[dayKey].push(timestamp);
				}
			});

			// Calculate hours for each day based on timestamp ranges
			const dailyData: { [key: string]: number } = {};
			const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
			for (let i = 0; i < 7; i++) {
				const date = new Date(startOfWeek);
				date.setDate(startOfWeek.getDate() + i);
				const dayKey = date.toISOString().split('T')[0];
				const timestamps = logsByDate[dayKey] || [];
				let hours = 0;
				if (timestamps.length >= 2) {
					const earliest = Math.min(...timestamps);
					const latest = Math.max(...timestamps);
					hours = (latest - earliest) / (1000 * 60 * 60); // ms to hours
				}
				dailyData[dayKey] = hours;
			}

			// Convert to array format for the chart
			const chartData = [];
			for (let i = 0; i < 7; i++) {
				const date = new Date(startOfWeek);
				date.setDate(startOfWeek.getDate() + i);
				const dayKey = date.toISOString().split('T')[0];
				chartData.push({
					day: dayNames[i],
					hours: dailyData[dayKey] || 0
				});
			}
			setDailyUsageData(chartData);
		} catch (error) {
			console.error('Error fetching weekly usage data:', error);
			Toast.show({ type: 'error', text1: 'Failed to fetch usage data' });
		} finally {
			setUsageLoading(false);
		}
	};

	const CHART_WIDTH = WINDOW_DIMENSIONS.width - 70
	const BAR_WIDTH = 30;
	const BAR_SPACING = (CHART_WIDTH - (BAR_WIDTH * 7)) / 6;

	// Generate bar chart data from daily usage data
	const weeklyBarChartData = generateWeeklyBarChartData()

	const customLabel = (val: string) => {
		return (
			<View style={styles.labelContainer}>
				<Text style={{ textAlign: 'right', color: '#666666', fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular' }}>{val}</Text>
			</View>
		)
	}

	// 1) Load MAC once
	useEffect(() => {
		AsyncStorage.getItem('macAddress').then(setMacAddress).finally(() => setMacLoaded(true));
	}, []);

	// 2) Initialize data once MAC available
	useEffect(() => {
		if (!macLoaded || isInitialized) return;
		const run = async () => {
			const clean = ensureMacAddress(macAddress);
			if (!clean) { setIsInitialized(true); return; }
			try {
				setIsLoading(true);
				// Fetch weekly usage data and sentiments
				await fetchWeeklyUsageData();
				await dispatch(fetchSentimentsByDate(clean)).unwrap();
			} catch(e:any) {
				Toast.show({ type:'error', text1: e?.message ?? 'Failed to fetch report data' });
			} finally {
				setIsLoading(false);
				setIsInitialized(true);
			}
		};
		run();
	}, [macLoaded, macAddress, isInitialized, dispatch]);

	// Handle MAC changes (listen once macLoaded)
	useEffect(() => {
		if (!macLoaded) return;
		setMacChecked(true);
	}, [macLoaded]);

	// Refetch weekly usage data when MAC address changes
	useEffect(() => {
		if (macAddress && ensureMacAddress(macAddress)) {
			fetchWeeklyUsageData();
		}
	}, [selectedDate, macAddress]);

	const showDatePicker = () => setDatePickerVisibility(true)
	const hideDatePicker = () => setDatePickerVisibility(false)
	const handleConfirm = (date: Date) => {
		setSelectedDate(date)
		hideDatePicker()
	}

	const fetchMoodsByDate = async (date: Date) => {
		if (!macAddress) return;
		try {
			const startDate = new Date(date); startDate.setHours(0, 0, 0, 0);
			const endDate = new Date(date); endDate.setHours(23, 59, 59, 999);
			const tsStart = Timestamp.fromDate(startDate);
			const tsEnd   = Timestamp.fromDate(endDate);
			const moodsRef = collection(db, 'sentiment_logs');
			const q = query(
				moodsRef,
				where('toy_mac_address', '==', macAddress),
				where('time', '>=', tsStart),
				where('time', '<=', tsEnd)
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
				if (time >= startDate && time <= endDate) {
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

	// interest breakdown for the selected day
	useEffect(() => {
		const fetchInterestByDate = async () => {
			if (!ensureMacAddress(macAddress)) { setInterestBreakdown(null); return; }
			setInterestLoading(true);
			try {
				const startDate = new Date(selectedDate); startDate.setHours(0,0,0,0);
				const endDate = new Date(selectedDate); endDate.setHours(23,59,59,999);
				const start = Timestamp.fromDate(startDate);
				const end = Timestamp.fromDate(endDate);
				const ref = collection(db,'interest_logs');
				const qSnap = await getDocs(query(ref, where('toy_mac_address','==', macAddress)));
				const buckets: Record<string,{sum:number,count:number}> = {};
				qSnap.forEach(doc=>{
					const d=doc.data();
					const interest = d.interest as string;
					const intensity = Number(d.intensity) || 0;
					let t: Date;
					if (d.time?.toDate) t = d.time.toDate(); else t = new Date(d.time);
					if (t < startDate || t > endDate) return;
					if(!buckets[interest]) buckets[interest]={sum:0,count:0};
					buckets[interest].sum += intensity;
					buckets[interest].count +=1;
				});
				const avgs = Object.entries(buckets).map(([k,v])=>({interest:k, score:v.sum/v.count}));
				const total = avgs.reduce((t,i)=>t+i.score,0);
				const list = total>0 ? avgs.map(i=>({...i, pct: Math.round(i.score/total*100)})) : [];
				list.sort((a,b)=>b.pct-a.pct);
				
				// Take top 5 interests and combine the rest into "Others"
				const top5 = list.slice(0, 5);
				const others = list.slice(5);
				
				let finalList = [...top5];
				
				// If there are remaining interests, combine them into "Others"
				if (others.length > 0) {
					const othersPct = others.reduce((sum, item) => sum + item.pct, 0);
					finalList.push({
						interest: 'Others',
						score: others.reduce((sum, item) => sum + item.score, 0),
						pct: othersPct
					});
				}
				
				setInterestBreakdown(finalList);
			} catch(e){ setInterestBreakdown(null); }
			setInterestLoading(false);
		};
		fetchInterestByDate();
	},[selectedDate, macAddress]);

	// 2. Normalize pie data to always fill 100%
	function normalizePieData(data: {interest: string, pct: number}[]): {interest: string, pct: number}[] {
		if (!data || data.length === 0) return [];
		const total = data.reduce((sum: number, d: {pct: number}) => sum + d.pct, 0);
		if (total === 100) return data;
		const normalized = data.map((d: {interest: string, pct: number}, i: number) =>
			i === data.length - 1
				? { ...d, pct: Math.round(100 - data.slice(0, -1).reduce((sum: number, d: {pct: number}) => sum + d.pct, 0)) }
				: d
		);
		return normalized;
	}

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
				showsHorizontalScrollIndicator={false}
				onScrollBeginDrag={() => setBarTooltip(null)}
			>
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
				{/* Date picker for selecting day/week (now applies to all reports) */}
				<View style={styles.datePickerWrapper}>
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
				{/* Weekly Usage Report */}
				<View style={styles.weeklyUsageContainer}>
					<Text style={[styles.weeklyUsageTitle, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>Daily Usage Report</Text>
				</View>
				<View style={styles.chartContainer}>
					{!ensureMacAddress(macAddress) ? (
						<View style={{ padding: 24, alignItems: 'center' }}>
							<Text style={{ color: '#7D65FC', fontSize: 16, textAlign: 'center' }}>
								Please pair your device and enter a MAC address to view usage reports.
							</Text>
						</View>
					) : usageLoading ? (
						<View style={{ padding: 24, alignItems: 'center' }}>
							<Text style={{ color: '#7D65FC', fontSize: 16, textAlign: 'center' }}>
								Loading usage data...
							</Text>
						</View>
					) : weeklyBarChartData.length === 0 ? (
						<View style={{ padding: 24, alignItems: 'center' }}>
							<Text style={{ color: '#7D65FC', fontSize: 16, textAlign: 'center' }}>
								No usage data available for this week.
							</Text>
						</View>
					) : (
						<View style={{ backgroundColor: '#fff', borderRadius: 16, paddingVertical: 8, alignItems: 'center' }}>
							<BarChart
								data={weeklyBarChartData.map((bar, idx) => ({
									...bar,
									frontColor: '#AE9FFF',
									topLabelComponent: undefined,
									onPress: () => setBarTooltip({ visible: true, index: idx, hours: bar.value }),
									labelComponent: () => (
										<Text style={{ textAlign: 'center', fontSize: 13, color: '#92929D', fontFamily: 'PlusJakartaSans_400Regular', marginTop: 6 }}>{bar.label}</Text>
									)
								}))}
								width={CHART_WIDTH}
								height={180}
								barWidth={BAR_WIDTH}
								spacing={BAR_SPACING}
								roundedTop={false}
								roundedBottom={false}
								barBorderRadius={5}
								hideRules
								xAxisThickness={0}
								yAxisThickness={0}
								yAxisTextStyle={{ color: '#92929D', fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', textAlign: 'right' }}
								yAxisLabelSuffix="h"
								yAxisColor="#fff"
								xAxisColor="#fff"
								noOfSections={5}
								maxValue={10}
								stepValue={2}
								isAnimated
								showLine={false}
								showVerticalLines={false}
								barStyle={{ alignItems: 'center', justifyContent: 'flex-end'}}
							/>
							{/* Tooltip for bar */}
							{barTooltip && barTooltip.visible && (
								<View style={{
									position: 'absolute',
									left: (barTooltip.index * (BAR_WIDTH + BAR_SPACING)) + BAR_WIDTH/2 + 16, // 16 for left padding
									top: 30,
									backgroundColor: '#222',
									paddingHorizontal: 12,
									paddingVertical: 6,
									borderRadius: 8,
									zIndex: 10,
								}}>
									<Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
										{`${Math.floor(barTooltip.hours)}h ${Math.round((barTooltip.hours % 1) * 60)}m`}
									</Text>
								</View>
							)}
						</View>
					)}
				</View>
				<View style={styles.statsContainer}>
					<View style={[styles.moodReportCard, styles.moodReportCardFull, { elevation: 5 }]}>
						<View style={styles.moodReportContentRow}>
							<Text style={[styles.moodReportTitle, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>Mood report</Text>
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
											No mood data for this day.
										</Text>
									</View>
								);
							}
							return (
								<View style={[styles.moodTimeSpansContainer, styles.moodTimeSpansContainerData]}>
									{timeSpans.map(({ label, key }) => (
										<View key={key} style={styles.moodTimeSpanItem}>
											<Text style={[styles.moodTimeSpanLabel, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
												{label}
											</Text>
											<View style={styles.moodTimeSpanEmoji}>
												{timeSpanMoods[key] && emojiIcons[timeSpanMoods[key] as MoodType]
													? React.createElement(
														emojiIcons[timeSpanMoods[key] as MoodType],
														{ width: 32, height: 32 }
													)
													: <Text style={styles.noMoodText}>-</Text>
												}
											</View>
										</View>
									))}
								</View>
							);
						})()}
					</View>
					{/* Interest Breakdown card */}
					<Pressable
						style={{ flex: 1 }}
						onPress={() => { setTooltip(null); setSelectedInterestIndex(null); }}
					>
						<View style={[styles.moodReportCard, styles.moodReportCardFull, !interestLoading && (!interestBreakdown || interestBreakdown.length===0) && styles.interestCardEmpty]}>
							<Text style={[styles.moodReportTitle,{marginBottom:8,fontFamily:'PlusJakartaSans_600SemiBold'}]}>Interest breakdown</Text>
							{!ensureMacAddress(macAddress) ? (
								<Text style={{textAlign:'center',color:'#7D65FC',marginTop:20}}>Enter device MAC address to view interest data.</Text>
							) : interestLoading ? (
								<Text style={{textAlign:'center'}}>Loading…</Text>
							) : !interestBreakdown || interestBreakdown.length===0 ? (
								<Text style={{textAlign:'center',color:'#7D65FC',marginTop:20}}>No interest data for this day.</Text>
							) : (
								<View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 32 }}>
									<BeautifulPieChart 
										data={normalizePieData(interestBreakdown)}
										radius={PIE_RADIUS}
										innerRadius={PIE_INNER_RADIUS}
										colors={PIE_GRADIENT_COLORS}
										onSegmentPress={(index) => setSelectedSegment(index)}
										selectedSegment={selectedSegment}
									/>
									{/* Legend */}
									<View style={styles.pieLegend}>
										{normalizePieData(interestBreakdown).map((item: {interest: string, pct: number}, index: number) => (
											<TouchableOpacity
												key={index}
												style={[
													styles.legendItem,
													selectedSegment === index && styles.legendItemSelected
												]}
												onPress={() => setSelectedSegment(selectedSegment === index ? null : index)}
											>
												<View style={[
													styles.legendColor,
													{ backgroundColor: PIE_GRADIENT_COLORS[index % PIE_GRADIENT_COLORS.length].start }
												]} />
												<Text style={[
													styles.legendText,
													selectedSegment === index && styles.legendTextSelected
												]}>
													{item.interest.charAt(0).toUpperCase() + item.interest.slice(1)}
												</Text>
											</TouchableOpacity>
										))}
									</View>
								</View>
							)}
						</View>
					</Pressable>
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
		color: 'black',
		fontSize: 18,
		marginBottom: 15,
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
		fontSize: 18,
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
	chartContainer: {
		marginTop: 16,
		width: '100%',
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
		fontFamily: 'PlusJakartaSans_500Medium',
		flex: 1,
		textTransform: 'capitalize',
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
		backgroundColor: 'white',
		padding: 12,
		borderRadius: 8,
		borderColor:'grey',
		borderWidth:0.2,
	},
	datePickerText: {
		fontSize: 12,
		color: '#92929D',
		//fontWeight: '400',
	},
	moodTimeSpansContainer: {
		flexDirection: 'column',
		gap: 12,
	},
	moodTimeSpansContainerData: {
		paddingBottom: 16,
	},
	moodTimeSpanItem: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 2,
	},
	moodTimeSpanLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: '#515151',
	},
	moodTimeSpanEmoji: {
		width: 40,
		alignItems: 'center',
	},
	interestRow:{
		flexDirection:'row',
		justifyContent:'space-between',
		paddingVertical:4,
	},
	interestLabel:{fontSize:16,color:'#515151',textTransform:'capitalize'},
	interestPct:{fontSize:16,fontWeight:'600',color:'#7D65FC'},
	interestCardEmpty:{
		paddingVertical:40,
	},
	pieChartContainer: {
		alignItems: 'center',
		paddingVertical: 16,
	},
	pieChartCenterLabel: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	pieChartCenterText: {
		fontSize: 12,
		color: '#515151',
		fontFamily: 'PlusJakartaSans_500Medium',
	},
	pieChartLegend: {
		marginTop: 16,
		width: '100%',
	},
	legendItem: {
		flexDirection: 'row',
		alignItems: 'center',
		marginVertical: 6,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: '#f8f9fa',
	},
	legendItemSelected: {
		backgroundColor: '#e3f2fd',
		borderWidth: 2,
		borderColor: '#2196f3',
		shadowColor: '#2196f3',
		shadowOpacity: 0.2,
		shadowRadius: 6,
	},
	legendTextSelected: {
		color: '#2196f3',
		fontFamily: 'PlusJakartaSans_600SemiBold',
	},
	legendPercentage: {
		fontSize: 14,
		fontWeight: '600',
		color: '#666',
		fontFamily: 'PlusJakartaSans_600SemiBold',
	},
	pieLegend: {
		marginTop: 24,
		width: '100%',
		paddingHorizontal: 16,
	},
	legendColor: {
		width: 16,
		height: 16,
		borderRadius: 8,
		marginRight: 12,
	},
	datePickerWrapper: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		marginBottom: 0,
		marginTop: 25,
	},
	weeklyUsageContainer: {
		marginTop: 40,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	weeklyUsageTitle: {
		fontWeight: '500',
		color: 'black',
		fontSize: 18,
		marginBottom: 15,
	},
	pieTooltip: {
		position: 'absolute',
		backgroundColor: '#222',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
		zIndex: 20,
		minWidth: 80,
		alignItems: 'center',
	},
	pieTooltipText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 14,
		textAlign: 'center',
	},
})

export default ReportScreen
