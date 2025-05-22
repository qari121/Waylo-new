/* eslint-disable react-native/no-color-literals */
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Dimensions, Image, Pressable, SafeAreaView, Text, View } from 'react-native'
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
			<View className="items-center justify-center">
				<Image
					source={item.image}
					style={{
						width: ITEM_WIDTH - (ITEM_HORIZONTAL_PADDING * -4),
						height: (ITEM_WIDTH - (ITEM_HORIZONTAL_PADDING * -6)) * 1.2,
						borderRadius: 12
					}}
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
			<View className="flex-1 bg-white">
				<View className="mt-2 flex w-full flex-row items-center justify-between bg-white px-5 py-5">
					<Pressable onPress={() => router.dismiss()}>
						<ChevronLeftIcon />
					</Pressable>
					<Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-center text-[20px] text-black">
						Character Management
					</Text>
					<View className="w-6" />
				</View>

				<View className="flex-1">
					<View className="h-[470px] justify-center">  {/* Increased height for better spacing */}
						<Carousel
							ref={carouselRef}
							data={characters}
							renderItem={renderCarouselItem}
							sliderWidth={SLIDER_WIDTH}
							itemWidth={ITEM_WIDTH}
							inactiveSlideScale={0.85}  // Adjusted scale for inactive slides
							inactiveSlideOpacity={0.5}  // Adjusted opacity for inactive slides
							firstItem={activeIndex}
							layout="default"
							onSnapToItem={setActiveIndex}
							enableSnap={true}
							loop={false}
							activeSlideAlignment="center"
							inactiveSlideShift={0}  // Removed shift to match design
							contentContainerCustomStyle={{
								alignItems: 'center',
								paddingVertical: 20  // Added padding for better spacing
							}}
						/>
						<Pagination
							dotsLength={characters.length}
							activeDotIndex={activeIndex}
							containerStyle={{
								paddingVertical: 0,
								marginTop: -20  // Adjusted spacing
							}}
							dotStyle={{
								width: 24,
								height: 4,
								borderRadius: 2,
								backgroundColor: '#AE9FFF',
								marginHorizontal: 2
							}}
							inactiveDotStyle={{
								width: 4,
								height: 4,
								borderRadius: 2,
								backgroundColor: '#AE9FFF'
							}}
							inactiveDotOpacity={0.3}
							inactiveDotScale={1}
							dotContainerStyle={{ marginHorizontal: 2 }}
						/>
					</View>

					<View className="mt-5 flex flex-row items-center justify-center gap-4 px-5 web:flex-wrap">
						<View className="items-center">
							<View
								style={{ elevation: 5 }}
								className="relative size-[72px] overflow-hidden rounded-xl border border-[#CACACA] bg-white">
								<Image
									source={require('../assets/images/free-tier-icon.png')}
									resizeMode="contain"
									className="absolute bottom-0 left-0 right-0 h-full w-full"
								/>
							</View>
							<Text style={{ fontFamily: 'PlusJakartaSans_500Medium' }} className="mt-2 text-sm text-[#404040]">
								Free
							</Text>
						</View>

						<View className="items-center">
							<View
								style={{ elevation: 5 }}
								className="relative flex size-[72px] items-center justify-center overflow-hidden rounded-xl border border-[#CACACA] bg-white">
								<Image
									source={require('../assets/images/pro-tier-icon-1.png')}
									resizeMode="contain"
									className="absolute bottom-0 left-0 right-0 h-full w-full"
								/>
								<TierLockIcon className="absolute" />
							</View>
							<Text style={{ fontFamily: 'PlusJakartaSans_500Medium' }} className="mt-2 text-sm text-[#404040]">
								Pro 1
							</Text>
						</View>

						<View className="items-center">
							<View
								style={{ elevation: 5 }}
								className="relative flex size-[72px] items-center justify-center overflow-hidden rounded-xl border border-[#CACACA] bg-white">
								<Image
									source={require('../assets/images/pro-tier-icon-2.png')}
									resizeMode="contain"
									className="absolute bottom-0 left-0 right-0 h-full w-full"
								/>
								<TierLockIcon className="absolute" />
							</View>
							<Text style={{ fontFamily: 'PlusJakartaSans_500Medium' }} className="mt-2 text-sm text-[#404040]">
								Pro 2
							</Text>
						</View>
						<Pressable className="items-center" onPress={handleCustomImage}>
							<View
								style={{ elevation: 5 }}
								className="relative flex size-[72px] items-center justify-center gap-[3px] overflow-hidden rounded-xl border border-[#CACACA] bg-white">
								<GalleryExportIcon />
								<Text style={{ fontFamily: 'PlusJakartaSans_500Medium' }} className="text-xs text-[#404040]">
									Custom
								</Text>
							</View>
							<Text style={{ fontFamily: 'PlusJakartaSans_500Medium' }} className="mt-2 text-sm text-[#404040]">
								Custom
							</Text>
						</Pressable>
					</View>

					<View className="mx-5 mb-5 mt-6 flex shrink-0 flex-row items-center justify-between rounded-lg border border-dashed border-[#AE9FFF] bg-[#AE9FFF1C] p-3 pr-4">
						<Text style={{ fontFamily: 'PlusJakartaSans_500Medium' }} className="text-sm text-[#7D65FC] max-md:w-10/12">
							Unlock all the Characters by upgrading to
							<Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }} className="text-sm text-black"> PRO </Text>
							version. Use Wylo with full potential
						</Text>
						<TripleArrowsIcon className="shrink-0" />
					</View>
				</View>
			</View>
		</SafeAreaView>
	)
}
