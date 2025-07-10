import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import { Audio } from 'expo-av'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, StyleSheet, Modal, TouchableOpacity } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase'

import { toyLogs } from '../slices/logs'
import { format } from 'date-fns'
import { useAppDispatch, useAppSelector } from '../hooks'
import { ensureMacAddress } from '../utils/ensureMacAddress'

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

const timeSpans = ['Today', 'Last 7 days', 'This Month', 'All Time'];

export const ToyLogsScreen: React.FC = () => {
	const dispatch = useAppDispatch()
	const logs = useAppSelector((state) => state.logs.toyLogs)
	const router = useRouter()
	const scrollViewRef = useRef<ScrollView>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [summaryVisible, setSummaryVisible] = useState(false);
	const [selectedTimeSpan, setSelectedTimeSpan] = useState(timeSpans[0]);
	const [timeSpanModalVisible, setTimeSpanModalVisible] = useState(false);
	const auth = useAppSelector(state => state.auth)

	// NEW: State for OpenAI summary
	const [summary, setSummary] = useState<string | null>(null)
	const [isSummarizing, setIsSummarizing] = useState(false)

	const [macAddress, setMacAddress] = useState<string | null>(null);
	const [macLoaded, setMacLoaded] = useState<boolean>(false);

	let [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold
	})

	let allowedTimeSpans: string[] = [];
	switch (auth.plan?.toLowerCase()) {
		case "standard":
			allowedTimeSpans = ['This Month'];
			break;
		case "pro":
		case "premium":
			allowedTimeSpans = ['Today', 'Last 7 days', 'This Month', 'All Time'];
			break;
		default:
			allowedTimeSpans = ['Today'];
	}

	// 1) Load MAC once
	useEffect(() => {
		AsyncStorage.getItem('macAddress').then(setMacAddress).finally(() => setMacLoaded(true));
	}, []);

	// 2) Fetch logs once MAC is available
	useEffect(() => {
		const run = async () => {
			if (!macLoaded) return;
			if (!ensureMacAddress(macAddress, true)) { setIsLoading(false); return; }
			try {
				const list = await dispatch(toyLogs(macAddress!)).unwrap();
				console.log('[ToyLogs] fetched', list.length, 'logs for', macAddress);
			} catch (err: any) {
				Toast.show({ type: 'error', text1: err ?? 'Failed to fetch toy logs' });
			} finally {
				setIsLoading(false);
			}
		};
		run();
	}, [macLoaded, macAddress, dispatch]);

	// Helper: filter logs for the selected time span
	const getLogsForSelectedTimeSpan = () => {
		const now = new Date();
		if (selectedTimeSpan === 'Today') {
			const today = now.toISOString().split('T')[0];
			return logs.filter(log => {
				const logDate = new Date(log.time).toISOString().split('T')[0];
				return logDate === today;
			});
		}
		if (selectedTimeSpan === 'Last 7 days') {
			const weekAgo = new Date(now);
			weekAgo.setDate(now.getDate() - 6);
			return logs.filter(log => {
				const logDate = new Date(log.time);
				return logDate >= weekAgo && logDate <= now;
			});
		}
		if (selectedTimeSpan === 'This Month') {
			const month = now.getMonth();
			const year = now.getFullYear();
			return logs.filter(log => {
				const logDate = new Date(log.time);
				return logDate.getMonth() === month && logDate.getFullYear() === year;
			});
		}
		return logs;
	}

	// NEW: Fetch summary from OpenAI via Firebase Function
	const fetchSummary = async () => {
		const logsToSummarize = getLogsForSelectedTimeSpan()
		const textToSummarize = logsToSummarize
			.filter(log => !log.audioUri)
			.map(log => log.message)
			.join(' ')
		if (!textToSummarize) {
			setSummary('No chat interactions to summarize.')
			return
		}
		setIsSummarizing(true)
		try {
			const response = await fetch('https://summarize-k3jpln37bq-uc.a.run.app', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: textToSummarize }),
			})
			const data = await response.json()
			setSummary(data.summary)
		} catch (err: any) {
			setSummary('Failed to fetch summary.')
			Toast.show({ type: 'error', text1: err.message || 'Failed to summarize' })
		} finally {
			setIsSummarizing(false)
		}
	}

	// When summary modal opens, fetch the summary
	const handleOpenSummary = () => {
		setSummaryVisible(true)
		fetchSummary()
	}

	const isFreemium = (auth.plan ?? '').toLowerCase() === 'freemium';
	const logsToDisplay = isFreemium
		? logs.filter(log => {
			const today = new Date().toISOString().split('T')[0];
			const logDate = new Date(log.time).toISOString().split('T')[0];
			return logDate === today;
		})
		: getLogsForSelectedTimeSpan();

	// Determine if summary button should be shown
	const plan = (auth.plan ?? '').toLowerCase();
	const showSummaryButton = plan === 'standard' || plan === 'pro' || plan === 'premium';

	// Fetch last 10 messages (adjust collection path as needed)
	const fetchLast10Messages = async () => {
		const q = query(
			collection(db, 'messages'), // replace 'messages' with your collection name
			orderBy('createdAt', 'desc'),
			limit(10)
		);
		const querySnapshot = await getDocs(q);
		const docIds: string[] = [];
		querySnapshot.forEach(doc => {
			docIds.push(doc.id);
		});
		console.log('Last 10 message document IDs:', docIds);
	};

	useEffect(() => {
		fetchLast10Messages();
	}, []);

	// Helper: Beautify summary by bolding and enlarging headings
	function renderBeautifiedSummary(summary: string) {
		if (!summary) return null;
		// Remove leading 'Summary:' if present
		summary = summary.replace(/^\s*summary\s*:/i, '').trim();
		// Only beautify these headings in the summary body
		const headings = [
			'Interest of child',
			'Suggestion to parents',
		];
		// Split summary into lines
		const lines = summary.split(/\n|\r|(?=Interest of child:|Suggestion to parents:)/g).filter(Boolean);
		return lines.map((line, idx) => {
			const headingMatch = headings.find(h => line.trim().toLowerCase().startsWith(h.toLowerCase()));
			if (headingMatch) {
				// Extract heading and rest of line
				const [heading, ...rest] = line.split(':');
				return (
					<Text key={idx} style={{ fontWeight: 'bold', fontSize: 18, marginTop: idx === 0 ? 0 : 18, marginBottom: 6, color: '#333' }}>
						{heading.trim() + (rest.length ? ':' : '')}
						{rest.length > 0 && (
							<Text style={{ fontWeight: 'normal', fontSize: 15, color: '#444' }}> {rest.join(':').trim()}</Text>
						)}
					</Text>
				);
			}
			return (
				<Text key={idx} style={{ fontSize: 15, color: '#444', marginBottom: 8 }}>{line.trim()}</Text>
			);
		});
	}

	if (!fontsLoaded) {
		return null
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
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
								<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
									<Text style={[styles.headerTitle, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Chat Interactions</Text>
								</View>
								<View style={{ width: 40 }} />
							</View>
							{auth.plan === 'freemium' ? (
								<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
									<Text style={{ fontSize: 16, color: '#7D65FC', textAlign: 'center' }}>
										Upgrade your plan to access chat logs and summaries.
									</Text>
								</View>
							) : (
								<>
									<View
										style={{
											flexDirection: 'row',
											justifyContent: 'flex-end',
											alignItems: 'center',
											gap: 8,
											marginBottom: 8,
											paddingHorizontal: 20,
										}}
									>
										<TouchableOpacity onPress={() => setTimeSpanModalVisible(true)} style={{ padding: 8, backgroundColor: '#F4F1FD', borderRadius: 8 }}>
											<Text style={{ color: '#7D65FC', fontWeight: '600' }}>{selectedTimeSpan}</Text>
										</TouchableOpacity>
										{showSummaryButton && (
											<TouchableOpacity onPress={handleOpenSummary} style={{ padding: 8, backgroundColor: '#7D65FC', borderRadius: 8 }}>
												<Text style={{ color: 'white', fontWeight: '600' }}>Summary</Text>
											</TouchableOpacity>
										)}
									</View>

									{/* Summary Modal */}
									<Modal visible={summaryVisible} transparent animationType="fade">
										<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
											<View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '80%' }}>
												<Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Summary</Text>
												<ScrollView
													style={{ maxHeight: 400 }}
													contentContainerStyle={{ paddingBottom: 24 }}
													showsVerticalScrollIndicator={true}
													bounces={true}
												>
													{isSummarizing ? (
														<Text style={{ color: '#444' }}>Summarizing...</Text>
													) : (
														// Beautified summary rendering
														<View>{renderBeautifiedSummary(summary || '')}</View>
													)}
												</ScrollView>
												<TouchableOpacity onPress={() => setSummaryVisible(false)} style={{ marginTop: 16, alignSelf: 'flex-end' }}>
													<Text style={{ color: '#7D65FC', fontWeight: 'bold' }}>Close</Text>
												</TouchableOpacity>
											</View>
										</View>
									</Modal>

									{/* Time Span Modal */}
									<Modal visible={timeSpanModalVisible} transparent animationType="fade">
										<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
											<View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '70%' }}>
												<Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Select Time Span</Text>
												{allowedTimeSpans.map(span => (
													<TouchableOpacity key={span} onPress={() => { setSelectedTimeSpan(span); setTimeSpanModalVisible(false); }} style={{ paddingVertical: 10 }}>
														<Text style={{ color: span === selectedTimeSpan ? '#7D65FC' : '#444', fontWeight: span === selectedTimeSpan ? 'bold' : 'normal' }}>{span}</Text>
													</TouchableOpacity>
												))}
												<TouchableOpacity onPress={() => setTimeSpanModalVisible(false)} style={{ marginTop: 16, alignSelf: 'flex-end' }}>
													<Text style={{ color: '#7D65FC', fontWeight: 'bold' }}>Close</Text>
												</TouchableOpacity>
											</View>
										</View>
									</Modal>

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
												{logsToDisplay.length === 0 ? (
													<Text style={{ color: '#9B9B9B', textAlign: 'center', marginTop: 32 }}>
														No chat logs available for this period.
													</Text>
												) : (
													logsToDisplay.map((log) => (
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
													))
												)}
											</View>
										</ScrollView>
									</View>
								</>
							)}
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
		paddingTop: Platform.OS === 'ios' ? 60 : 0,
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
	},
	moodCount: {
		flex: 1,
		fontSize: 14,
		textAlign: 'right',
	},
});
