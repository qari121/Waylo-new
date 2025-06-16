import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import { ImageBackground, Pressable, SafeAreaView, ScrollView, Text, View, Platform, StyleSheet, ActivityIndicator } from 'react-native'
import { useStripe } from '@stripe/stripe-react-native'
import { db } from '../firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { useAppSelector } from '../hooks'
import Toast from 'react-native-toast-message'

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

const firestorePlanToIndex: Record<string, number> = {
	Freemium: 0,
	Standard: 1,
	Premium: 2,
};
const indexToFirestorePlan = ['Freemium', 'Standard', 'Premium'];

const plans = [
	{
		name: 'Freemium',
		firestoreValue: 'Freemium',
		price: null,
		features: [
			'1 Preloaded Character',
			'1 Pre-installed voice',
			'Online Mode Only'
		]
	},
	{
		name: 'Standard',
		firestoreValue: 'Standard',
		price: '$10.00/month',
		features: [
			'Choose any 3 Characters from Library.',
			'2 Voice Selections.',
			'1 Summary Report Monthly.',
			'Online Mode Only'
		]
	},
	{
		name: 'Pro',
		firestoreValue: 'Premium',
		price: '$15.00/month',
		features: [
			'Use Custom Characters.',
			'10 Voice Selections + 2 Custom Voice Records.',
			'Daily Summary Reports.',
			'Daily Conversation History.',
			'Interaction Analysis.',
			'Online & Offline Modes'
		]
	}
];

// Helper to check MAC format: XX:XX:XX:XX:XX:XX, only hex and colons
const isValidMac = (input: string) => /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(input);

