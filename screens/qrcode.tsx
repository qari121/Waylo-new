import React from 'react';
/* eslint-disable react-native/no-color-literals */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@components/ui/button';
import { cn } from 'lib/utils';

import ChevronLeftIcon from 'assets/icons/chevron-left.svg';
import TripleArrowsIcon from 'assets/icons/triple-arrows.svg';
import UnionIcon from 'assets/icons/union.svg';

// Add Plus Jakarta Sans font imports
import {
	PlusJakartaSans_400Regular,
	PlusJakartaSans_500Medium,
	PlusJakartaSans_600SemiBold,
	PlusJakartaSans_700Bold
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';

export const QRCodeScreen = () => {
	const router = useRouter()

	const [scanned, setScanned] = useState(false)
	const [permission, requestPermission] = useCameraPermissions()

	const translateY = useSharedValue(30)

	// Load Plus Jakarta Sans fonts
	let [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold
	})
	if (!fontsLoaded) return null;

	useEffect(() => {
		requestPermission()
		translateY.value = withRepeat(withTiming(300, { duration: 2000 }), -1, true)
	}, [])

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: translateY.value }],
		backgroundColor: '#416EC8',
		height: 9,
		width: '100%',
		shadowColor: '#677287',
		shadowOpacity: 0.5,
		shadowRadius: 10,
		elevation: 10
	}))

	const handleBarCodeScanned = ({ data }: { data: string }) => {
		setScanned(true)
		alert(`QR Code Scanned: ${data}`)
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: '#535353' }}>
			<ScrollView
				horizontal={false}
				bounces={false}
				showsVerticalScrollIndicator
				stickyHeaderIndices={[0]}
				className="relative flex flex-1 flex-col bg-[#535353] px-5 web:mx-auto md:web:w-1/3"
				showsHorizontalScrollIndicator={false}>
				<Image
					source={require('assets/images/qrcode-background.png')}
					resizeMode="contain"
					className="absolute inset-0"
				/>
				<View className="relative z-20 flex w-full cursor-pointer flex-row items-center justify-between pt-6">
					<Pressable onPress={() => router.dismiss()}>
						<ChevronLeftIcon />
					</Pressable>
				</View>
				<Text className="mt-1.5 text-center text-2xl font-semibold text-white" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Connect device</Text>
				<View className="relative z-10 mb-20 mt-[21px] flex flex-col rounded-[16px] bg-[#F3F0FF]/60 px-5 pb-[70px] pt-5 md:web:mx-auto md:web:w-10/12">
					<View className="flex flex-row items-start justify-center gap-3 md:web:gap-6">
						<View className="flex flex-col items-center gap-0.5">
							<Button className="flex h-14 flex-row items-center gap-3 rounded-[32px] bg-[#6F54FF] px-5 py-4">
								<QRCodeIcon color="white" />
								<Text className="font-semibold text-white" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>Scan QR</Text>
							</Button>
							<Text className="text-sm font-semibold text-[#404040]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Step 1</Text>
						</View>
						<TripleArrowsIcon
							style={{ transform: [{ rotate: '90deg' }] }}
							className="mt-2 shrink-0 rotate-90"
						/>
						<View className="flex flex-col items-center gap-0.5">
							<Button className="flex h-14 flex-row items-center gap-3 rounded-[32px] bg-white px-5 py-4">
								<WiFiIcon color="#9B9B9B" />
								<Text className="font-semibold text-[#9B9B9B]" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>Wifi</Text>
							</Button>
							<Text className="text-sm font-semibold text-[#404040]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Step 2</Text>
						</View>
					</View>
					<View
						className={cn('relative mt-10 h-[341px] w-full overflow-hidden rounded', {
							'bg-[#383838]/60': !permission?.granted
						})}>
						{permission?.granted ? (
							<>
								<CameraView
									style={StyleSheet.absoluteFill}
									facing="back"
									onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
								/>
								<UnionIcon
									style={{
										position: 'absolute',
										left: 12,
										top: 12
									}}
									className="absolute left-3 top-3"
								/>
								<UnionIcon
									style={{
										position: 'absolute',
										right: 12,
										top: 12,
										transform: [{ rotate: '90deg' }]
									}}
									className="absolute right-3 top-3 rotate-90"
								/>
								<UnionIcon
									style={{
										position: 'absolute',
										bottom: 12,
										left: 12,
										transform: [{ rotate: '-90deg' }]
									}}
									className="absolute bottom-3 left-3 -rotate-90"
								/>
								<UnionIcon
									style={{
										position: 'absolute',
										bottom: 12,
										right: 12,
										transform: [{ rotate: '180deg' }]
									}}
									className="absolute bottom-3 right-3 rotate-180"
								/>
								<Animated.View style={animatedStyle} />
							</>
						) : (
							<View className="flex-1 items-center justify-center gap-3">
								<Text className="text-white" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>No access to camera</Text>
								<Button className="bg-[#6F54FF] px-2 py-1" onPress={requestPermission}>
									<Text className="text-sm text-white" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Grant Permission</Text>
								</Button>
							</View>
						)}
					</View>
					<View className="mt-[17px]">
						<Text className="text-2xl font-extrabold leading-8 text-[#404040]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Scan</Text>
						<Text className="text-2xl font-extrabold leading-8 text-[#404040]" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>QR code</Text>
						<Text className="mt-1.5 text-xs font-semibold text-[#404040]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
							Place an QR at the center of your camera
						</Text>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

