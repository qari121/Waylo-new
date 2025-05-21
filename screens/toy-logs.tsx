import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import { Audio } from 'expo-av'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import { cn } from 'lib/utils'
import { addMessage, toyLogs } from '@slices/logs'
import { format } from 'date-fns'
import { useAppDispatch, useAppSelector } from 'hooks'

import ChevronLeftIcon from 'assets/icons/chevron-left.svg'
import PlayIcon from 'assets/icons/play.svg'
import WyloIcon from 'assets/icons/wylo.svg'

interface ToyLog {
	type: string;
	id: React.Key | null | undefined;
	audioUri?: string;
	message: any;
	time: string | number | Date;
}

const AudioMessage = ({ uri }: { uri: string }) => {
	const [sound, setSound] = useState<Audio.Sound | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const playSound = async () => {
		try {
			setIsLoading(true);
			if (sound) {
				if (isPlaying) {
					await sound.pauseAsync();
				} else {
					await sound.playAsync();
				}
				setIsPlaying(!isPlaying);
			} else {
				const { sound: newSound } = await Audio.Sound.createAsync(
					{ uri },
					{ shouldPlay: true },
					(status) => {
						if ('isPlaying' in status && !status.isPlaying && status.didJustFinish) {
							setIsPlaying(false);
						}
					}
				);
				setSound(newSound);
				setIsPlaying(true);
			}
		} catch (error) {
			Toast.show({ type: 'error', text1: 'Failed to play audio' });
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		return () => {
			if (sound) {
				sound.unloadAsync();
			}
		};
	}, [sound]);

	return (
		<View className="flex-row items-center gap-2 min-w-[200px]">
			<Pressable
				onPress={playSound}
				className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
			>
				<PlayIcon width={18} height={16} color="#FFFFFF" />
			</Pressable>
			<View className="flex-1">
				<View className="w-full">
					{/* Audio waveform visualization */}
					<View className="flex-row items-center h-6 gap-[2px]">
						{Array.from({ length: 30 }).map((_, i) => (
							<View
								key={i}
								className="flex-1 h-full"
								style={{
									height: `${Math.random() * 100}%`,
									backgroundColor: 'white',
									opacity: 0.5,
									width: 2,
									borderRadius: 1
								}}
							/>
						))}
					</View>
				</View>
			</View>
		</View>
	);
};

