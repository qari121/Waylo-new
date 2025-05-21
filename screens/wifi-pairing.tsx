import { useRouter } from 'expo-router'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'

import { Button } from '@components/ui/button'
import { QRCodeIcon, WiFiIcon } from './qrcode'

import ChevronLeftIcon from '@assets/icons/chevron-left.svg'
import TripleArrowsIcon from '@assets/icons/triple-arrows.svg'

export const WifiPairingScreen = () => {
	const router = useRouter()
	return (
		<ScrollView
			horizontal={false}
			bounces={false}
			showsVerticalScrollIndicator
			stickyHeaderIndices={[0]}
			className="relative flex flex-1 flex-col px-5 web:mx-auto md:web:w-1/3"
			showsHorizontalScrollIndicator={false}>
			<View className="flex w-full flex-row items-center justify-between pt-6">
				<Pressable onPress={() => router.dismiss()}>
					<ChevronLeftIcon />
				</Pressable>
			</View>
			<Text className="mt-1.5 text-center text-2xl font-semibold text-black">Connect device</Text>
			<View className="relative z-10 mb-20 mt-[21px] flex flex-col rounded-[16px] bg-[#EAE6FF] px-5 pb-[70px] pt-5 md:web:mx-auto md:web:w-10/12">
				<View className="flex flex-row items-start justify-center gap-3 md:web:gap-6">
					<View className="flex flex-col items-center gap-0.5">
						<Button className="flex h-14 flex-row items-center gap-3 rounded-[32px] bg-white px-5 py-4">
							<QRCodeIcon color="#B0AEAE" />
							<Text className="font-semibold text-[#B0AEAE]">Scan QR</Text>
						</Button>
						<Text className="text-sm font-semibold text-[#404040]">Step 1</Text>
					</View>
					<TripleArrowsIcon
						style={{ transform: [{ rotate: '90deg' }] }}
						className="mt-2 shrink-0 rotate-90"
					/>
					<View className="flex flex-col items-center gap-0.5">
						<Button className="flex h-14 flex-row items-center gap-3 rounded-[32px] bg-primary px-5 py-4">
							<WiFiIcon color="white" />
							<Text className="font-semibold text-white">Wifi</Text>
						</Button>
						<Text className="text-sm font-semibold text-[#404040]">Step 2</Text>
					</View>
				</View>
				<View className="my-10 flex items-center">
					<Image source={require('@assets/images/wifi.png')} resizeMode="contain" />
				</View>
				<View className="flex0col flex">
					<Text className="text-2xl font-extrabold leading-8 text-[#404040]">Connect</Text>
					<Text className="text-2xl font-extrabold leading-8 text-[#404040]">to Wifi</Text>
					<Text className="mt-1.5 text-xs font-semibold text-[#515151]">
						Go to settings and connect to wifi network and add correct password
					</Text>
				</View>
			</View>
		</ScrollView>
	)
}