export const QRCodeIcon = ({ width = 24, height = 24, color = 'currentColor' }) => {
	return (
		<Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
			<Path
				fillRule="evenodd"
				clipRule="evenodd"
				d="M8 21H4C3.44772 21 3 20.5523 3 20V16C3 15.4477 2.55228 15 2 15C1.44772 15 1 15.4477 1 16V20C1 21.6569 2.34315 23 4 23H8C8.55228 23 9 22.5523 9 22C9 21.4477 8.55228 21 8 21ZM22 15C21.4477 15 21 15.4477 21 16V20C21 20.5523 20.5523 21 20 21H16C15.4477 21 15 21.4477 15 22C15 22.5523 15.4477 23 16 23H20C21.6569 23 23 21.6569 23 20V16C23 15.4477 22.5523 15 22 15ZM20 1H16C15.4477 1 15 1.44772 15 2C15 2.55228 15.4477 3 16 3H20C20.5523 3 21 3.44772 21 4V8C21 8.55228 21.4477 9 22 9C22.5523 9 23 8.55228 23 8V4C23 2.34315 21.6569 1 20 1ZM2 9C2.55228 9 3 8.55228 3 8V4C3 3.44772 3.44772 3 4 3H8C8.55228 3 9 2.55228 9 2C9 1.44772 8.55228 1 8 1H4C2.34315 1 1 2.34315 1 4V8C1 8.55228 1.44772 9 2 9ZM10 5H6C5.44772 5 5 5.44772 5 6V10C5 10.5523 5.44772 11 6 11H10C10.5523 11 11 10.5523 11 10V6C11 5.44772 10.5523 5 10 5ZM9 9H7V7H9V9ZM14 11H18C18.5523 11 19 10.5523 19 10V6C19 5.44772 18.5523 5 18 5H14C13.4477 5 13 5.44772 13 6V10C13 10.5523 13.4477 11 14 11ZM15 7H17V9H15V7ZM10 13H6C5.44772 13 5 13.4477 5 14V18C5 18.5523 5.44772 19 6 19H10C10.5523 19 11 18.5523 11 18V14C11 13.4477 10.5523 13 10 13ZM9 17H7V15H9V17ZM14 16C14.5523 16 15 15.5523 15 15C15.5523 15 16 14.5523 16 14C16 13.4477 15.5523 13 15 13H14C13.4477 13 13 13.4477 13 14V15C13 15.5523 13.4477 16 14 16ZM18 13C17.4477 13 17 13.4477 17 14V17C16.4477 17 16 17.4477 16 18C16 18.5523 16.4477 19 17 19H18C18.5523 19 19 18.5523 19 18V14C19 13.4477 18.5523 13 18 13ZM14 17C13.4477 17 13 17.4477 13 18C13 18.5523 13.4477 19 14 19C14.5523 19 15 18.5523 15 18C15 17.4477 14.5523 17 14 17Z"
				fill={color}
			/>
		</Svg>
	)
}

export const WiFiIcon = ({ width = 24, height = 24, color = 'currentColor' }) => {
	return (
		<Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
			<Path
				d="M4.90991 11.84C9.20991 8.52001 14.7999 8.52001 19.0999 11.84"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M2 8.35998C8.06 3.67998 15.94 3.67998 22 8.35998"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M6.79004 15.49C9.94004 13.05 14.05 13.05 17.2 15.49"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M9.3999 19.15C10.9799 17.93 13.0299 17.93 14.6099 19.15"
				stroke={color}
				strokeWidth={1.5}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	)
}