export const SubscriptionScreen = () => {
	const router = useRouter()
	const { initPaymentSheet, presentPaymentSheet } = useStripe()
	const [selectedSubscription, setSelectedSubscription] = useState(0)
	const [selectedCard, setSelectedCard] = useState('')
	const [loading, setLoading] = useState(false)
	const auth = useAppSelector(state => state.auth)
	const [currentPlanIndex, setCurrentPlanIndex] = useState<number | null>(null);
	const [hasScanned, setHasScanned] = useState(false);
	const [scannerVisible, setScannerVisible] = useState(false);
	const [error, setError] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Load Plus Jakarta Sans fonts
	let [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold
	})
	if (!fontsLoaded) return null;

	// Replace with your backend endpoint
	const fetchPaymentSheetParams = async () => {
		const response = await fetch(
			'https://us-central1-waylo-251e0.cloudfunctions.net/createPaymentIntent',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					// Optionally pass user/plan info here
				}),
			}
		);
		const { paymentIntent, ephemeralKey, customer } = await response.json();
		return {
			paymentIntent,
			ephemeralKey,
			customer,
		};
	};

	const openPaymentSheet = async () => {
		if (selectedSubscription === 0) {
			// Freemium: no payment, just update Firestore
			try {
				await updateDoc(doc(db, "users", auth.uid), {
					plan: 'Freemium'
				});
				setCurrentPlanIndex(0);
				Toast.show({
					type: 'success',
					text1: 'You are now on the Freemium plan.'
				});
			} catch (err) {
				Toast.show({
					type: 'error',
					text1: 'Failed to update your plan. Please contact support.'
				});
			}
			return;
		}
		setLoading(true);
		try {
			const { paymentIntent, ephemeralKey, customer } = await fetchPaymentSheetParams();

			const { error: initError } = await initPaymentSheet({
				customerId: customer,
				customerEphemeralKeySecret: ephemeralKey,
				paymentIntentClientSecret: paymentIntent,
				merchantDisplayName: 'Waylo',
			});

			if (initError) {
				Toast.show({ type: 'error', text1: initError.message });
				setLoading(false);
				return;
			}

			const { error: presentError } = await presentPaymentSheet();
			if (presentError) {
				Toast.show({ type: 'error', text1: presentError.message });
			} else {
				// Payment succeeded, update Firestore plan field
				const newPlan = indexToFirestorePlan[selectedSubscription];
				try {
					await updateDoc(doc(db, "users", auth.uid), {
						plan: newPlan
					});
					setCurrentPlanIndex(selectedSubscription);
					const planDisplayName = newPlan.charAt(0).toUpperCase() + newPlan.slice(1);
					Toast.show({ type: 'success', text1: `You are now on the ${planDisplayName} plan.` });
				} catch (err) {
					Toast.show({ type: 'error', text1: 'Payment succeeded, but failed to update your plan. Please contact support.' });
				}
			}
		} catch (err) {
			Toast.show({ type: 'error', text1: 'Failed to start payment flow.' });
		}
		setLoading(false);
	};

	useEffect(() => {
		// Fetch user's current plan from Firestore and set selectedSubscription
		const fetchUserPlan = async () => {
			try {
				const userDocRef = doc(db, 'users', auth.uid);
				const userDoc = await getDoc(userDocRef);
				if (userDoc.exists()) {
					const userData = userDoc.data();
					if (userData && userData.plan && firestorePlanToIndex[userData.plan] !== undefined) {
						setSelectedSubscription(firestorePlanToIndex[userData.plan]);
						setCurrentPlanIndex(firestorePlanToIndex[userData.plan]);
					}
				}
			} catch (err) {
				// Optionally handle error
			}
		};
		if (auth.uid) fetchUserPlan();
	}, [auth.uid]);

	const handleBarCodeScanned = async ({ data }: { data: string }) => {
		if (hasScanned) return; // Prevent multiple triggers
		let mac = data.trim().toUpperCase();
		if (/^[0-9A-F]{12}$/.test(mac)) {
			mac = mac.match(/.{1,2}/g)?.join(':') || mac;
		}
		if (isValidMac(mac)) {
			setHasScanned(true); // Set flag to prevent further scans
			setScannerVisible(false);
			setError('');
			setIsSubmitting(true);
			// ...save and alert...
		} else {
			setError('Scanned code is not a valid MAC address.');
		}
	};

	// When opening the scanner, reset the flag:
	const openScanner = () => {
		setHasScanned(false);
		setScannerVisible(true);
	};

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
					<Pressable onPress={() => router.back()} hitSlop={{top:20,bottom:20,left:20,right:20}} style={styles.backButton}>
						<ChevronLeftIcon />
					</Pressable>
					<Text pointerEvents="none" style={[styles.headerTitle, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Subscription Management</Text>
					<Text />
				</View>
				<Text style={[styles.planTitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Choose your plan</Text>
				<View style={styles.plansContainer}>
					{plans.map((plan, idx) => {
						const isSelected = selectedSubscription === idx;
						return (
							<Pressable
								key={plan.name}
								onPress={() => setSelectedSubscription(idx)}
								style={[
									styles.planCard,
									isSelected ? styles.selectedPlanCard : styles.unselectedPlanCard,
								]}
							>
								<View style={styles.planCardContent}>
									<View style={{ flex: 1 }}>
										<View style={styles.planHeader}>
											<Text style={[styles.planName, { fontFamily: 'PlusJakartaSans_700Bold' }]}>{plan.name}</Text>
											<View style={isSelected ? styles.radioSelected : styles.radioUnselected}>
												{isSelected && <View style={styles.radioDot} />}
											</View>
										</View>
										{plan.price && (
											<View style={styles.priceContainer}>
												<Text style={[styles.priceText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>{plan.price}</Text>
											</View>
										)}
										<View style={styles.featuresContainer}>
											{plan.features.map((feature, featureIdx) => (
												<View key={featureIdx} style={styles.featureItem}>
													<View style={styles.checkmarkContainer}>
														<CheckmarkIcon />
													</View>
													<Text style={[styles.featureText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>{feature}</Text>
												</View>
											))}
										</View>
									</View>
								</View>
							</Pressable>
						);
					})}
				</View>

				<View style={styles.paymentMethodContainer}>
					<Text style={[styles.paymentMethodTitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Payment Method</Text>
					<Button variant="ghost" style={styles.addCardButton}>
						<Text style={[styles.addCardText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Add Card</Text>
					</Button>
				</View>
				<View style={styles.cardsContainer}>
					<Button
						style={[styles.checkoutButton, { boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)' }]}
						onPress={openPaymentSheet}
						disabled={loading || currentPlanIndex === selectedSubscription}
					>
						<Text style={[styles.checkoutButtonText, { fontSize: 18, fontWeight: 'bold'}]}> 
							{currentPlanIndex === selectedSubscription ? 'Subscribed' : 'Subscribe'}
						</Text>
					</Button>
				</View>
				{loading && <ActivityIndicator style={{ marginTop: 20 }} />}
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
		marginTop: -33,
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
		borderRadius: 24,
		marginBottom: 18,
		padding: 0,
		overflow: 'hidden',
	},
	selectedPlanCard: {
		backgroundColor: 'white',
		borderWidth: 2,
		borderColor: '#AE9FFF',
		shadowColor: '#AE9FFF',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 12,
		elevation: 4,
	},
	unselectedPlanCard: {
		backgroundColor: 'white',
		borderWidth: 1,
		borderColor: '#E6E6E6',
	},
	planCardContent: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		padding: 24,
		paddingRight: 16,
	},
	planHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	planName: {
		color: 'black',
		fontSize: 18,
	},
	radioSelected: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 3,
		borderColor: '#AE9FFF',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'white',
	},
	radioUnselected: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 2,
		borderColor: '#E6E6E6',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'white',
	},
	radioDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: '#AE9FFF',
	},
	priceContainer: {
		marginTop: 12,
	},
	priceText: {
		fontWeight: 'bold',
		color: 'black',
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
	checkoutButton: {
		marginHorizontal: 'auto',
		marginBottom: 20,
		marginTop: 40,
		backgroundColor: '#AE9FFF',
		width: '83.333333%',
	},
	checkoutButtonText: {
		color: 'white',
	},
	backButton: {
		padding: 10,
	},
})