export const ToyLogsScreen = () => {
	const dispatch = useAppDispatch()
	const logs = useAppSelector((state) => state.logs.toyLogs)
	const router = useRouter()
	const [message, setMessage] = useState('')
	const [isRecording, setIsRecording] = useState(false)
	const [recording, setRecording] = useState<Audio.Recording | null>(null)
	const [recordingDuration, setRecordingDuration] = useState(0)
	const pulseAnim = useRef(new Animated.Value(1)).current
	const recordingInterval = useRef<NodeJS.Timeout | undefined>(undefined)
	const scrollViewRef = useRef<ScrollView>(null)
	const [isLoading, setIsLoading] = useState(true)
	const inputRef = useRef<TextInput>(null)
	const messageToSend = useRef('')

	let [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold
	})

	useEffect(() => {
		const fetchToyLogs = async () => {
			try {
				await dispatch(toyLogs()).unwrap()
				setIsLoading(false)
			} catch (err: any) {
				Toast.show({ type: 'error', text1: err ?? 'Failed to fetch toy logs' })
				setIsLoading(false)
			}
		}
		fetchToyLogs()
	}, [])

	useEffect(() => {
		if (isRecording) {
			Animated.loop(
				Animated.sequence([
					Animated.timing(pulseAnim, {
						toValue: 1.2,
						duration: 1000,
						useNativeDriver: true,
					}),
					Animated.timing(pulseAnim, {
						toValue: 1,
						duration: 1000,
						useNativeDriver: true,
					}),
				])
			).start()

			recordingInterval.current = setInterval(() => {
				setRecordingDuration((prev) => prev + 1)
			}, 1000)
		} else {
			pulseAnim.setValue(1)
			setRecordingDuration(0)
			if (recordingInterval.current) {
				clearInterval(recordingInterval.current)
			}
		}

		return () => {
			if (recordingInterval.current) {
				clearInterval(recordingInterval.current)
			}
		}
	}, [isRecording])

	const formatDuration = (seconds: number) => {
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	const handleSendMessage = useCallback(() => {
		const currentMessage = messageToSend.current || message;
		if (!currentMessage.trim()) return;

		// Create and dispatch message immediately
		dispatch(addMessage({
			id: Date.now().toString(),
			type: 'user_request',
			message: currentMessage.trim(),
			time: new Date().toISOString()
		}));

		// Clear input and refs
		messageToSend.current = '';
		setMessage('');

		// Scroll after a very short delay to ensure message is rendered
		setTimeout(() => {
			scrollViewRef.current?.scrollToEnd({ animated: true });
		}, 10);
	}, [dispatch, message]);

	const handleTextChange = useCallback((text: string) => {
		setMessage(text);
		messageToSend.current = text;
	}, []);

	const startRecording = useCallback(async () => {
		try {
			// Set recording state immediately for UI feedback
			setIsRecording(true);

			const { status } = await Audio.requestPermissionsAsync();
			if (status !== 'granted') {
				setIsRecording(false);
				Toast.show({ type: 'error', text1: 'Permission required for audio recording' });
				return;
			}

			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
				playsInSilentModeIOS: true,
				staysActiveInBackground: true,
			});

			const recordingOptions = {
				...Audio.RecordingOptionsPresets.HIGH_QUALITY,
				android: {
					...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
					isAudioInputPresent: true
				},
				ios: {
					...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
					extension: '.m4a',
					outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
				}
			};

			const { recording } = await Audio.Recording.createAsync(recordingOptions);
			setRecording(recording);
		} catch (err) {
			setIsRecording(false);
			Toast.show({ type: 'error', text1: 'Failed to start recording' });
		}
	}, []);

	const stopRecording = useCallback(async () => {
		if (!recording) {
			setIsRecording(false);
			return;
		}

		try {
			// Update UI state immediately
			setIsRecording(false);
			const recordingInstance = recording;
			setRecording(null);

			// Stop recording
			await recordingInstance.stopAndUnloadAsync();
			const uri = recordingInstance.getURI();

			if (uri) {
				// Dispatch message immediately
				dispatch(addMessage({
					id: Date.now().toString(),
					type: 'user_request',
					message: '',
					audioUri: uri,
					time: new Date().toISOString()
				}));

				// Scroll after a very short delay
				setTimeout(() => {
					scrollViewRef.current?.scrollToEnd({ animated: true });
				}, 10);
			}
		} catch (err) {
			Toast.show({ type: 'error', text1: 'Failed to stop recording' });
		}
	}, [recording, dispatch]);

	if (!fontsLoaded) {
		return null
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1 bg-white"
			>
				<View className="flex-1">
					{isLoading ? (
						<View className="flex h-screen flex-col items-center justify-center gap-2">
							<Chase size={24} color="#CBC0FE" />
							<Text style={{ fontFamily: 'PlusJakartaSans_500Medium' }} className="text-lg text-primary">
								Loading Logs...
							</Text>
						</View>
					) : (
						<>
							<View className="mt-2 flex w-full flex-row items-center justify-between bg-white px-5 py-5">
								<Pressable onPress={() => router.dismiss()} className="p-2">
									<ChevronLeftIcon />
								</Pressable>
								<Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-center text-[20px] text-black">
									Voice Interactions
								</Text>
								<View className="w-6" />
							</View>

							<View className="flex-1 px-5">
								<Text style={{ fontFamily: 'PlusJakartaSans_500Medium' }} className="mb-4 text-center text-[#9B9B9B]">
									{format(new Date(), 'EEE h:mm a')}
								</Text>

								<ScrollView
									ref={scrollViewRef}
									className="flex-1"
									showsVerticalScrollIndicator={false}
									onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
									<View className="flex flex-col gap-4 py-4 mb-14">
										{logs.map((log: ToyLog) => (
											<View
												className={cn("flex w-full flex-row", {
													"justify-end": log.type === "user_request"
												})}
												key={log.id}>
												{log.type !== "user_request" && (
													<View className="mr-2 h-8 w-8 overflow-hidden rounded-full bg-[#F4F1FD] p-1.5">
														<WyloIcon width={20} height={20} />
													</View>
												)}

												<View className={cn("max-w-[80%] flex-col gap-1", {
													"items-end": log.type === "user_request"
												})}>
													<View
														className={cn(
															"rounded-[20px] px-4 py-3",
															log.type === "user_request"
																? "bg-[#7D65FC]"
																: "bg-[#F4F1FD]"
														)}>
														{log.audioUri ? (
															<AudioMessage uri={log.audioUri} />
														) : (
															<Text
																style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
																className={cn(
																	"text-[15px] leading-[22px]",
																	log.type === "user_request"
																		? "text-white"
																		: "text-black"
																)}>
																{log.message}
															</Text>
														)}
													</View>
													<Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-xs text-[#9B9B9B]">
														{format(new Date(log.time), 'h:mm a')}
													</Text>
												</View>
											</View>
										))}
									</View>
								</ScrollView>
							</View>
						</>
					)}
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}
