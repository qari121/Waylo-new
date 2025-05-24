import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import { Audio } from 'expo-av'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import { toyLogs } from '../slices/logs'
import { format } from 'date-fns'
import { useAppDispatch, useAppSelector } from '../hooks'

import ChevronLeftIcon from '../assets/icons/chevron-left.svg'
import PlayIcon from '../assets/icons/play.svg'
import WyloIcon from '../assets/icons/wylo.svg'

interface AudioMessageProps {
	uri: string;
}

const AudioMessage: React.FC<AudioMessageProps> = ({ uri }) => {
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
		<View style={styles.audioMessageContainer}>
			<Pressable
				onPress={playSound}
				style={styles.playButton}
			>
				<PlayIcon width={18} height={16} color="#FFFFFF" />
			</Pressable>
			<View style={styles.audioWaveformContainer}>
				<View style={styles.audioWaveform}>
					{Array.from({ length: 30 }).map((_, i) => (
						<View
							key={i}
							style={[
								styles.audioWaveformBar,
								{
									height: `${Math.random() * 100}%`,
								}
							]}
						/>
					))}
				</View>
			</View>
		</View>
	);
};

export const ToyLogsScreen: React.FC = () => {
	const dispatch = useAppDispatch()
	const logs = useAppSelector((state) => state.logs.toyLogs)
	const router = useRouter()
	const scrollViewRef = useRef<ScrollView>(null)
	const [isLoading, setIsLoading] = useState(true)

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
	}, [dispatch])

	if (!fontsLoaded) {
		return null
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardAvoidingView}
			>
				<View style={styles.container}>
					{isLoading ? (
						<View style={styles.loadingContainer}>
							<Chase size={24} color="#CBC0FE" />
							<Text style={[styles.loadingText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
								Loading Logs...
							</Text>
						</View>
					) : (
						<>
							<View style={styles.header}>
								<Pressable onPress={() => router.dismiss()} style={styles.backButton}>
									<ChevronLeftIcon />
								</Pressable>
								<Text style={[styles.headerTitle, { fontFamily: 'PlusJakartaSans_700Bold' }]}>
									Chat Interactions
								</Text>
								<View style={styles.headerSpacer} />
							</View>

							<View style={styles.content}>
								<Text style={[styles.dateText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
									{format(new Date(), 'EEE h:mm a')}
								</Text>

								<ScrollView
									ref={scrollViewRef}
									style={styles.scrollView}
									showsVerticalScrollIndicator={false}
									onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
									<View style={styles.logsContainer}>
										{logs.map((log) => (
											<View
												style={[
													styles.logRow,
													log.type === "user_request" && styles.logRowUser
												]}
												key={log.id}>
												{log.type !== "user_request" && (
													<View style={styles.avatarContainer}>
														<WyloIcon width={20} height={20} />
													</View>
												)}

												<View style={[
													styles.messageContainer,
													log.type === "user_request" && styles.messageContainerUser
												]}>
													<View style={[
														styles.messageBubble,
														log.type === "user_request" ? styles.messageBubbleUser : styles.messageBubbleWylo
													]}>
														{log.audioUri ? (
															<AudioMessage uri={log.audioUri} />
														) : (
															<Text
																style={[
																	styles.messageText,
																	{ fontFamily: 'PlusJakartaSans_400Regular' },
																	log.type === "user_request" ? styles.messageTextUser : styles.messageTextWylo
																]}>
																{log.message}
															</Text>
														)}
													</View>
													<Text style={[styles.timeText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
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

const styles = StyleSheet.create({
	keyboardAvoidingView: {
		flex: 1,
		backgroundColor: 'white',
	},
	container: {
		flex: 1,
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
		color: '#7D65FC',
	},
	header: {
		marginTop: 8,
		flexDirection: 'row',
		width: '100%',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: 'white',
		paddingHorizontal: 20,
		paddingVertical: 20,
	},
	backButton: {
		padding: 8,
	},
	headerTitle: {
		textAlign: 'center',
		fontSize: 20,
		color: 'black',
	},
	headerSpacer: {
		width: 24,
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
	},
	dateText: {
		marginBottom: 16,
		textAlign: 'center',
		color: '#9B9B9B',
	},
	scrollView: {
		flex: 1,
	},
	logsContainer: {
		flexDirection: 'column',
		gap: 16,
		paddingVertical: 16,
		marginBottom: 56,
	},
	logRow: {
		flexDirection: 'row',
		width: '100%',
	},
	logRowUser: {
		justifyContent: 'flex-end',
	},
	avatarContainer: {
		marginRight: 8,
		height: 32,
		width: 32,
		overflow: 'hidden',
		borderRadius: 16,
		backgroundColor: '#F4F1FD',
		padding: 6,
	},
	messageContainer: {
		maxWidth: '80%',
		flexDirection: 'column',
		gap: 4,
	},
	messageContainerUser: {
		alignItems: 'flex-end',
	},
	messageBubble: {
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	messageBubbleUser: {
		backgroundColor: '#7D65FC',
	},
	messageBubbleWylo: {
		backgroundColor: '#F4F1FD',
	},
	messageText: {
		fontSize: 15,
		lineHeight: 22,
	},
	messageTextUser: {
		color: 'white',
	},
	messageTextWylo: {
		color: 'black',
	},
	timeText: {
		fontSize: 12,
		color: '#9B9B9B',
	},
	audioMessageContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		minWidth: 200,
	},
	playButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: 'rgba(255, 255, 255, 0.2)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	audioWaveformContainer: {
		flex: 1,
	},
	audioWaveform: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 24,
		gap: 2,
	},
	audioWaveformBar: {
		flex: 1,
		backgroundColor: 'white',
		opacity: 0.5,
		width: 2,
		borderRadius: 1,
	},
});
