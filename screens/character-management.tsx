/* eslint-disable react-native/no-color-literals */
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Dimensions, Image, Pressable, SafeAreaView, Text, View, StyleSheet, Platform, ScrollView } from 'react-native'
import Carousel, { Pagination } from 'react-native-snap-carousel'

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

	let [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_700Bold
	})

	const [activeIndex, setActiveIndex] = useState(1)
	const [characters, setCharacters] = useState<CarouselItem[]>([
		{ id: 'pro1', image: require('../assets/images/pro1.png'), label: 'Pro 1', type: 'default' },
		{ id: 'free', image: require('../assets/images/avatar.png'), label: 'Free', type: 'default' },
		{ id: 'pro2', image: require('../assets/images/pro2.png'), label: 'Pro 2', type: 'default' }
	])

	const handleCustomImage = async () => {
		try {
			const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

			if (!permissionResult.granted) {
				alert('Permission to access gallery is required!')
				return
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 1
			})

			if (!result.canceled) {
				const newCustomCharacter: CarouselItem = {
					id: `custom-${Date.now()}`,
					image: { uri: result.assets[0].uri },
					label: 'Custom',
					type: 'custom'
				}
				setCharacters(prev => [...prev, newCustomCharacter])
				setActiveIndex(characters.length) // Move to the new image
			}
		} catch (error) {
			console.error('Error picking image:', error)
			alert('Failed to pick image from gallery')
		}
	}

	const renderCarouselItem = ({ item }: { item: CarouselItem }) => {
		return (
			<View style={styles.carouselItemContainer}>
				<Image
					source={item.image}
					style={styles.carouselItemImage}
					resizeMode="contain"
				/>
			</View>
		)
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
									Free
								</Text>
							</View>

							<View style={styles.tierItem}>
								<View style={[styles.tierIconContainer, { elevation: 5 }]}>
									<Image
										source={require('../assets/images/pro-tier-icon-1.png')}
										resizeMode="contain"
										style={styles.tierIcon}
									/>
									<TierLockIcon style={styles.tierLockIcon} />
								</View>
								<Text style={[styles.tierText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
									Pro 1
								</Text>
							</View>

							<View style={styles.tierItem}>
								<View style={[styles.tierIconContainer, { elevation: 5 }]}>
									<Image
										source={require('../assets/images/pro-tier-icon-2.png')}
										resizeMode="contain"
										style={styles.tierIcon}
									/>
									<TierLockIcon style={styles.tierLockIcon} />
								</View>
								<Text style={[styles.tierText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
									Pro 2
								</Text>
							</View>
							<Pressable style={styles.customTierItem} onPress={handleCustomImage}>
								<View style={[styles.customTierIconContainer, { elevation: 5 }]}>
									<GalleryExportIcon />
									<Text style={[styles.customTierLabel, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
										Custom
									</Text>
								</View>
								<Text style={[styles.tierText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
									Custom
								</Text>
							</Pressable>
						</View>

						<View style={styles.buttonContainer}>
							<Pressable onPress={handleCustomImage} style={styles.upgradeButton}>
								<View style={[styles.upgradeButtonContent, { elevation: 5 }]}>
									<Text style={[styles.upgradeButtonText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
										Upgrade to Pro
									</Text>
								</View>
							</Pressable>
						</View>

						<View style={styles.upgradePromptContainer}>
							<Text style={[styles.upgradePromptText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
								Unlock all the Characters by upgrading to
								<Text style={[styles.upgradePromptHighlight, { fontFamily: 'PlusJakartaSans_700Bold' }]}> PRO </Text>
								version. Use Wylo with full potential
							</Text>
							<TripleArrowsIcon style={styles.upgradePromptIcon} />
						</View>
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
	customTierItem: {
		alignItems: 'center',
	},
	customTierIconContainer: {
		position: 'relative',
		width: 72,
		height: 72,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 3,
		overflow: 'hidden',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#CACACA',
		backgroundColor: 'white',
	},
	customTierLabel: {
		fontSize: 12,
		color: '#404040',
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
})
