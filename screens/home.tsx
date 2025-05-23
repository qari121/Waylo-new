import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks';
import Toast from 'react-native-toast-message';
import { Auth, getAuth } from 'firebase/auth';

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

interface ActivityCardProps {
	icon: React.ElementType;
	title: string;
	time: string;
}

const ActivityCard = ({ icon: Icon, title, time }: ActivityCardProps) => {
	return (
		<View style={styles.activityCard}>
			<View style={styles.activityCardContent}>
				<View style={styles.activityIconContainer}>
					<Icon style={styles.activityIcon} />
				</View>
				<Text style={[styles.activityTitle, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
					{title}
				</Text>
			</View>
			<View style={styles.activityTimeContainer}>
				<ClockIcon style={styles.clockIcon} />
				<Text style={[styles.activityTime, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
					{time}
				</Text>
			</View>
		</View>
	);
};

export const HomeScreen = () => {
	const router = useRouter()
	const dispatch = useAppDispatch()
	const auth = useAppSelector((state) => state.auth)
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

	const [sentiments, setSentiments] = useState<{ day: string; mood: string }[]>(defaultSentiments)

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
				const response = await dispatch(fetchSentimentsCount()).unwrap()
				const updatedSentiments = defaultSentiments.map((entry) => {
					const fullDay = entry.day
					if (!fullDay || !response[fullDay]) return entry

					const mostFrequentSentiment = Object.entries(response[fullDay]).reduce((a, b) =>
						a[1] > b[1] ? a : b
					)[0]

					return { ...entry, mood: mostFrequentSentiment }
				})

				setSentiments(updatedSentiments)
			} catch (err: any) {
				Toast.show({ type: 'error', text1: err ?? 'Failed to fetch sentiment records' })
			}
		}
		fetchSentimentRecords()
	}, [])

	if (!fontsLoaded) {
		return null; // Or a loading component
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView
				horizontal={false}
				bounces={false}
				showsVerticalScrollIndicator
				style={styles.container}
				showsHorizontalScrollIndicator={false}>
				<Text style={[styles.greeting, { fontFamily: 'PlusJakartaSans_700Bold' }]}>
					Hello {auth.username}
				</Text>
				<Text style={[styles.welcomeText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
					Welcome back, check the latest activities
				</Text>
				<View style={styles.cardsContainer}>
					<Pressable
						onPress={() => router.push('/toy-logs')}
						style={styles.voiceCard}>
						<View style={styles.iconContainer}>
							<MicrophoneIcon style={styles.icon} />
						</View>
						<View style={styles.wavesContainer}>
							<Image
								source={require('../assets/images/waves.png')}
								style={styles.wavesImage}
								resizeMode="cover"
							/>
							<View style={styles.wavesOverlay} />
						</View>
						<Image
							source={require('../assets/images/avatar.png')}
							style={styles.avatarImage}
							resizeMode="contain"
						/>
						<View style={styles.cardFooter}>
							<Text style={[styles.cardTitle, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
								Voice Interactions
							</Text>
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
					<View style={styles.rightCardsContainer}>
						<Pressable
							onPress={() => router.push('/video-interaction')}
							style={styles.videoCard}>
							<View style={styles.iconContainer}>
								<VideoIcon style={styles.icon} />
							</View>
							<Text style={[styles.cardTitle, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
								Video Captures
							</Text>
						</Pressable>
						<Link href="/reports?type=daily" style={styles.reportsCard}>
							<View style={styles.reportsContent}>
								<View style={styles.iconContainer}>
									<NoteIcon style={styles.icon} />
								</View>
								<Text style={[styles.reportsTitle, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
									Daily Reports
								</Text>
							</View>
						</Link>
					</View>
				</View>
				<View style={styles.activitiesContainer}>
					<View style={styles.activitiesHeader}>
						<Text style={[styles.sectionTitle, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
							Recent Activities
						</Text>
						<Link href="/activities" style={styles.seeAllLink}>
							<Text style={[styles.seeAllText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
								See All
							</Text>
						</Link>
					</View>
					<View style={styles.activitiesList}>
						{activities.map((activity) => (
							<ActivityCard
								key={activity.title}
								icon={activity.icon}
								title={activity.title}
								time={activity.time}
							/>
						))}
					</View>
				</View>
				<View style={styles.scheduleContainer}>
					<Text style={[styles.sectionTitle, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
						Schedule tasks
					</Text>
					<View style={styles.scheduleGrid}>
						<View style={styles.scheduleCard}>
							<GameIcon style={styles.scheduleIcon} />
							<View style={styles.scheduleTextContainer}>
								<Text style={[styles.scheduleText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
									Games
								</Text>
								<Text style={[styles.scheduleText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
									Play Time
								</Text>
							</View>
						</View>
						<View style={styles.scheduleCard}>
							<BookIcon style={styles.scheduleIcon} />
							<View style={styles.scheduleTextContainer}>
								<Text style={[styles.scheduleText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
									Study
								</Text>
								<Text style={[styles.scheduleText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
									Sessions
								</Text>
							</View>
						</View>
						<View style={styles.scheduleCard}>
							<HealthIcon style={styles.scheduleIcon} />
							<View style={styles.scheduleTextContainer}>
								<Text style={[styles.scheduleText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
									Behavior
								</Text>
								<Text style={[styles.scheduleText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
									monitoring
								</Text>
							</View>
						</View>
					</View>
				</View>
				<View style={styles.moodHistoryContainer}>
					<Text style={[styles.sectionTitle, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
						Mood History
					</Text>
					<View style={styles.moodHistoryList}>
						{sentiments.map((sentiment) => (
							<View
								key={sentiment.day}
								style={[
									styles.moodHistoryItem,
									sentiments[((new Date().getDay() + 6) % 7)].day === sentiment.day && styles.moodHistoryItemActive
								]}>
								{emojiIcons[sentiment.mood] && React.createElement(emojiIcons[sentiment.mood])}
								<Text style={[styles.moodHistoryDay, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
									{sentiment.day}
								</Text>
							</View>
						))}
					</View>
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
	container: {
		flex: 1,
		flexDirection: 'column',
		paddingHorizontal: 20,
		...(Platform.OS === 'web' && {
			marginHorizontal: 'auto',
			width: '33.333333%',
		}),
	},
	greeting: {
		paddingBottom: 12,
		paddingTop: 20,
		fontSize: 32,
		color: '#404040',
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
		position: 'relative',
		flex: 1,
		minHeight: 354,
		flexDirection: 'column',
		justifyContent: 'space-between',
		overflow: 'hidden',
		borderRadius: 24,
		backgroundColor: '#AE9FFF99',
		paddingVertical: 16,
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
		position: 'relative',
	},
	wavesImage: {
		width: '100%',
	},
	wavesOverlay: {
		position: 'absolute',
		zIndex: 10,
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
	},
	avatarGroup: {
		flexDirection: 'row',
		alignItems: 'center',
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
	rightCardsContainer: {
		flex: 1,
		flexDirection: 'column',
		gap: 12,
	},
	videoCard: {
		position: 'relative',
		flex: 1,
		minHeight: 170,
		flexDirection: 'column',
		justifyContent: 'space-between',
		overflow: 'hidden',
		borderRadius: 24,
		backgroundColor: '#EFEDE0CC',
		padding: 16,
	},
	reportsCard: {
		minHeight: 170,
		overflow: 'hidden',
		borderRadius: 24,
		backgroundColor: '#303030E8',
		padding: 16,
	},
	reportsContent: {
		height: '100%',
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'space-between',
	},
	reportsTitle: {
		lineHeight: 24,
		color: 'white',
	},
	activitiesContainer: {
		marginTop: 16,
		flexDirection: 'column',
		gap: 12,
	},
	activitiesHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	sectionTitle: {
		color: '#404040',
	},
	seeAllLink: {
		...(Platform.OS === 'web' && {
			cursor: 'pointer',
		}),
	},
	seeAllText: {
		color: '#0E2C76',
	},
	activitiesList: {
		flexDirection: 'column',
		gap: 8,
	},
	scheduleContainer: {
		marginTop: 16,
		flexDirection: 'column',
		gap: 23,
	},
	scheduleGrid: {
		flexDirection: 'row',
		alignItems: 'stretch',
		gap: 8,
	},
	scheduleCard: {
		flex: 1,
		minHeight: 113,
		flexDirection: 'column',
		justifyContent: 'space-between',
		borderRadius: 8,
		backgroundColor: '#F6F6F6',
		padding: 8,
	},
	scheduleIcon: {
		width: 32,
		height: 32,
		flexShrink: 0,
	},
	scheduleTextContainer: {
		flexDirection: 'column',
	},
	scheduleText: {
		fontSize: 12,
		lineHeight: 24,
		color: 'black',
	},
	activityCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderRadius: 12,
		backgroundColor: '#F4F3EC',
		paddingVertical: 10,
		paddingLeft: 8,
		paddingRight: 14,
	},
	activityCardContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	activityIconContainer: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 16,
		backgroundColor: '#AE9FFF99',
	},
	activityIcon: {
		width: 20,
		height: 20,
		flexShrink: 0,
	},
	activityTitle: {
		color: 'black',
	},
	activityTimeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
	},
	clockIcon: {
		width: 24,
		height: 24,
		flexShrink: 0,
	},
	activityTime: {
		fontSize: 12,
		color: 'black',
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
})
