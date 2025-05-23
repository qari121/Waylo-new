import ChevronLeftIcon from '../assets/icons/chevron-left.svg';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { cn } from '../lib/utils';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, ImageSourcePropType, Pressable, ScrollView, Text, View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Fix the import path to use relative path
import { notificationListener, requestUserPermission, setupNotificationHandlers } from '../services/notifications';

interface NotificationCardProps {
	image: ImageSourcePropType;
	title: string;
	description: string;
	createdAt: Date;
	unread: boolean;
}

// Helper function to format the date
const getTimeAgo = (date: Date) => {
	const now = new Date();
	const diffTime = Math.abs(now.getTime() - date.getTime());
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return 'Today';
	if (diffDays === 1) return 'Yesterday';
	if (diffDays <= 30) return `${diffDays} days ago`;
	return date.toLocaleDateString();
};

// Example Notification Data (static for now)
const notifications = [
	{
		image: require('../assets/images/sleep.png'),
		title: "Thursday's Sleep Report",
		description: 'Anna had perfect sleep',
		createdAt: new Date('2025-04-28T08:30:00'),
		unread: true,
	},
	{
		image: require('../assets/images/book.png'),
		title: 'Anna Study Report',
		description: 'Learned new words related to science',
		createdAt: new Date('2025-04-26T14:15:00'),
		unread: false,
	},
	{
		image: require('../assets/images/speech.png'),
		title: 'Speech Interaction',
		description: 'Last chance to add a little extra to your Tuesday delivery.',
		createdAt: new Date('2025-04-25T19:45:00'),
		unread: true,
	},
	{
		image: require('../assets/images/tool.png'),
		title: 'Wylo Update',
		description: 'New additional features added for interactions.',
		createdAt: new Date('2025-04-24T11:50:00'),
		unread: false,
	},
	{
		image: require('../assets/images/profile.png'),
		title: 'Profile Features updated',
		description: 'New sound for interaction added by you',
		createdAt: new Date('2025-04-22T07:10:00'),
		unread: false,
	},
	{
		image: require('../assets/images/bonus.png'),
		title: 'Weekend Bonus!',
		description: 'Get 10% off on a surprise side for your next update.',
		createdAt: new Date('2025-04-18T10:30:00'),
		unread: false,
	},
];

export const NotificationScreen = () => {
	const router = useRouter();

	let [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_700Bold
	});

	useEffect(() => {
		// Set up notification handlers
		setupNotificationHandlers();

		// Request permissions and set up listeners
		requestUserPermission();
		const cleanup = notificationListener();

		// Clean up listeners on unmount
		return cleanup;
	}, []);

	if (!fontsLoaded) {
		return null; // Or a loading component
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
			<View style={styles.container}>
				<View style={styles.header}>
					<Pressable
						onPress={() => router.dismiss()}
						style={styles.backButton}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<ChevronLeftIcon width={24} height={24} />
					</Pressable>
					<View style={styles.headerTitleContainer}>
						<Text style={[styles.headerTitle, { fontFamily: 'PlusJakartaSans_700Bold' }]}>
							Notifications
						</Text>
					</View>
					<View style={styles.headerSpacer} />
				</View>

				<ScrollView
					style={styles.scrollView}
					showsVerticalScrollIndicator={false}
				>
					{notifications.map((notification, index) => (
						<NotificationCard
							key={index}
							image={notification.image}
							title={notification.title}
							description={notification.description}
							createdAt={notification.createdAt}
							unread={notification.unread}
						/>
					))}
					<View style={styles.bottomSpacer} />
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

const NotificationCard = ({ image, title, description, createdAt, unread }: NotificationCardProps) => {
	return (
		<View style={[styles.card, unread ? styles.cardUnread : styles.cardRead]}>
			<View style={styles.imageContainer}>
				<Image
					source={image}
					style={styles.image}
					resizeMode="contain"
				/>
			</View>

			<View style={styles.contentContainer}>
				<Text style={[styles.title, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
					{title}
				</Text>
				<Text style={[styles.description, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
					{description}
				</Text>
			</View>

			<View style={styles.timeContainer}>
				<Text style={[styles.timeText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
					{getTimeAgo(createdAt)}
				</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'white',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#F3F4F6',
	},
	backButton: {
		padding: 8,
	},
	headerTitleContainer: {
		flex: 1,
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 20,
		color: 'black',
	},
	headerSpacer: {
		width: 40,
	},
	scrollView: {
		flex: 1,
	},
	bottomSpacer: {
		height: 128,
	},
	card: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 12,
		minHeight: 76,
	},
	cardRead: {
		backgroundColor: 'white',
	},
	cardUnread: {
		backgroundColor: '#F4F1FD',
	},
	imageContainer: {
		width: 40,
		height: 40,
		marginRight: 12,
		alignItems: 'flex-start',
		marginTop: 2,
	},
	image: {
		width: 40,
		height: 40,
		marginTop: 1,
	},
	contentContainer: {
		flex: 1,
	},
	title: {
		fontSize: 15,
		color: 'black',
		marginBottom: 4,
	},
	description: {
		fontSize: 13,
		color: '#6B7280',
		lineHeight: 20,
	},
	timeContainer: {
		marginLeft: 12,
		alignItems: 'flex-end',
	},
	timeText: {
		fontSize: 12,
		color: '#9CA3AF',
	},
});
