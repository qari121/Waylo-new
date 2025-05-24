import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ImageBackground, Pressable, SafeAreaView, ScrollView, Text, View, Platform, StyleSheet } from 'react-native'

import { Button } from '../components/ui/button'

import ApplePayIcon from '../assets/icons/apple-pay-logo.svg'
import CheckmarkIcon from '../assets/icons/checkmark.svg'
import ChevronLeftIcon from '../assets/icons/chevron-left.svg'
import VisaIcon from '../assets/icons/visa.svg'

// Add Plus Jakarta Sans font imports
import {
	PlusJakartaSans_400Regular,
	PlusJakartaSans_500Medium,
	PlusJakartaSans_600SemiBold,
	PlusJakartaSans_700Bold
} from '@expo-google-fonts/plus-jakarta-sans'
import { useFonts } from 'expo-font'

export const SubscriptionScreen = () => {
	const router = useRouter()

	const [selectedSubscription, setSelectedSubscription] = useState(0)
	const [selectedCard, setSelectedCard] = useState('')

	// Load Plus Jakarta Sans fonts
	let [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold
	})
	if (!fontsLoaded) return null;

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
			<ScrollView
				horizontal={false}
				bounces={false}
				showsVerticalScrollIndicator
				stickyHeaderIndices={[0]}
				style={styles.scrollView}
				showsHorizontalScrollIndicator={false}>
				<View style={styles.header}>
					<Pressable onPress={() => router.dismiss()}>
						<ChevronLeftIcon />
					</Pressable>
					<Text style={[styles.headerTitle, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Subscription Management</Text>
					<Text />
				</View>
				<Text style={[styles.planTitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Choose your plan</Text>
				<View style={styles.plansContainer}>
					{selectedSubscription === 0 ? (
						<ImageBackground
							source={require('../assets/images/subscription-background.png')}
							resizeMode="cover"
							style={styles.planCard}>
							<LinearGradient
								colors={['#AE9FFF', 'rgba(174, 159, 255, 0.40)']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.gradient}>
								<View>
									<View style={styles.planHeader}>
										<Text style={[styles.planName, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Freemium</Text>
										<View style={styles.selectedIndicator} />
									</View>
									<View style={styles.featuresContainer}>
										<View style={styles.featureItem}>
											<View style={styles.checkmarkContainer}>
												<CheckmarkIcon />
											</View>
											<Text style={[styles.featureText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>1 Preloaded Character</Text>
										</View>
										<View style={styles.featureItem}>
											<View style={styles.checkmarkContainer}>
												<CheckmarkIcon />
											</View>
											<Text style={[styles.featureText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>1 Pre-installed voice</Text>
										</View>
									</View>
									<View style={styles.upgradeButtonContainer}>
										<Button onPress={() => setSelectedSubscription(2)} style={styles.upgradeButton}>
											<Text style={[styles.upgradeButtonText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Upgrade to pro</Text>
										</Button>
									</View>
								</View>
							</LinearGradient>
						</ImageBackground>
					) : selectedSubscription === 1 ? (
						<ImageBackground
							source={require('../assets/images/subscription-background.png')}
							resizeMode="cover"
							style={styles.planCard}>
							<LinearGradient
								colors={['#AE9FFF', 'rgba(174, 159, 255, 0.40)']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={styles.gradient}>
								<View>
									<View style={styles.planHeader}>
										<Text style={[styles.planName, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Standard</Text>
										<View style={styles.selectedIndicator} />
									</View>
									<View style={styles.priceContainer}>
										<Text style={[styles.priceText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
											$10.00 <Text style={[styles.pricePeriod, { fontFamily: 'PlusJakartaSans_400Regular' }]}>/month</Text>
										</Text>
									</View>
									<View style={styles.featuresContainer}>
										<View style={styles.featureItem}>
											<View style={styles.checkmarkContainer}>
												<CheckmarkIcon />
											</View>
											<Text style={[styles.featureText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>Choose any 3 Characters from Library.</Text>
										</View>
										<View style={styles.featureItem}>
											<View style={styles.checkmarkContainer}>
												<CheckmarkIcon />
											</View>
											<Text style={[styles.featureText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>2 Voice Selections.</Text>
										</View>
										<View style={styles.featureItem}>
											<View style={styles.checkmarkContainer}>
												<CheckmarkIcon />
											</View>
											<Text style={[styles.featureText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>1 Summary Report Monthly.</Text>
										</View>
									</View>
								</View>
							</LinearGradient>
						</ImageBackground>
					) : (
						<Pressable
							onPress={() => setSelectedSubscription(1)}
							style={styles.planCardInactive}>
							<View style={styles.planHeader}>
								<Text style={[styles.planName, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Standard</Text>
								<View style={styles.unselectedIndicator}>
									<View style={styles.unselectedDot} />
								</View>
							</View>
							<View style={styles.priceContainer}>
								<Text style={[styles.priceText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
									$10.00 <Text style={[styles.pricePeriod, { fontFamily: 'PlusJakartaSans_400Regular' }]}>/month</Text>
								</Text>
							</View>
							<View style={styles.featuresContainer}>
								<View style={styles.featureItem}>
									<View style={styles.checkmarkContainer}>
										<CheckmarkIcon />
									</View>
									<Text style={[styles.featureText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>Use Custom Characters.</Text>
								</View>
								<View style={styles.featureItem}>
									<View style={styles.checkmarkContainer}>
										<CheckmarkIcon />
									</View>
									<Text style={[styles.featureText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
										10 Voice Selections + 2 Custom Voice Records.
									</Text>
								</View>
								<View style={styles.featureItem}>
									<View style={styles.checkmarkContainer}>
										<CheckmarkIcon />
									</View>
									<Text style={[styles.featureText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>Daily Summary Reports.</Text>
								</View>
								<View style={styles.featureItem}>
									<View style={styles.checkmarkContainer}>
										<CheckmarkIcon />
									</View>
									<Text style={[styles.featureText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
										Daily Conversation History.
									</Text>
								</View>
							</View>
						</Pressable>
					)}
				</View>

				<View style={styles.paymentMethodContainer}>
					<Text style={[styles.paymentMethodTitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Payment Method</Text>
					<Button variant="ghost" style={styles.addCardButton}>
						<Text style={[styles.addCardText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Add Card</Text>
					</Button>
				</View>
				<View style={styles.cardsContainer}>
					<Button
						onPress={() => setSelectedCard('BCA ***239')}
						variant="ghost"
						style={styles.cardButton}>
						<View style={styles.cardContent}>
							<View style={styles.cardIconContainer}>
								<VisaIcon />
							</View>
							<View style={styles.cardInfo}>
								<Text style={[styles.cardNumber, { fontFamily: 'PlusJakartaSans_500Medium' }]}>BCA ***239</Text>
								<Text style={[styles.cardExpiry, { fontFamily: 'PlusJakartaSans_400Regular' }]}>Expires 12/2027</Text>
							</View>
						</View>
						<View style={styles.cardSelector}>
							{selectedCard === 'BCA ***239' ? (
								<CheckmarkIcon />
							) : (
								<View style={styles.unselectedCard} />
							)}
						</View>
					</Button>
					<Button
						onPress={() => setSelectedCard('TSZ ***567')}
						variant="ghost"
						style={styles.cardButton}>
						<View style={styles.cardContent}>
							<View style={styles.cardIconContainer}>
								<ApplePayIcon />
							</View>
							<View style={styles.cardInfo}>
								<Text style={[styles.cardNumber, { fontFamily: 'PlusJakartaSans_500Medium' }]}>TSZ ***567</Text>
								<Text style={[styles.cardExpiry, { fontFamily: 'PlusJakartaSans_400Regular' }]}>Expires 12/2027</Text>
							</View>
						</View>
						<View style={styles.cardSelector}>
							{selectedCard === 'TSZ ***567' ? (
								<CheckmarkIcon />
							) : (
								<View style={styles.unselectedCard} />
							)}
						</View>
					</Button>
					<Button
						style={[styles.checkoutButton, { boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)' }]}>
						<Text style={[styles.checkoutButtonText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Checkout</Text>
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
		flexDirection: 'column',
		paddingHorizontal: 20,
		...(Platform.OS === 'web' && {
			marginHorizontal: 'auto',
			width: '33.333333%',
		}),
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: 'white',
		paddingVertical: 10,
	},
	headerTitle: {
		textAlign: 'center',
		color: 'black',
		fontSize: 18,
		marginTop: -20,
		letterSpacing: 0.2,
	},
	planTitle: {
		marginTop: 26,
		fontWeight: '500',
		color: 'black',
	},
	plansContainer: {
		marginTop: 16,
		flexDirection: 'column',
		gap: 16,
	},
	planCard: {
		overflow: 'hidden',
		borderRadius: 32,
	},
	planCardInactive: {
		borderRadius: 32,
		borderWidth: 1,
		borderColor: '#D7DDE4',
		padding: 16,
	},
	gradient: {
		borderRadius: 32,
		paddingHorizontal: 16,
		paddingVertical: 20,
	},
	planHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	planName: {
		color: 'black',
	},
	selectedIndicator: {
		width: 32,
		height: 32,
		borderRadius: 16,
		borderWidth: 4,
		borderColor: 'white',
		backgroundColor: '#AE9FFF',
	},
	unselectedIndicator: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 16,
		borderWidth: 4,
		borderColor: '#E6E6E6',
	},
	unselectedDot: {
		width: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: '#C5C5C5',
	},
	priceContainer: {
		marginTop: 12,
	},
	priceText: {
		fontWeight: 'bold',
		color: 'black',
	},
	pricePeriod: {
		fontSize: 14,
		fontWeight: 'normal',
	},
	featuresContainer: {
		marginTop: 20,
		flexDirection: 'column',
		gap: 14,
		backgroundColor: 'white',
		borderRadius: 32,
		padding: 16,
	},
	featureItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 11,
	},
	checkmarkContainer: {
		width: 24,
		height: 24,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 12,
		backgroundColor: '#0E2C76',
	},
	featureText: {
		fontSize: 14,
		fontWeight: '600',
		color: 'black',
	},
	upgradeButtonContainer: {
		marginTop: 12,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		...(Platform.OS === 'web' && {
			marginTop: 16,
		}),
	},
	upgradeButton: {
		borderRadius: 24,
		paddingVertical: 0,
	},
	upgradeButtonText: {
		fontSize: 14,
		color: 'white',
	},
	paymentMethodContainer: {
		marginTop: 17,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	paymentMethodTitle: {
		fontWeight: '600',
		color: '#6B7280',
	},
	addCardButton: {
		paddingHorizontal: 0,
	},
	addCardText: {
		fontSize: 12,
		fontWeight: '600',
		color: '#0E2C76',
	},
	cardsContainer: {
		marginTop: 14,
		flexDirection: 'column',
		gap: 16,
	},
	cardButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 0,
		paddingHorizontal: 0,
	},
	cardContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	cardIconContainer: {
		borderRadius: 8,
		backgroundColor: '#AE9FFF29',
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	cardInfo: {
		flexDirection: 'column',
	},
	cardNumber: {
		fontWeight: '600',
		color: 'black',
	},
	cardExpiry: {
		fontSize: 12,
		fontWeight: '500',
		color: '#C5C5C5',
	},
	cardSelector: {
		width: 24,
		height: 24,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 12,
		backgroundColor: '#0E2C76',
	},
	unselectedCard: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: '#E6E6E6',
	},
	checkoutButton: {
		marginHorizontal: 'auto',
		marginBottom: 40,
		marginTop: 32,
		backgroundColor: '#AE9FFF',
		width: '83.333333%',
	},
	checkoutButtonText: {
		color: 'white',
	},
})
