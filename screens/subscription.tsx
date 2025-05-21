import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ImageBackground, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native'

import { Button } from '@components/ui/button'

import ApplePayIcon from 'assets/icons/apple-pay-logo.svg'
import CheckmarkIcon from 'assets/icons/checkmark.svg'
import ChevronLeftIcon from 'assets/icons/chevron-left.svg'
import VisaIcon from 'assets/icons/visa.svg'

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
				className="flex flex-col px-5 web:mx-auto md:web:w-1/3"
				showsHorizontalScrollIndicator={false}>
				<View className="flex w-full flex-row items-center justify-between bg-white py-5">
					<Pressable onPress={() => router.dismiss()}>
						<ChevronLeftIcon />
					</Pressable>
					<Text className="text-center text-black" style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, letterSpacing: 0.2 }}>Subscription Management</Text>
					<Text />
				</View>
				<Text className="mt-[26px] font-medium text-black" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Choose your plan</Text>
				<View className="mt-4 flex flex-col gap-4">
					{selectedSubscription === 0 ? (
						<ImageBackground
							source={require('assets/images/subscription-background.png')}
							resizeMode="cover"
							className="overflow-hidden rounded-[32px]">
							<LinearGradient
								colors={['#AE9FFF', 'rgba(174, 159, 255, 0.40)']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={{
									borderRadius: 32,
									paddingHorizontal: 16,
									paddingVertical: 20
								}}>
								<View>
									<View className="flex flex-row items-center justify-between">
										<Text className="text-black" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Freemium</Text>
										<View className="size-8 rounded-full border-4 border-white bg-[#AE9FFF]"></View>
									</View>
									<View className="mt-5 flex flex-col gap-3.5 rounded-[32px] bg-white px-4 py-[17px]">
										<View className="flex flex-row items-center gap-[11px]">
											<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
												<CheckmarkIcon />
											</View>
											<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>1 Preloaded Character</Text>
										</View>
										<View className="flex flex-row items-center gap-[11px]">
											<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
												<CheckmarkIcon />
											</View>
											<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>1 Pre-installed voice</Text>
										</View>
									</View>
									<View className="mt-3 flex flex-row justify-end web:mt-4">
										<Button onPress={() => setSelectedSubscription(2)} className="rounded-3xl !py-0">
											<Text className="text-sm text-white" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Upgrade to pro</Text>
										</Button>
									</View>
								</View>
							</LinearGradient>
						</ImageBackground>
					) : (
						<Pressable
							onPress={() => setSelectedSubscription(0)}
							className="rounded-[32px] border border-[#D7DDE4] px-4 py-5">
							<View className="flex flex-row items-center justify-between">
								<Text className="font-bold text-black" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Freemium</Text>
								<View className="flex size-8 items-center justify-center rounded-full border-4 border-[#E6E6E6]">
									<View className="size-4 rounded-full bg-[#C5C5C5]"></View>
								</View>
							</View>
							<View className="mt-5 flex flex-col gap-3.5">
								<View className="flex flex-row items-center gap-[11px]">
									<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
										<CheckmarkIcon />
									</View>
									<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>1 Preloaded Character</Text>
								</View>
								<View className="flex flex-row items-center gap-[11px]">
									<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
										<CheckmarkIcon />
									</View>
									<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>1 Pre-installed voice</Text>
								</View>
							</View>
							<View className="native:-mt-4 flex flex-row justify-end web:-mt-1">
								<Button onPress={() => setSelectedSubscription(2)} className="rounded-3xl !py-0">
									<Text className="text-sm text-white" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Upgrade to pro</Text>
								</Button>
							</View>
						</Pressable>
					)}

					{selectedSubscription === 1 ? (
						<ImageBackground
							source={require('assets/images/subscription-background.png')}
							resizeMode="cover"
							className="overflow-hidden rounded-[32px]">
							<LinearGradient
								colors={['#AE9FFF', 'rgba(174, 159, 255, 0.40)']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={{
									borderRadius: 32,
									paddingHorizontal: 16,
									paddingVertical: 20
								}}>
								<View>
									<View className="flex flex-row items-center justify-between">
										<Text className="text-black" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Standard</Text>
										<View className="size-8 rounded-full border-4 border-white bg-[#AE9FFF]"></View>
									</View>
									<View className="mt-3">
										<Text className="font-bold text-black" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
											$10.00 <Text className="text-sm font-normal" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>/month</Text>
										</Text>
									</View>
									<View className="mt-5 flex flex-col gap-3.5 rounded-[32px] bg-white px-4 py-[17px]">
										<View className="flex flex-row items-center gap-[11px]">
											<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
												<CheckmarkIcon />
											</View>
											<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>
												Choose any 3 Characters from Library.
											</Text>
										</View>
										<View className="flex flex-row items-center gap-[11px]">
											<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
												<CheckmarkIcon />
											</View>
											<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>2 Voice Selections.</Text>
										</View>
										<View className="flex flex-row items-center gap-[11px]">
											<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
												<CheckmarkIcon />
											</View>
											<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>
												1 Summary Report Monthly.
											</Text>
										</View>
									</View>
									<View className="mt-3 flex flex-row justify-end web:mt-4">
										<Button onPress={() => setSelectedSubscription(2)} className="rounded-3xl !py-0">
											<Text className="text-sm text-white" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Upgrade to pro</Text>
										</Button>
									</View>
								</View>
							</LinearGradient>
						</ImageBackground>
					) : (
						<Pressable
							onPress={() => setSelectedSubscription(1)}
							className="rounded-[32px] border border-[#D7DDE4] px-4 py-5">
							<View className="flex flex-row items-center justify-between">
								<Text className="font-bold text-black" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Standard</Text>
								<View className="flex size-8 items-center justify-center rounded-full border-4 border-[#E6E6E6]">
									<View className="size-4 rounded-full bg-[#C5C5C5]"></View>
								</View>
							</View>
							<View className="mt-3">
								<Text className="font-bold text-black" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
									$10.00 <Text className="text-sm font-normal" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>/month</Text>
								</Text>
							</View>
							<View className="mt-5 flex flex-col gap-3.5">
								<View className="flex flex-row items-center gap-[11px]">
									<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
										<CheckmarkIcon />
									</View>
									<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>
										Choose any 3 Characters from Library.
									</Text>
								</View>
								<View className="flex flex-row items-center gap-[11px]">
									<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
										<CheckmarkIcon />
									</View>
									<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>2 Voice Selections.</Text>
								</View>
								<View className="flex flex-row items-center gap-[11px]">
									<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
										<CheckmarkIcon />
									</View>
									<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>1 Summary Report Monthly.</Text>
								</View>
							</View>
							<View className="mt-1 flex flex-row justify-end">
								<Button onPress={() => setSelectedSubscription(2)} className="rounded-3xl !py-0">
									<Text className="text-sm text-white" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Upgrade to pro</Text>
								</Button>
							</View>
						</Pressable>
					)}

					{selectedSubscription === 2 ? (
						<ImageBackground
							source={require('assets/images/subscription-background.png')}
							resizeMode="cover"
							className="overflow-hidden rounded-[32px]">
							<LinearGradient
								colors={['#AE9FFF', 'rgba(174, 159, 255, 0.40)']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={{
									borderRadius: 32,
									paddingHorizontal: 16,
									paddingVertical: 20
								}}>
								<View>
									<View className="flex flex-row items-center justify-between">
										<Text className="text-black" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Pro</Text>
										<View className="size-8 rounded-full border-4 border-white bg-[#AE9FFF]"></View>
									</View>
									<View className="mt-3">
										<Text className="font-bold text-black" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
											$15.00 <Text className="text-sm font-normal" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>/month</Text>
										</Text>
									</View>
									<View className="mt-5 flex flex-col gap-3.5 rounded-[32px] bg-white px-4 py-[17px]">
										<View className="flex flex-row items-center gap-[11px]">
											<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
												<CheckmarkIcon />
											</View>
											<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>Use Custom Characters.</Text>
										</View>
										<View className="flex flex-row items-center gap-[11px]">
											<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
												<CheckmarkIcon />
											</View>
											<Text className="flex-shrink text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>
												10 Voice Selections + 2 Custom Voice Records.
											</Text>
										</View>
										<View className="flex flex-row items-center gap-[11px]">
											<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
												<CheckmarkIcon />
											</View>
											<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>Daily Summary Reports.</Text>
										</View>
										<View className="flex flex-row items-center gap-[11px]">
											<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
												<CheckmarkIcon />
											</View>
											<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>
												Daily Conversation History.
											</Text>
										</View>
										<View className="flex flex-row items-center gap-[11px]">
											<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
												<CheckmarkIcon />
											</View>
											<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>Interaction Analysis.</Text>
										</View>
									</View>
								</View>
							</LinearGradient>
						</ImageBackground>
					) : (
						<Pressable
							onPress={() => setSelectedSubscription(2)}
							className="rounded-[32px] border border-[#D7DDE4] px-4 py-5">
							<View className="flex flex-row items-center justify-between">
								<Text className="font-bold text-black" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Pro</Text>
								<View className="flex size-8 items-center justify-center rounded-full border-4 border-[#E6E6E6]">
									<View className="size-4 rounded-full bg-[#C5C5C5]"></View>
								</View>
							</View>
							<View className="mt-3">
								<Text className="font-bold text-black" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
									$15.00 <Text className="text-sm font-normal" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>/month</Text>
								</Text>
							</View>
							<View className="mt-5 flex flex-col gap-3.5">
								<View className="flex flex-row items-center gap-[11px]">
									<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
										<CheckmarkIcon />
									</View>
									<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>Use Custom Characters.</Text>
								</View>
								<View className="flex flex-row items-center gap-[11px]">
									<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
										<CheckmarkIcon />
									</View>
									<Text className="flex-shrink text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>
										10 Voice Selections + 2 Custom Voice Records.
									</Text>
								</View>
								<View className="flex flex-row items-center gap-[11px]">
									<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
										<CheckmarkIcon />
									</View>
									<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>Daily Summary Reports.</Text>
								</View>
								<View className="flex flex-row items-center gap-[11px]">
									<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
										<CheckmarkIcon />
									</View>
									<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>
										Daily Conversation History.
									</Text>
								</View>
								<View className="flex flex-row items-center gap-[11px]">
									<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
										<CheckmarkIcon />
									</View>
									<Text className="text-sm font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>Interaction Analysis.</Text>
								</View>
							</View>
						</Pressable>
					)}
				</View>

				<View className="mt-[17px] flex flex-row items-center justify-between">
					<Text className="font-semibold text-muted-foreground" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Payment Method</Text>
					<Button variant="ghost" className="!px-0">
						<Text className="text-xs font-semibold text-[#0E2C76]" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Add Card</Text>
					</Button>
				</View>
				<View className="mt-3.5 flex flex-col gap-4">
					<Button
						onPress={() => setSelectedCard('BCA ***239')}
						variant="ghost"
						className="flex flex-row items-center justify-between !p-0 !px-0">
						<View className="flex flex-row items-center gap-2">
							<View className="rounded-lg bg-[#AE9FFF29] px-4 py-2">
								<VisaIcon />
							</View>
							<View className="flex flex-col">
								<Text className="font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>BCA ***239</Text>
								<Text className="text-xs font-medium text-[#C5C5C5]" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>Expires 12/2027</Text>
							</View>
						</View>
						<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
							{selectedCard === 'BCA ***239' ? (
								<CheckmarkIcon />
							) : (
								<View className="size-6 shrink-0 rounded-full bg-[#E6E6E6]" />
							)}
						</View>
					</Button>
					<Button
						onPress={() => setSelectedCard('TSZ ***567')}
						variant="ghost"
						className="flex flex-row items-center justify-between !p-0 !px-0">
						<View className="flex flex-row items-center gap-2">
							<View className="rounded-lg bg-[#AE9FFF29] px-4 py-2">
								<ApplePayIcon />
							</View>
							<View className="flex flex-col">
								<Text className="font-semibold text-black" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>TSZ ***567</Text>
								<Text className="text-xs font-medium text-[#C5C5C5]" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>Expires 12/2027</Text>
							</View>
						</View>
						<View className="flex size-6 items-center justify-center rounded-full bg-[#0E2C76]">
							{selectedCard === 'TSZ ***567' ? (
								<CheckmarkIcon />
							) : (
								<View className="size-6 shrink-0 rounded-full bg-[#E6E6E6]" />
							)}
						</View>
					</Button>
					<Button
						style={{ boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)' }}
						className="mx-auto mb-10 mt-8 w-10/12">
						<Text className="text-white" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>Checkout</Text>
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}
