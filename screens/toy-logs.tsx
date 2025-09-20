import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import { Audio } from 'expo-av'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, StyleSheet, Modal, TouchableOpacity, Clipboard } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { collection, getDocs, query, orderBy, limit, where, startAfter } from 'firebase/firestore'
import { db } from '../firebase'

import { toyLogs } from '../slices/logs'
import { format } from 'date-fns'
import { useAppDispatch, useAppSelector } from '../hooks'
import { ensureMacAddress } from '../utils/ensureMacAddress'

import ChevronLeftIcon from '../assets/icons/chevron-left.svg'
import PlayIcon from '../assets/icons/play.svg'
import WyloIcon from '../assets/icons/wylo.svg'
import CopyIcon from '../assets/icons/copy.svg'
import { theme } from '../lib/theme'
import { BackButton } from '../components/ui/back-button'

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
	const [selectedTimeSpan, setSelectedTimeSpan] = useState('All Time');
	const [timeSpanModalVisible, setTimeSpanModalVisible] = useState(false);
	const auth = useAppSelector(state => state.auth)

	// NEW: State for OpenAI summary
	const [summary, setSummary] = useState<string | null>(null)
	const [isSummarizing, setIsSummarizing] = useState(false)

	const [macAddress, setMacAddress] = useState<string | null>(null);
	const [macLoaded, setMacLoaded] = useState<boolean>(false);
	const [directLogs, setDirectLogs] = useState<any[]>([]);
	const [hasMoreLogs, setHasMoreLogs] = useState<boolean>(false);
	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
	const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);

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

	// Direct fetch function - fetch toy logs with pagination support
	const fetchDirectLogs = async (mac: string, loadMore: boolean = false) => {
		try {
			console.log('[ToyLogs] Fetching toy logs for MAC:', mac, loadMore ? '(loading more)' : '(initial load)');
			
			let directLogsData: any[] = [];
			let querySnapshot: any;
			
			// Try MAC-specific query first, but handle index error gracefully
			try {
				let directQuery;
				if (loadMore && lastVisibleDoc) {
					// Load more logs after the last visible document
					directQuery = query(
						collection(db, 'toy_logs'),
						where('toy_mac_address', '==', mac),
						orderBy('time', 'desc'),
						startAfter(lastVisibleDoc),
						limit(100) // Smaller batches for pagination
					);
				} else {
					// Initial load
					directQuery = query(
						collection(db, 'toy_logs'),
						where('toy_mac_address', '==', mac),
						orderBy('time', 'desc'),
						limit(100) // Initial batch
					);
				}
				
				querySnapshot = await getDocs(directQuery);
				console.log('[ToyLogs] MAC-specific query found', querySnapshot.size, 'documents');
			} catch (indexError) {
				console.warn('[ToyLogs] MAC-specific query failed (index error), falling back to all logs:', indexError);
				querySnapshot = null;
			}
			
			// If MAC-specific query failed or returned no results, use all logs fallback
			if (!querySnapshot || querySnapshot.size === 0) {
				console.log('[ToyLogs] Using fallback query for all logs...');
				try {
					let allLogsQuery;
					if (loadMore && lastVisibleDoc) {
						// Load more logs after the last visible document
						allLogsQuery = query(
							collection(db, 'toy_logs'),
							orderBy('time', 'desc'),
							startAfter(lastVisibleDoc),
							limit(100) // Smaller batches for pagination
						);
					} else {
						// Initial load
						allLogsQuery = query(
							collection(db, 'toy_logs'),
							orderBy('time', 'desc'),
							limit(100) // Initial batch
						);
					}
					
					querySnapshot = await getDocs(allLogsQuery);
					console.log('[ToyLogs] All logs query found', querySnapshot.size, 'documents');
				} catch (allLogsErr) {
					console.error('[ToyLogs] All logs fallback failed:', allLogsErr);
					return [];
				}
			}
			
			// Process the results
			querySnapshot.forEach((doc: any) => {
				const data = doc.data();
				
				// Keep the original Firestore timestamp - NO conversion
				directLogsData.push({ 
					id: doc.id, 
					...data
					// Keep original time field as is
				});
			});
			
			// Update pagination state
			if (querySnapshot.docs.length > 0) {
				setLastVisibleDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
				setHasMoreLogs(querySnapshot.docs.length === 100); // If we got exactly 100, there might be more
			} else {
				setHasMoreLogs(false);
			}
			
			// Sort by time using original Firestore timestamp with error handling
			directLogsData.sort((a, b) => {
				try {
					let timeA: number;
					if (a.time?.toDate && typeof a.time.toDate === 'function') {
						timeA = a.time.toDate().getTime();
					} else if (a.time?.seconds && typeof a.time.seconds === 'number') {
						timeA = a.time.seconds * 1000;
					} else if (a.time) {
						timeA = new Date(a.time).getTime();
					} else {
						timeA = 0; // Default to epoch time for logs without time
					}
					
					let timeB: number;
					if (b.time?.toDate && typeof b.time.toDate === 'function') {
						timeB = b.time.toDate().getTime();
					} else if (b.time?.seconds && typeof b.time.seconds === 'number') {
						timeB = b.time.seconds * 1000;
					} else if (b.time) {
						timeB = new Date(b.time).getTime();
					} else {
						timeB = 0; // Default to epoch time for logs without time
					}
					
					// Validate timestamps
					if (isNaN(timeA)) timeA = 0;
					if (isNaN(timeB)) timeB = 0;
					
					return timeA - timeB; // earliest first
				} catch (error) {
					console.error('[ToyLogs] Error sorting logs:', error, 'log A:', a.id, 'log B:', b.id);
					return 0; // Keep original order if sorting fails
				}
			});
			
			console.log('[ToyLogs] Processed', directLogsData.length, 'logs with original Firestore timestamps');
			
			// Log sample timestamps for debugging
			if (directLogsData.length > 0) {
				console.log('[ToyLogs] Sample original timestamps:');
				directLogsData.slice(0, 5).forEach((log, index) => {
					let parsedTime: Date | null = null;
					if (log.time?.toDate && typeof log.time.toDate === 'function') {
						parsedTime = log.time.toDate();
					} else if (log.time?.seconds && typeof log.time.seconds === 'number') {
						parsedTime = new Date(log.time.seconds * 1000);
					} else if (log.time) {
						parsedTime = new Date(log.time);
					}
					
					console.log(`  Log ${index + 1}:`, {
						id: log.id,
						originalTime: log.time,
						timeType: typeof log.time,
						timeConstructor: log.time?.constructor?.name,
						hasToDate: !!log.time?.toDate,
						hasSeconds: !!log.time?.seconds,
						parsedTime: parsedTime?.toLocaleString(),
						parsedTimeISO: parsedTime?.toISOString(),
						parsedTimeLocal: parsedTime ? new Date(parsedTime.getFullYear(), parsedTime.getMonth(), parsedTime.getDate()).toLocaleDateString() : 'N/A'
					});
				});
			}
			
			// Only set directLogs if this is not a loadMore operation
			if (!loadMore) {
				setDirectLogs(directLogsData);
			}
			return directLogsData;
		} catch (error) {
			console.error('[ToyLogs] Direct fetch error:', error);
			return [];
		}
	};

	// Log when time span changes
	useEffect(() => {
		console.log('[ToyLogs] Time span changed to:', selectedTimeSpan);
	}, [selectedTimeSpan]);

	// Load more logs function
	const loadMoreLogs = async () => {
		if (!macAddress || !hasMoreLogs || isLoadingMore) return;
		
		setIsLoadingMore(true);
		try {
			const moreLogs = await fetchDirectLogs(macAddress, true);
			if (moreLogs.length > 0) {
				setDirectLogs(prev => {
					const newLogs = [...prev, ...moreLogs];
					console.log('[ToyLogs] Loaded', moreLogs.length, 'more logs. Total:', newLogs.length);
					return newLogs;
				});
			} else {
				setHasMoreLogs(false);
			}
		} catch (error) {
			console.error('[ToyLogs] Error loading more logs:', error);
			Toast.show({ type: 'error', text1: 'Failed to load more logs' });
		} finally {
			setIsLoadingMore(false);
		}
	};

	// 2) Fetch logs once MAC is available - ALWAYS use direct fetch for complete data
	useEffect(() => {
		const run = async () => {
			if (!macLoaded) return;
			if (!ensureMacAddress(macAddress, true)) { setIsLoading(false); return; }
			
			try {
				console.log('[ToyLogs] Starting data fetch for MAC:', macAddress);
				
				// Reset pagination state
				setLastVisibleDoc(null);
				setHasMoreLogs(false);
				
				// ALWAYS fetch directly from Firestore to get COMPLETE dataset
				const directList = await fetchDirectLogs(macAddress!);
				console.log('[ToyLogs] Direct fetch completed, got', directList.length, 'logs');
				
				// Also try Redux for comparison (but don't rely on it)
				try {
					const reduxList = await dispatch(toyLogs(macAddress!)).unwrap();
					console.log('[ToyLogs] Redux fetch got', reduxList.length, 'logs');
				} catch (reduxErr) {
					console.log('[ToyLogs] Redux fetch failed, using direct data only');
				}
				
			} catch (err: any) {
				console.error('[ToyLogs] Error fetching logs:', err);
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
		console.log('[ToyLogs] Filtering logs for time span:', selectedTimeSpan, 'Total logs available:', effectiveLogs.length);
		console.log('[ToyLogs] Current local time:', now.toLocaleString());
		console.log('[ToyLogs] Current UTC time:', now.toISOString());
		console.log('[ToyLogs] Timezone offset (minutes):', now.getTimezoneOffset());
		console.log('[ToyLogs] Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
		
		// If "All Time" is selected, return all logs without filtering
		if (selectedTimeSpan === 'All Time') {
			console.log('[ToyLogs] All Time selected - returning all', effectiveLogs.length, 'logs without filtering');
			return effectiveLogs;
		}
		
		if (selectedTimeSpan === 'Today') {
			// Get today's date boundaries in local timezone
			const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const todayEnd = new Date(todayStart);
			todayEnd.setDate(todayEnd.getDate() + 1);
			
			console.log('[ToyLogs] Today boundaries:', {
				start: todayStart.toLocaleString(),
				end: todayEnd.toLocaleString(),
				startISO: todayStart.toISOString(),
				endISO: todayEnd.toISOString()
			});
			
			// Log what today should be
			console.log('[ToyLogs] Today should be:', {
				year: now.getFullYear(),
				month: now.getMonth() + 1, // +1 because getMonth() is 0-indexed
				day: now.getDate(),
				fullDate: now.toDateString()
			});
			
			const filteredLogs = effectiveLogs.filter(log => {
				// Use original Firestore timestamp directly
				let logTime: Date;
				if (log.time?.toDate && typeof log.time.toDate === 'function') {
					logTime = log.time.toDate();
				} else if (log.time?.seconds && typeof log.time.seconds === 'number') {
					logTime = new Date(log.time.seconds * 1000);
				} else if (log.time) {
					logTime = new Date(log.time);
				} else {
					return false; // Skip logs without time
				}
				
				// Convert log time to local date for comparison
				const logLocalDate = new Date(logTime.getFullYear(), logTime.getMonth(), logTime.getDate());
				const isToday = logLocalDate >= todayStart && logLocalDate < todayEnd;
				
				// Only log logs that are actually today for debugging
				if (isToday) {
					console.log('[ToyLogs] Log is today:', {
						logId: log.id,
						logTime: logTime.toLocaleString(),
						logLocalDate: logLocalDate.toLocaleDateString()
					});
				}
				
				return isToday;
			});
			console.log('[ToyLogs] Today filter: found', filteredLogs.length, 'logs for', todayStart.toLocaleDateString());
			return filteredLogs;
		}
		
		if (selectedTimeSpan === 'Last 7 days') {
			const weekAgo = new Date(now);
			weekAgo.setDate(now.getDate() - 6);
			weekAgo.setHours(0, 0, 0, 0);
			const endOfToday = new Date(now);
			endOfToday.setHours(23, 59, 59, 999);
			
			const filteredLogs = effectiveLogs.filter(log => {
				let logDate: Date;
				if (log.time?.toDate && typeof log.time.toDate === 'function') {
					logDate = log.time.toDate();
				} else if (log.time?.seconds && typeof log.time.seconds === 'number') {
					logDate = new Date(log.time.seconds * 1000);
				} else if (log.time) {
					logDate = new Date(log.time);
				} else {
					return false;
				}
				return logDate >= weekAgo && logDate <= endOfToday;
			});
			console.log('[ToyLogs] 7 days filter: found', filteredLogs.length, 'logs from', weekAgo.toLocaleDateString(), 'to', endOfToday.toLocaleDateString());
			return filteredLogs;
		}
		
		if (selectedTimeSpan === 'This Month') {
			const month = now.getMonth();
			const year = now.getFullYear();
			const filteredLogs = effectiveLogs.filter(log => {
				let logDate: Date;
				if (log.time?.toDate && typeof log.time.toDate === 'function') {
					logDate = log.time.toDate();
				} else if (log.time?.seconds && typeof log.time.seconds === 'number') {
					logDate = new Date(log.time.seconds * 1000);
				} else if (log.time) {
					logDate = new Date(log.time);
				} else {
					return false;
				}
				return logDate.getMonth() === month && logDate.getFullYear() === year;
			});
			console.log('[ToyLogs] This month filter: found', filteredLogs.length, 'logs for', month + 1, year);
			return filteredLogs;
		}
		
		// For 'All Time' or any other case, return ALL logs
		console.log('[ToyLogs] All Time: returning all', effectiveLogs.length, 'logs');
		return effectiveLogs;
	}

	// NEW: Fetch summary from OpenAI via Firebase Function
	const fetchSummary = async () => {
		const logsToSummarize = getLogsForSelectedTimeSpan()
		
		// Limit logs to prevent memory issues and API limits
		const limitedLogs = logsToSummarize.slice(0, 100) // Only process last 100 logs
		
		const textToSummarize = limitedLogs
			.filter(log => !log.audioUri && log.message) // Only text messages
			.map(log => log.message)
			.join(' ')
			
		if (!textToSummarize) {
			setSummary('No chat interactions to summarize.')
			return
		}
		
		// Limit text length to prevent API issues
		const maxTextLength = 10000; // 10k characters max
		const truncatedText = textToSummarize.length > maxTextLength 
			? textToSummarize.substring(0, maxTextLength) + '...'
			: textToSummarize;
			
		console.log(`[Summary] Processing ${limitedLogs.length} logs, text length: ${truncatedText.length}`);
		
		setIsSummarizing(true)
		try {
			const response = await fetch('https://summarize-k3jpln37bq-uc.a.run.app', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: truncatedText }),
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

	// Copy summary to clipboard
	const handleCopySummary = async () => {
		if (!summary) return;
		
		try {
			await Clipboard.setString(summary);
			Toast.show({ 
				type: 'success', 
				text1: 'Summary copied to clipboard!',
				position: 'bottom'
			});
		} catch (error) {
			Toast.show({ 
				type: 'error', 
				text1: 'Failed to copy summary',
				position: 'bottom'
			});
		}
	}

	const isFreemium = (auth.plan ?? '').toLowerCase() === 'freemium';
	
	// ALWAYS use direct logs as the source of truth (complete dataset)
	const effectiveLogs = directLogs;
	
	const logsToDisplay = isFreemium
		? effectiveLogs.filter(log => {
			// Get today's date boundaries in local timezone (same logic as above)
			const now = new Date();
			const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const todayEnd = new Date(todayStart);
			todayEnd.setDate(todayEnd.getDate() + 1);
			
			console.log('[ToyLogs] Freemium filter - Today boundaries:', {
				start: todayStart.toLocaleString(),
				end: todayEnd.toLocaleString()
			});
			
			console.log('[ToyLogs] Freemium filter - Today should be:', {
				year: now.getFullYear(),
				month: now.getMonth() + 1,
				day: now.getDate(),
				fullDate: now.toDateString()
			});
			
			// Use original Firestore timestamp directly
			let logTime: Date;
			if (log.time?.toDate && typeof log.time.toDate === 'function') {
				logTime = log.time.toDate();
			} else if (log.time?.seconds && typeof log.time.seconds === 'number') {
				logTime = new Date(log.time.seconds * 1000);
			} else if (log.time) {
				logTime = new Date(log.time);
			} else {
				return false; // Skip logs without time
			}
			
			// Convert log time to local date for comparison
			const logLocalDate = new Date(logTime.getFullYear(), logTime.getMonth(), logTime.getDate());
			const isToday = logLocalDate >= todayStart && logLocalDate < todayEnd;
			
			// Only log logs that are actually today for debugging
			if (isToday) {
				console.log('[ToyLogs] Freemium filter - Log is today:', {
					logId: log.id,
					logTime: logTime.toLocaleString(),
					logLocalDate: logLocalDate.toLocaleDateString()
				});
			}
			
			return isToday;
		})
		: getLogsForSelectedTimeSpan();

	// Determine if summary button should be shown
	const plan = (auth.plan ?? '').toLowerCase();
	const showSummaryButton = plan === 'standard' || plan === 'pro' || plan === 'premium';



	// Removed unused fetchLast10Messages function

	// Helper: Group logs by date for better display
	const groupLogsByDate = (logsToGroup: any[]) => {
		const grouped: { [key: string]: any[] } = {};
		
		console.log('[ToyLogs] Grouping', logsToGroup.length, 'logs by date...');
		
		logsToGroup.forEach(log => {
			try {
				// Use original Firestore timestamp directly for proper grouping
				let logTime: Date;
				if (log.time?.toDate && typeof log.time.toDate === 'function') {
					logTime = log.time.toDate();
				} else if (log.time?.seconds && typeof log.time.seconds === 'number') {
					logTime = new Date(log.time.seconds * 1000);
				} else if (log.time) {
					logTime = new Date(log.time);
				} else {
					console.warn('[ToyLogs] Log without time field, skipping:', log.id);
					return;
				}
				
				// Validate that the date is valid
				if (isNaN(logTime.getTime())) {
					console.warn('[ToyLogs] Invalid timestamp, skipping log:', log.id, 'time:', log.time);
					return;
				}
				
				// Create a local date object for consistent grouping
				const localDate = new Date(logTime.getFullYear(), logTime.getMonth(), logTime.getDate());
				// Use local date string for grouping to avoid timezone issues
				const dateKey = localDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format
				
				if (!grouped[dateKey]) {
					grouped[dateKey] = [];
				}
				grouped[dateKey].push(log);
			} catch (error) {
				console.error('[ToyLogs] Error processing log timestamp:', error, 'log:', log.id, 'time field:', log.time);
				// Skip this log if there's an error
				return;
			}
		});
		
		console.log('[ToyLogs] Date groups found:', Object.keys(grouped));
		
		// Sort dates in ascending order (earliest first)
		return Object.keys(grouped)
			.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
			.reduce((result, date) => {
				result[date] = grouped[date];
				return result;
			}, {} as { [key: string]: any[] });
	};

	// Group logs by date for better display
	const groupedLogs = groupLogsByDate(logsToDisplay);
	
	// Debug: Log the final grouped logs and show what was filtered out
	console.log('[ToyLogs] Final grouped logs:', {
		totalLogs: logsToDisplay.length,
		dateGroups: Object.keys(groupedLogs),
		groupedLogsCount: Object.entries(groupedLogs).map(([date, logs]) => ({ date, count: logs.length })),
		selectedTimeSpan: selectedTimeSpan,
		totalAvailableLogs: effectiveLogs.length
	});
	
	// Show what logs were filtered out for debugging
	if (effectiveLogs.length > logsToDisplay.length) {
		const filteredOutLogs = effectiveLogs.filter(log => !logsToDisplay.includes(log));
		console.log('[ToyLogs] Filtered out logs:', filteredOutLogs.length, 'logs due to time span filter:', selectedTimeSpan);
		if (filteredOutLogs.length > 0) {
			console.log('[ToyLogs] Sample filtered out log:', {
				id: filteredOutLogs[0].id,
				time: filteredOutLogs[0].time,
				parsedTime: (() => {
					const log = filteredOutLogs[0];
					if (log.time?.toDate && typeof log.time.toDate === 'function') {
						return log.time.toDate().toLocaleString();
					} else if (log.time?.seconds && typeof log.time.seconds === 'number') {
						return new Date(log.time.seconds * 1000).toLocaleString();
					} else if (log.time) {
						return new Date(log.time).toLocaleString();
					}
					return 'No time';
				})()
			});
		}
	}

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
							<Chase size={24} color={theme.colors.primary} />
							<Text style={[styles.loadingText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
								Loading Logs...
							</Text>
						</View>
					) : (
						<>
							<View style={styles.header}>
								<BackButton onPress={() => router.dismiss()} />
								<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
									<Text style={[styles.headerTitle, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Chat Interactions</Text>
								</View>
								<View style={{ width: 40 }} />
							</View>
							{auth.plan === 'freemium' ? (
								<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
									<Text style={{ fontSize: 16, color: theme.colors.primary, textAlign: 'center' }}>
										Please pair your device and enter a MAC address to view chat interactions.
									</Text>
								</View>
							) : (
								<>
									<View
										style={{
											flexDirection: 'row',
											justifyContent: 'space-between',
											alignItems: 'center',
											marginBottom: 8,
											paddingHorizontal: 20,
										}}
									>
										<View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
											<TouchableOpacity 
												onPress={async () => {
													if (macAddress) {
														setIsLoading(true);
														await fetchDirectLogs(macAddress);
														setIsLoading(false);
													}
												}} 
												style={{ 
													paddingHorizontal: 16, 
													paddingVertical: 8, 
													backgroundColor: '#f0f0f0', 
													borderRadius: 8, 
													marginBottom: 4,
													marginTop: 15,
													height: 36,
													justifyContent: 'center',
													alignItems: 'center'
												}}
											>
												<Text style={{ color: '#666', fontWeight: '600', fontSize: 14 }}>Refresh</Text>
											</TouchableOpacity>
											<Text style={{ color: '#666', fontSize: 10 }}>
												{effectiveLogs.length} total logs • {Object.keys(groupedLogs).length} days
											</Text>
										</View>
										<View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
											<TouchableOpacity 
												onPress={() => setTimeSpanModalVisible(true)} 
												style={{ 
													paddingHorizontal: 16, 
													paddingVertical: 8, 
													backgroundColor: theme.colors.primary + '10', 
													borderRadius: 8,
													height: 36,
													justifyContent: 'center',
													alignItems: 'center'
												}}
											>
												<Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 14 }}>{selectedTimeSpan}</Text>
											</TouchableOpacity>
											{showSummaryButton && (
												<TouchableOpacity 
													onPress={handleOpenSummary} 
													style={{ 
														paddingHorizontal: 16, 
														paddingVertical: 8, 
														backgroundColor: theme.colors.primary, 
														borderRadius: 8,
														height: 36,
														justifyContent: 'center',
														alignItems: 'center'
													}}
												>
													<Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Summary</Text>
												</TouchableOpacity>
											)}
										</View>
									</View>

									{/* Summary Modal */}
									<Modal visible={summaryVisible} transparent animationType="fade">
										<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
											<View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '80%' }}>
												<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
													<Text style={{ fontWeight: 'bold', fontSize: 18 }}>Summary</Text>
													{summary && !isSummarizing && (
														<TouchableOpacity 
															onPress={handleCopySummary}
															style={{ 
																padding: 8, 
																borderRadius: 8, 
																backgroundColor: theme.colors.primary + '10' 
															}}
														>
															<CopyIcon width={20} height={20} color={theme.colors.primary} />
														</TouchableOpacity>
													)}
												</View>
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
													<Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Close</Text>
												</TouchableOpacity>
											</View>
										</View>
									</Modal>

									{/* Time Span Modal */}
									<Modal visible={timeSpanModalVisible} transparent animationType="none">
										<View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }}>
											<View style={{ backgroundColor: 'white', borderRadius: 16, padding: 24, width: '70%' }}>
												<Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Select Time Span</Text>
												{allowedTimeSpans.map(span => (
													<TouchableOpacity key={span} onPress={() => { 
														console.log('[ToyLogs] User selected time span:', span);
														setSelectedTimeSpan(span); 
														setTimeSpanModalVisible(false); 
													}} style={{ paddingVertical: 10 }}>
														<Text style={{ color: span === selectedTimeSpan ? theme.colors.primary : '#444', fontWeight: span === selectedTimeSpan ? 'bold' : 'normal' }}>{span}</Text>
														{span === selectedTimeSpan && (
															<Text style={{ fontSize: 12, color: '#999', marginTop: 2 }}>Currently selected</Text>
														)}
													</TouchableOpacity>
												))}
												<TouchableOpacity onPress={() => setTimeSpanModalVisible(false)} style={{ marginTop: 16, alignSelf: 'flex-end' }}>
													<Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>Close</Text>
												</TouchableOpacity>
											</View>
										</View>
									</Modal>

									<View style={styles.content}>
										{/* Show current time span and total logs info */}
										<View style={{ paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#f8f9fa', borderRadius: 8, marginBottom: 16 }}>
											<Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
												Showing logs for: <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{selectedTimeSpan}</Text>
											</Text>
											{selectedTimeSpan !== 'All Time' && (
												<Text style={{ fontSize: 14, color: '#999', textAlign: 'center' }}>
													Switch to "All Time" to see all logs
												</Text>
											)}
										</View>

										{/* Remove the static date display since we'll show individual timestamps */}

										<ScrollView
											ref={scrollViewRef}
											style={styles.scrollView}
											showsVerticalScrollIndicator={false}
											onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
											<View style={styles.logsContainer}>
												{Object.keys(groupedLogs).length === 0 ? (
													<View style={{ alignItems: 'center', marginTop: 32 }}>
														<Text style={{ color: '#9B9B9B', textAlign: 'center', marginBottom: 8 }}>
															No chat logs available for this period.
														</Text>
														{selectedTimeSpan !== 'All Time' && (
															<View style={{ alignItems: 'center', marginTop: 8 }}>
																<Text style={{ color: theme.colors.primary, textAlign: 'center', fontSize: 14, marginBottom: 8 }}>
																	Try switching to "All Time" to see all available logs
																</Text>
																<TouchableOpacity 
																	onPress={() => {
																		console.log('[ToyLogs] User clicked "Show All Logs" button');
																		setSelectedTimeSpan('All Time');
																	}} 
																	style={{ 
																		paddingHorizontal: 16, 
																		paddingVertical: 8, 
														backgroundColor: theme.colors.primary, 
														borderRadius: 8 
																	}}
																>
																	<Text style={{ color: 'white', fontWeight: '600' }}>Show All Logs</Text>
																</TouchableOpacity>
															</View>
														)}
													</View>
												) : (
													<>
														{Object.entries(groupedLogs).map(([date, dateLogs]) => (
														<View key={date} style={styles.dateGroup}>
															<Text style={styles.dateHeader}>
																{(() => {
																	try {
																		// Parse the date string (YYYY-MM-DD) and create a local date
																		const [year, month, day] = date.split('-').map(Number);
																		if (!year || !month || !day) {
																			return 'Invalid date';
																		}
																		// Create date in local timezone (month is 0-indexed)
																		const dateObj = new Date(year, month - 1, day);
																		if (isNaN(dateObj.getTime())) {
																			return 'Invalid date';
																		}
																		return format(dateObj, 'EEEE, MMMM d, yyyy');
																	} catch (error) {
																		console.error('[ToyLogs] Error formatting date header:', error, 'date:', date);
																		return 'Invalid date';
																	}
																})()}
															</Text>
															{dateLogs.map((log) => (
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
																			{(() => {
																				try {
																					let logTime: Date;
																					if (log.time?.toDate && typeof log.time.toDate === 'function') {
																						logTime = log.time.toDate();
																					} else if (log.time?.seconds && typeof log.time.seconds === 'number') {
																						logTime = new Date(log.time.seconds * 1000);
																					} else if (log.time) {
																						logTime = new Date(log.time);
																					} else {
																						return 'Invalid time';
																					}
																					
																					if (isNaN(logTime.getTime())) {
																						return 'Invalid time';
																					}
																					
																					return format(logTime, 'h:mm a');
																				} catch (error) {
																					console.error('[ToyLogs] Error formatting time:', error, 'log:', log.id, 'time:', log.time);
																					return 'Invalid time';
																				}
																			})()}
																		</Text>
																	</View>
																</View>
															))}
														</View>
														))}
														
														{/* Load More Button */}
														{hasMoreLogs && (
															<View style={styles.loadMoreContainer}>
																<TouchableOpacity 
																	onPress={loadMoreLogs}
																	disabled={isLoadingMore}
																	style={[styles.loadMoreButton, isLoadingMore && styles.loadMoreButtonDisabled]}
																>
																	{isLoadingMore ? (
																		<>
																			<Chase size={16} color={theme.colors.primary} />
																			<Text style={styles.loadMoreText}>Loading more logs...</Text>
																		</>
																	) : (
																		<Text style={styles.loadMoreText}>Load More Logs</Text>
																	)}
																</TouchableOpacity>
															</View>
														)}
													</>
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
		color: theme.colors.primary,
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
		backgroundColor: theme.colors.primary + '20',
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
		backgroundColor: theme.colors.primary,
	},
	messageBubbleWylo: {
		backgroundColor: theme.colors.primary + '10',
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
	dateGroup: {
		marginBottom: 24,
	},
	dateHeader: {
		fontSize: 16,
		fontWeight: 'bold',
		color: theme.colors.primary,
		marginBottom: 16,
		textAlign: 'center',
		fontFamily: 'PlusJakartaSans_600SemiBold',
	},
	loadMoreContainer: {
		padding: 20,
		alignItems: 'center',
	},
	loadMoreButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: theme.colors.primary,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
		gap: 8,
	},
	loadMoreButtonDisabled: {
		backgroundColor: '#ccc',
	},
	loadMoreText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
});
