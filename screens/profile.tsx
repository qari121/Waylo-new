import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans'
import { useFonts } from 'expo-font'
import { Link } from 'expo-router'
import { Image, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native'

import { logout } from '../slices/auth'
import { useAppDispatch } from '../hooks'

import CharacterIcon from '../assets/icons/character.svg'
import HelpCircleIcon from '../assets/icons/help-circle.svg'
import LogoutIcon from '../assets/icons/log-out.svg'
import ProfileIcon from '../assets/icons/profile.svg'
import SubscriptionsIcon from '../assets/icons/subscriptions.svg'
import WifiIcon from '../assets/icons/wifi.svg'

export const ProfileScreen = () => {
	const profileItems = [
		{ name: 'Profile', icon: ProfileIcon, href: '/profile' },
		{ name: 'Character Management', icon: CharacterIcon, href: '/character-management' },
		{ name: 'Device Pairing', icon: WifiIcon, href: '/qr-code' },
		{ name: 'Subscription', icon: SubscriptionsIcon, href: '/subscription' },
		{ name: 'Support', icon: HelpCircleIcon, href: '/support' }
	]

	const dispatch = useAppDispatch()

	let [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold
	})

	if (!fontsLoaded) {
		return null
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
			<View className="flex-1 bg-white">
				<View
					style={{
						...Platform.select({
							ios: {
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.1,
								shadowRadius: 3,
							},
							android: {
								elevation: 4,
							},
						}),
						backgroundColor: 'white',
						zIndex: 1,
					}}
					className="w-full"
				>
					<View className="mt-4 px-5">
						<View className="flex flex-row items-center gap-3 py-3">
							<View className="relative">
								<Image
									source={require('../assets/images/avatar.png')}
									className="rounded-full"
									resizeMode="cover"
									style={{ width: 48, height: 48 }}
								/>
								<View className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-[#12B76A]" />
							</View>
							<View className="flex flex-col">
								<Text
									style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
									className="text-base text-[#101828]"
								>
									James
								</Text>
								<Text
									style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
									className="text-sm text-[#475467]"
								>
									James@untitledui.com
								</Text>
							</View>
						</View>
					</View>
				</View>

				<ScrollView
					showsVerticalScrollIndicator={false}
					scrollEnabled
					className="flex-1"
					showsHorizontalScrollIndicator={false}>
					<View className="flex-1 px-5">
						<View className="mt-4 h-[1px] w-full bg-[#F2F4F7]" />

						<View className="mt-4 flex flex-col">
							{profileItems.map((item) => (
								<Link href={item.href} key={item.name} asChild>
									<Pressable className="flex flex-row items-center py-4">
										<View className="flex flex-row items-center gap-4">
											<item.icon width={20} height={20} className="text-[#344054]" />
											<Text
												style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
												className="text-base text-[#344054]"
											>
												{item.name}
											</Text>
										</View>
									</Pressable>
								</Link>
							))}

							<View className="mt-2">
								<Pressable
									onPress={() => dispatch(logout())}
									className="flex flex-row items-center py-4"
								>
									<View className="flex flex-row items-center gap-4">
										<LogoutIcon width={20} height={20} className="text-[#344054]" />
										<Text
											style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
											className="text-base text-[#344054]"
										>
											Log out
										</Text>
									</View>
								</Pressable>
							</View>
						</View>
					</View>
				</ScrollView>
			</View>
		</SafeAreaView>
	)
}
