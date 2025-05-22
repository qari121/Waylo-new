import ChevronLeftIcon from '../assets/icons/chevron-left.svg';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { cn } from '../lib/utils';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, ImageSourcePropType, Pressable, ScrollView, Text, View } from 'react-native';
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
			<View className="flex-1 bg-white">
				<View className="flex-row items-center px-4 py-3 border-b border-gray-100">
					<Pressable
						onPress={() => router.dismiss()}
						className="p-2"
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<ChevronLeftIcon width={24} height={24} />
					</Pressable>
					<View className="flex-1 items-center">
						<Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-[20px] text-black">
							Notifications
						</Text>
					</View>
					<View className="w-10" />
				</View>

				<ScrollView
					className="flex-1"
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
					<View className="h-32" />
				</ScrollView>
			</View>
		</SafeAreaView>
	);
};

const NotificationCard = ({ image, title, description, createdAt, unread }: NotificationCardProps) => {
	return (
		<View
			className={cn(
				'flex-row px-4 py-3 min-h-[76px]',
				unread ? 'bg-[#F4F1FD]' : 'bg-white'
			)}
		>
			<View className="w-10 h-10 mr-3 flex items-start mt-2xw">
				<Image
					source={image}
					className="w-10 h-10 mt-1"
					resizeMode="contain"
				/>
			</View>

			<View className="flex-1">
				<Text style={{ fontFamily: 'PlusJakartaSans_500Medium' }} className="text-[15px] text-black mb-1">
					{title}
				</Text>
				<Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-[13px] text-gray-500 leading-5">
					{description}
				</Text>
			</View>

			<View className="ml-3 items-end">
				<Text style={{ fontFamily: 'PlusJakartaSans_400Regular' }} className="text-xs text-gray-400">
					{getTimeAgo(createdAt)}
				</Text>
			</View>
		</View>
	);
};
