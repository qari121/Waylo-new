import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import { Link, useRouter } from 'expo-router'
import React from 'react'
import { Image, Platform, Pressable, SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native'

import { logout } from '../slices/auth'
import { useAppDispatch } from '../hooks'

import CharacterIcon from '../assets/icons/character.svg'
import HelpCircleIcon from '../assets/icons/help-circle.svg'
import LogoutIcon from '../assets/icons/log-out.svg'
import ProfileIcon from '../assets/icons/profile.svg'
import SubscriptionsIcon from '../assets/icons/subscriptions.svg'
import WifiIcon from '../assets/icons/wifi.svg'

interface ProfileItem {
	name: string
	icon: React.ElementType
	href: string
}

const profileItems: ProfileItem[] = [
	{ name: 'Profile', icon: ProfileIcon, href: '/profile' },
	{ name: 'Character Management', icon: CharacterIcon, href: '/character-management' },
	{ name: 'Device Pairing', icon: WifiIcon, href: '/qr-code' },
	{ name: 'Subscription', icon: SubscriptionsIcon, href: '/subscription' },
	{ name: 'Support', icon: HelpCircleIcon, href: '/support' }
]

export const ProfileScreen = () => {
	const router = useRouter()
	const dispatch = useAppDispatch()
	const [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
	})

	if (!fontsLoaded) {
		return null
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.header}>
					<View style={styles.headerContent}>
						<View style={styles.profileInfo}>
							<View style={styles.avatarContainer}>
								<Image
									source={require('../assets/images/avatar.png')}
									style={styles.avatar}
									resizeMode="cover"
								/>
								<View style={styles.statusIndicator} />
							</View>
							<View style={styles.userInfo}>
								<Text style={[styles.userName, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
									James
								</Text>
								<Text style={[styles.userEmail, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
									James@untitledui.com
								</Text>
							</View>
						</View>
					</View>
				</View>

				<ScrollView
					showsVerticalScrollIndicator={false}
					scrollEnabled
					style={styles.scrollView}
					showsHorizontalScrollIndicator={false}>
					<View style={styles.content}>
						<View style={styles.divider} />

						<View style={styles.menuContainer}>
							{profileItems.map((item: ProfileItem) => (
								<Link href={item.href} key={item.name} asChild>
									<Pressable style={styles.menuItem}>
										<View style={styles.menuItemContent}>
											<item.icon width={20} height={20} style={styles.menuIcon as any} />
											<Text style={[styles.menuText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
												{item.name}
											</Text>
										</View>
									</Pressable>
								</Link>
							))}

							<View style={styles.logoutContainer}>
								<Pressable
									onPress={() => dispatch(logout())}
									style={styles.menuItem}
								>
									<View style={styles.menuItemContent}>
										<LogoutIcon width={20} height={20} style={styles.menuIcon as any} />
										<Text style={[styles.menuText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
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

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: 'white',
	},
	container: {
		flex: 1,
		backgroundColor: 'white',
	},
	header: {
		width: '100%',
		backgroundColor: 'white',
		zIndex: 1,
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
	},
	headerContent: {
		marginTop: 16,
		paddingHorizontal: 20,
	},
	profileInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 12,
	},
	avatarContainer: {
		position: 'relative',
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
	},
	statusIndicator: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		width: 12,
		height: 12,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: 'white',
		backgroundColor: '#12B76A',
	},
	userInfo: {
		flexDirection: 'column',
	},
	userName: {
		fontSize: 16,
		color: '#101828',
	},
	userEmail: {
		fontSize: 14,
		color: '#475467',
	},
	scrollView: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
	},
	divider: {
		marginTop: 16,
		height: 1,
		width: '100%',
		backgroundColor: '#F2F4F7',
	},
	menuContainer: {
		marginTop: 16,
		flexDirection: 'column',
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
	},
	menuItemContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	menuIcon: {
		color: '#344054',
	},
	menuText: {
		fontSize: 16,
		color: '#344054',
	},
	logoutContainer: {
		marginTop: 8,
	},
})
