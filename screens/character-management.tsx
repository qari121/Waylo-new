/* eslint-disable react-native/no-color-literals */
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import React, { useRef, useState, useEffect } from 'react'
import { Dimensions, Image, Pressable, SafeAreaView, Text, View, StyleSheet, Platform, ScrollView } from 'react-native'
import Carousel, { Pagination } from 'react-native-snap-carousel'
import { useAppSelector } from '../hooks'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureMacAddress } from '../utils/ensureMacAddress';

import ChevronLeftIcon from '../assets/icons/chevron-left.svg'
import GalleryExportIcon from '../assets/icons/gallery-export.svg'
import TierLockIcon from '../assets/icons/tier-lock.svg'
import TripleArrowsIcon from '../assets/icons/triple-arrows.svg'

const { width: screenWidth } = Dimensions.get('window')
const ITEM_WIDTH = screenWidth * 0.4
const ITEM_HORIZONTAL_PADDING = 14
const SLIDER_WIDTH = screenWidth

interface CarouselItem {
	id: string
	image: any
	label: string
	type: 'default' | 'custom'
}

export const CharacterManagementScreen = () => {
	const router = useRouter()
	const carouselRef = useRef<Carousel<CarouselItem>>(null)
	const auth = useAppSelector(state => state.auth)
	let maxCharacters = 1
	if (auth.plan === "standard") maxCharacters = 3
	if (auth.plan === "pro") maxCharacters = 10

	let [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_700Bold
	})

	const [toyId, setToyId] = useState<string | null>(null)

	const [activeIndex, setActiveIndex] = useState(1)
	const [characters, setCharacters] = useState<CarouselItem[]>([
		{ id: 'Bear', image: require('../assets/images/avatar.png'), label: 'Bear', type: 'default' },
		{ id: 'Fluffy', image: require('../assets/images/pro1.png'), label: 'Fluffy', type: 'default' },
		{ id: 'Robot', image: require('../assets/images/pro2.png'), label: 'Robot', type: 'default' }
	])

	const canAddCharacter = characters.length < maxCharacters

	const [loading, setLoading] = useState(false);

	const handleSelectCharacter = async () => {
		if (!ensureMacAddress(toyId)) return;
		setLoading(true);
		try {
			if (!toyId) return;
			// Query for the toy document with this MAC address
			const toyQuery = query(collection(db, 'toy'), where('mac_address', '==', toyId));
			const querySnapshot = await getDocs(toyQuery);
			if (querySnapshot.empty) {
				Toast.show({
					type: 'error',
					text1: 'No toy found for this MAC address.',
					text2: 'Make sure your Waylo is ON and connected to the internet.'
				});
				setLoading(false);
				return;
			}
			// There should only be one, but loop just in case
			let alreadySelected = false;
			for (const docSnap of querySnapshot.docs) {
				const data = docSnap.data();
				if (data.character === characters[activeIndex].id) {
					alreadySelected = true;
				} else {
					await updateDoc(docSnap.ref, { character: characters[activeIndex].id });
					Toast.show({ type: 'success', text1: `Character changed to ${characters[activeIndex].label}.` });
				}
			}
			if (alreadySelected) {
				Toast.show({ type: 'info', text1: 'Character already selected.' });
			}
		} catch (e) {
			Toast.show({ type: 'error', text1: 'Failed to update character.' });
			console.error(e);
		}
		setLoading(false);
	};

	useEffect(() => {
		const fetchCurrentCharacter = async () => {
			try {
				if (!toyId) return;
				const toyQuery = query(collection(db, 'toy'), where('mac_address', '==', toyId));
				const querySnapshot = await getDocs(toyQuery);
				if (!querySnapshot.empty) {
					const docSnap = querySnapshot.docs[0];
					const data = docSnap.data();
					const idx = characters.findIndex(c => c.id === data.character);
					if (idx !== -1) setActiveIndex(idx);
				}
			} catch (e) {}
		};
		fetchCurrentCharacter();
	}, [toyId]);

	useEffect(() => {
		const fetchMac = async () => {
			const mac = await AsyncStorage.getItem('macAddress');
			setToyId(mac);
		};
		fetchMac();
	}, []);

	if (!toyId) {
		return <Text>Please pair your device and enter a MAC address first.</Text>;
	}

	const renderCarouselItem = ({ item, index }: { item: CarouselItem, index: number }) => {
		// Only freemium users see locks on characters beyond the first
		let isLocked = false;
		if (auth.plan === "freemium" && index > 0) isLocked = true;
		// For standard and pro, all unlocked (no lock overlays)

		return (
			<View style={styles.carouselItemContainer}>
				<Image
					source={item.image}
					style={styles.carouselItemImage}
					resizeMode="contain"
				/>
				{isLocked && (
					<View style={styles.lockOverlay}>
						<TierLockIcon />
					</View>
				)}
			</View>
		);
	}

	if (!fontsLoaded) {
		return null // Or a loading component
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
			<View style={{ flex: 1, backgroundColor: 'white' }}>
				<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: 'white' }}>
					<Pressable onPress={() => router.back()}>
						<ChevronLeftIcon />
					</Pressable>
					<Text style={[styles.headerTitle, { fontFamily: 'PlusJakartaSans_700Bold' }]}>
						Character Management
					</Text>
					<View />
				</View>

				<ScrollView
					horizontal={false}
					bounces={false}
					showsVerticalScrollIndicator
					style={styles.scrollView}
					showsHorizontalScrollIndicator={false}>
					<View style={{ flex: 1, paddingHorizontal: 20 }}>
						<View style={styles.carouselContainer}>
							<Carousel
								ref={carouselRef}
								data={characters}
								renderItem={renderCarouselItem}
								sliderWidth={SLIDER_WIDTH}
								itemWidth={ITEM_WIDTH}
								inactiveSlideScale={0.85}
								inactiveSlideOpacity={0.5}
								firstItem={activeIndex}
								layout="default"
								onSnapToItem={setActiveIndex}
								enableSnap={true}
								loop={false}
								activeSlideAlignment="center"
								inactiveSlideShift={0}
								contentContainerCustomStyle={{
									alignItems: 'center',
									paddingVertical: 20
								}}
							/>
							<Pagination
								dotsLength={characters.length}
								activeDotIndex={activeIndex}
								containerStyle={{
									paddingVertical: 0,
									marginTop: -20
								}}
								dotStyle={styles.paginationDot}
								inactiveDotStyle={styles.paginationDotInactive}
								inactiveDotOpacity={0.3}
								inactiveDotScale={1}
								dotContainerStyle={{ marginHorizontal: 2 }}
							/>
						</View>

						<View style={styles.tierContainer}>
							<View style={styles.tierItem}>
								<View style={[styles.tierIconContainer, { elevation: 5 }]}>
									<Image
										source={require('../assets/images/free-tier-icon.png')}
										resizeMode="contain"
										style={styles.tierIcon}
									/>
								</View>
								<Text style={[styles.tierText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
									Bear
								</Text>
							</View>

							<View style={styles.tierItem}>
								<View style={[styles.tierIconContainer, { elevation: 5 }]}>
									<Image
										source={require('../assets/images/pro-tier-icon-1.png')}
										resizeMode="contain"
										style={styles.tierIcon}
									/>
									{auth.plan === 'freemium' && <TierLockIcon style={styles.tierLockIcon} />}
								</View>
								<Text style={[styles.tierText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
									Fluffy
								</Text>
							</View>

							<View style={styles.tierItem}>
								<View style={[styles.tierIconContainer, { elevation: 5 }]}>
									<Image
										source={require('../assets/images/pro-tier-icon-2.png')}
										resizeMode="contain"
										style={styles.tierIcon}
									/>
									{auth.plan === 'freemium' && <TierLockIcon style={styles.tierLockIcon} />}
								</View>
								<Text style={[styles.tierText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
									Robot
								</Text>
							</View>
						</View>

						<View style={{ alignItems: 'center', marginTop: 24 }}>
							<Pressable
								onPress={handleSelectCharacter}
								disabled={loading || !toyId}
								style={{
									backgroundColor: '#7D65FC',
									borderRadius: 24,
									paddingVertical: 12,
									paddingHorizontal: 32,
									opacity: loading || !toyId ? 0.6 : 1,
								}}
							>
								<Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
									Select
								</Text>
							</Pressable>
						</View>

						<View style={{
							backgroundColor: '#7D65FC',
							borderRadius: 16,
							padding: 18,
							marginTop: 70,
							marginBottom: 12,
							alignItems: 'center',
							justifyContent: 'center',
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.12,
							shadowRadius: 4,
							elevation: 2,
						}}>
							<Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
								{`You can now enjoy ${maxCharacters} characters with ${maxCharacters} voices on the ${auth.plan.charAt(0).toUpperCase() + auth.plan.slice(1)} plan.`}
							</Text>
						</View>

						{auth.plan !== "pro" && (
							<View style={styles.upgradePromptContainer}>
								<Text style={[styles.upgradePromptText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
									Unlock all the Characters by upgrading to
									<Text style={[styles.upgradePromptHighlight, { fontFamily: 'PlusJakartaSans_700Bold' }]}> PRO </Text>
									version. Use Wylo with full potential
								</Text>
								<TripleArrowsIcon style={styles.upgradePromptIcon} />
							</View>
						)}
					</View>
				</ScrollView>
			</View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'white',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: 'white',
	},
	headerTitle: {
		fontSize: 18,
		color: 'black',
		textAlign: 'center',
	},
	scrollView: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
	},
	carouselContainer: {
		marginTop: 20,
	},
	paginationDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#0E2C76',
	},
	paginationDotInactive: {
		backgroundColor: '#D9D9D9',
	},
	tierContainer: {
		marginTop: 20,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16,
		paddingHorizontal: 20,
		...(Platform.OS === 'web' && {
			flexWrap: 'wrap',
		}),
	},
	tierItem: {
		alignItems: 'center',
	},
	tierIconContainer: {
		position: 'relative',
		width: 72,
		height: 72,
		overflow: 'hidden',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#CACACA',
		backgroundColor: 'white',
	},
	tierIcon: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		width: '100%',
		height: '100%',
	},
	tierLockIcon: {
		position: 'absolute',
	},
	tierText: {
		marginTop: 8,
		fontSize: 14,
		color: '#404040',
	},
	buttonContainer: {
		marginTop: 32,
		marginBottom: 20,
	},
	upgradeButton: {
		width: '100%',
	},
	upgradeButtonContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#0E2C76',
		borderRadius: 32,
		paddingVertical: 16,
	},
	upgradeButtonText: {
		color: 'white',
		fontSize: 16,
	},
	carouselItemContainer: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	carouselItemImage: {
		width: ITEM_WIDTH - (ITEM_HORIZONTAL_PADDING * -4),
		height: (ITEM_WIDTH - (ITEM_HORIZONTAL_PADDING * -6)) * 1.2,
		borderRadius: 12,
	},
	upgradePromptContainer: {
		marginHorizontal: 20,
		marginBottom: 20,
		marginTop: 24,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderRadius: 8,
		borderWidth: 1,
		borderStyle: 'dashed',
		borderColor: '#AE9FFF',
		backgroundColor: '#AE9FFF1C',
		padding: 12,
		paddingRight: 16,
	},
	upgradePromptText: {
		flex: 1,
		fontSize: 14,
		color: '#7D65FC',
		...(Platform.OS === 'web' && {
			maxWidth: '83.333333%',
		}),
	},
	upgradePromptHighlight: {
		fontSize: 14,
		color: 'black',
	},
	upgradePromptIcon: {
		flexShrink: 0,
	},
	lockOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
})
