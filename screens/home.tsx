import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '../lib/utils';
import { auth as firebaseAuth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useAppDispatch, useAppSelector } from '../hooks';
import Toast from 'react-native-toast-message';

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

export const HomeScreen = () => {
	const router = useRouter()
	const dispatch = useAppDispatch()
	const auth = useAppSelector((state) => state.auth)

	let [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold
	});

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
		{ title: 'Singing Rhymes', time: '2mins', icon: VideoVerticalIcon },
		{ title: 'Dancing session', time: '3mins', icon: VideoVerticalIcon },
		{ title: 'Questions asked', time: '4mins', icon: Microphone2Icon }
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
		onAuthStateChanged(firebaseAuth, (user) => {
			if (!user) {
				Toast.show({ type: 'error', text1: 'Session Expired!', text2: 'Please login again' })
				dispatch(logout())
			}
		})
	}, [])

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
		<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
			<ScrollView
				horizontal={false}
				bounces={false}
				showsVerticalScrollIndicator
				className="flex flex-1 flex-col px-5 web:mx-auto md:web:w-1/3"
				showsHorizontalScrollIndicator={false}>
				<Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="pb-3 pt-5 text-[32px] text-[#404040]">
					Hello {auth.username}
				</Text>
				<Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-[#9A9A9A]">
					Welcome back, check the latest activities
				</Text>
				<View className="mt-5 flex w-full flex-row items-stretch gap-3">
					<Pressable
						onPress={() => router.push('/toy-logs')}
						className="relative flex min-h-[354px] shrink basis-[50%] flex-col justify-between overflow-hidden rounded-3xl bg-[#AE9FFF99] py-4">
						<View className="ml-4 flex size-9 flex-row items-center justify-center rounded-full bg-white p-4">
							<MicrophoneIcon className="shrink-0" />
						</View>
						<View className="relative">
							<Image
								source={require('../assets/images/waves.png')}
								className="!w-full"
								resizeMode="cover"
							/>
							<View className="absolute z-10 h-full w-full bg-[#AE9FFF99]" />
						</View>
						<Image
							source={require('../assets/images/avatar.png')}
							style={{ width: 150, height: 150 }}
							resizeMode="contain"
							className="absolute right-0 top-4 z-10"
						/>
						<View className="mx-4 flex flex-row items-center justify-between">
							<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="w-1/2 break-words leading-6 text-black">
								Voice Interactions
							</Text>
							<View className="flex flex-row items-center">
								<Image
									source={require('../assets/images/home_img_1.png')}
									className="z-30 rounded-full border border-white"
									style={{ width: 24, height: 24 }}
								/>
								<Image
									source={require('../assets/images/home_img_2.png')}
									className="relative z-20 -ml-1.5 rounded-full border border-white"
									style={{ width: 24, height: 24 }}
								/>
							</View>
						</View>
					</Pressable>
					<View className="flex grow flex-col gap-3">
						<Pressable
							onPress={() => router.push('/video-interaction')}
							className="relative flex min-h-[170px] flex-col justify-between overflow-hidden rounded-3xl bg-[#EFEDE0CC] p-4">
							<View className="flex size-9 flex-row items-center justify-center rounded-full bg-white">
								<VideoIcon className="size-6 shrink-0" />
							</View>
							<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="leading-6 text-black">
								Video Captures
							</Text>
						</Pressable>
						<Link
							href="/reports?type=daily"
							className="min-h-[170px] overflow-hidden rounded-3xl bg-[#303030E8] p-4">
							<View className="flex h-full flex-1 grow flex-col justify-between">
								<View className="flex size-9 flex-row items-center justify-center rounded-full bg-white">
									<NoteIcon className="size-6 shrink-0" />
								</View>
								<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="leading-6 text-white">
									Daily Reports
								</Text>
							</View>
						</Link>
					</View>
				</View>
				<View className="mt-4 flex flex-col gap-3">
					<View className="flex flex-row items-center justify-between">
						<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-[#404040]">
							Recent Activities
						</Text>
						<Link href="/activities" className="cursor-pointer text-[#0E2C76]">
							<Text style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>See All</Text>
						</Link>
					</View>
					<View className="flex flex-col gap-2">
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
				<View className="mt-4 flex flex-col gap-[23px]">
					<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-[#404040]">
						Schedule tasks
					</Text>
					<View className="flex flex-row items-stretch gap-2">
						<View className="flex min-h-[113px] flex-1 flex-col justify-between rounded-lg bg-[#F6F6F6] p-2">
							<GameIcon className="size-8 shrink-0" />
							<View className="flex flex-col">
								<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-xs leading-6 text-black">
									Games
								</Text>
								<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-xs leading-6 text-black">
									Play Time
								</Text>
							</View>
						</View>
						<View className="flex min-h-[113px] flex-1 flex-col justify-between rounded-lg bg-[#F6F6F6] p-2">
							<BookIcon className="size-8 shrink-0" />
							<View className="flex flex-col">
								<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-xs leading-6 text-black">
									Study
								</Text>
								<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-xs leading-6 text-black">
									Sessions
								</Text>
							</View>
						</View>
						<View className="flex min-h-[113px] flex-1 flex-col justify-between rounded-lg bg-[#F6F6F6] p-2">
							<HealthIcon className="size-8 shrink-0" />
							<View className="flex flex-col">
								<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-xs leading-6 text-black">
									Behavior
								</Text>
								<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-xs leading-6 text-black">
									monitoring
								</Text>
							</View>
						</View>
					</View>
				</View>
				<View className="mb-28 mt-[18px] flex flex-col gap-2.5">
					<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-[#404040]">
						Mood History
					</Text>
					<View className="flex flex-row items-center gap-6 overflow-x-auto">
						{sentiments.map((sentiment) => (
							<View
								key={sentiment.day}
								className={cn('flex flex-1 flex-col items-center gap-1.5', {
									'rounded-[16px] border-[0.5px] border-[#C5C5C5] bg-[#F4F3EC] px-2 py-1':
										sentiments[((new Date().getDay() + 6) % 7)].day === sentiment.day
								})}>
								{emojiIcons[sentiment.mood] && React.createElement(emojiIcons[sentiment.mood])}
								<Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }} className="text-xs text-black">
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

interface ActivityCardProps {
	icon: React.ElementType
	title: string
	time: string
}

const ActivityCard = ({ icon: Icon, title, time }: ActivityCardProps) => {
	return (
		<View className="flex w-full flex-row items-center justify-between rounded-xl bg-[#F4F3EC] py-2.5 pl-2 pr-3.5">
			<View className="flex flex-row items-center gap-4">
				<View className="flex size-8 items-center justify-center rounded-full bg-[#AE9FFF99]">
					<Icon className="size-5 shrink-0" />
				</View>
				<Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-black">
					{title}
				</Text>
			</View>
			<View className="flex flex-row items-center gap-[5px]">
				<ClockIcon className="size-6 shrink-0" />
				<Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-xs text-black">
					{time}
				</Text>
			</View>
		</View>
	)
}
