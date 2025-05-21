/* eslint-disable react-native/no-color-literals */
import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Image, ImageBackground, Pressable, ScrollView, Text, View } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import Svg, { G, Path } from 'react-native-svg'

import {
	BottomSheetBackdrop,
	BottomSheetBackdropProps,
	BottomSheetModal,
	BottomSheetView
} from '@gorhom/bottom-sheet'

import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs'
import { cn } from 'lib/utils'
import { fetchInterestLogs } from '@slices/logs'
import { useAppDispatch, useAppSelector } from 'hooks'

import PlusIcon from 'assets/icons/add.svg'
import ArrowDownIcon from 'assets/icons/arrow-down.svg'
import ArrowUpIcon from 'assets/icons/arrow-up.svg'
import ChevronLeftIcon from 'assets/icons/chevron-left.svg'
import React from 'react'

interface FormValues {
	name: string
	age: number | null
	gender: string
	interests: string[]
	language: string
}

export const WyloRegistrationScreen = () => {
	const router = useRouter()
	const dispatch = useAppDispatch()
	const interestLogs = useAppSelector((state) => state.logs.interestLogs)

	const bottomSheetModalRef = useRef<BottomSheetModal>(null)
	const interestBottomSheetModalRef = useRef<BottomSheetModal>(null)
	const [selectedTab, setSelectedTab] = useState('info')
	const [isLoading, setIsLoading] = useState(false)
	const [formValues, setFormValues] = useState<FormValues>({
		name: '',
		age: null,
		gender: '',
		interests: [],
		language: 'German'
	})

	const handlePresentModalPress = useCallback(() => {
		bottomSheetModalRef.current?.present()
	}, [])

	const handlePresentInterestModalPress = useCallback(() => {
		interestBottomSheetModalRef.current?.present()
	}, [])

	const handleInterestSelection = async (value: string) => {
		setFormValues((prev) => ({
			...prev,
			interests: prev.interests.includes(value)
				? prev.interests.filter((interest) => interest !== value)
				: [...prev.interests, value]
		}))
		if (!formValues.interests.includes(value)) {
			setIsLoading(true)
			handlePresentInterestModalPress()
			await dispatch(fetchInterestLogs(value.toLowerCase()))
			setIsLoading(false)
		}
	}

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop {...props} disappearsOnIndex={-1} opacity={0.6} appearsOnIndex={0} />
		),
		[]
	)

	return (
		<ScrollView
			showsVerticalScrollIndicator
			scrollEnabled
			className="flex flex-1 flex-col web:mx-auto md:web:w-1/3"
			showsHorizontalScrollIndicator={false}>
			<BottomSheetModal
				enablePanDownToClose
				backdropComponent={renderBackdrop}
				snapPoints={['20%']}
				enableDynamicSizing={false}
				backgroundStyle={{
					backgroundColor: 'white',
					borderTopLeftRadius: 16,
					borderTopRightRadius: 16
				}}
				style={{
					elevation: 5,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 5 },
					shadowOpacity: 0.2,
					shadowRadius: 7
				}}
				ref={bottomSheetModalRef}>
				<BottomSheetView className="flex-1">
					<Text className="px-5 pt-3 font-semibold web:pb-24">
						You can&apos;t choose another language currently
					</Text>
				</BottomSheetView>
			</BottomSheetModal>

			<BottomSheetModal
				enablePanDownToClose
				backdropComponent={renderBackdrop}
				snapPoints={['25%']}
				enableDynamicSizing={false}
				backgroundStyle={{
					backgroundColor: 'white',
					borderTopLeftRadius: 16,
					borderTopRightRadius: 16
				}}
				style={{
					elevation: 5,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 5 },
					shadowOpacity: 0.2,
					shadowRadius: 7
				}}
				ref={interestBottomSheetModalRef}>
				<BottomSheetView className="flex-1">
					<View className="flex flex-col items-center justify-center gap-4 px-5 pt-3 web:h-28">
						{isLoading ? (
							<View className="flex flex-col items-center justify-center gap-2">
								<Chase size={24} color="#CBC0FE" />
								<Text className="text-primary">Loading Interest Log...</Text>
							</View>
						) : (
							<>
								<Text>
									User intensity rate is{' '}
									{interestLogs && interestLogs.length === 0
										? 'zero'
										: interestLogs?.[0]?.intensity > 0
											? 'positive'
											: 'negative'}
								</Text>
								<View
									className={cn('flex size-10 items-center justify-center rounded-full', {
										'bg-blue-500': interestLogs && interestLogs.length === 0,
										'bg-green-500': interestLogs?.[0]?.intensity > 0,
										'bg-red-500': interestLogs?.[0]?.intensity < 0
									})}>
									<Text className="font-semibold text-white">
										{interestLogs?.[0]?.intensity ?? 0}
									</Text>
								</View>
							</>
						)}
					</View>
				</BottomSheetView>
			</BottomSheetModal>

			<Image
				source={require('assets/images/registration-background.png')}
				resizeMode="stretch"
				className="absolute left-0 top-0 -z-10 flex-1 -translate-y-4 web:!h-[470px] web:!w-full web:-translate-y-36 web:!object-cover"
			/>
			<View className="flex w-full flex-row items-center justify-between px-5 pt-5">
				<Pressable onPress={() => router.dismiss()}>
					<ChevronLeftIcon />
				</Pressable>
				<Text className="text-center font-bold text-[#7F67FF]">Wylo Registration</Text>
				<Text />
			</View>
			<View className="flex flex-row items-center justify-center gap-1.5 px-5">
				<Image
					source={require('assets/images/avatar.png')}
					className="mt-5"
					style={{ width: 203, height: 272 }}
				/>
				<View className="mt-32 flex shrink flex-col">
					<Text className="text-sm text-black">Character Selected</Text>
					<Text className="mt-1 text-xl font-semibold text-[#0E2C76]">Friendly teddy bear</Text>
					<View className="mt-4 flex flex-row items-center">
						<Image
							source={require('assets/images/avatar.png')}
							className="z-30 rounded-full border border-white"
							style={{ width: 24, height: 24 }}
						/>
						<Image
							source={require('assets/images/avatar.png')}
							className="relative z-20 -ml-1.5 rounded-full border border-white"
							style={{ width: 24, height: 24 }}
						/>
						<Image
							source={require('assets/images/avatar.png')}
							className="relative z-10 -ml-1.5 rounded-full border border-white"
							style={{ width: 24, height: 24 }}
						/>
					</View>
				</View>
			</View>
			<View className="native:mt-10 mx-4 rounded-lg border border-[#F2F2F2] bg-white p-4 pt-0 web:mt-2">
				<View className="flex-1 justify-center">
					<Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
						<TabsList className="relative flex flex-row items-end justify-between border-b border-[#D9D9D9]">
							<TabsTrigger
								asChild
								value="info"
								className={cn('pb-0.5', {
									'border-b border-[#0E2C76] ': selectedTab === 'info'
								})}>
								<Text
									className={cn(
										'font-semibold hover:text-[#0E2C76]',
										selectedTab === 'info' ? 'text-[#0E2C76]' : 'text-[#B2B1B1]'
									)}>
									Personal Info.
								</Text>
							</TabsTrigger>
							<TabsTrigger
								asChild
								value="interests"
								className={cn('pb-0.5', {
									'border-b border-[#0E2C76] ': selectedTab === 'interests'
								})}>
								<Text
									className={cn(
										'font-semibold hover:text-[#0E2C76]',
										selectedTab === 'interests' ? 'text-[#0E2C76]' : 'text-[#B2B1B1]'
									)}>
									Interests
								</Text>
							</TabsTrigger>
							<TabsTrigger
								asChild
								value="language"
								className={cn('pb-0.5', {
									'border-b border-[#0E2C76] ': selectedTab === 'language'
								})}>
								<Text
									className={cn(
										'pb-0.5',
										'font-semibold hover:text-[#0E2C76]',
										selectedTab === 'language' ? 'text-[#0E2C76]' : 'text-[#B2B1B1]'
									)}>
									Language
								</Text>
							</TabsTrigger>
						</TabsList>
						<TabsContent value="info">
							<View className="mt-5 flex flex-col gap-9 web:mt-[29px]">
								<View className="flex flex-row items-center gap-5">
									<Label rootClassName="basis-[17%] text-sm text-black">Name:</Label>
									<Input
										value={formValues.name}
										style={{ elevation: 5, boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)' }}
										className="native:basis-[78%] basis-[80%] rounded border border-[#F2F2F2] bg-white"
										onChangeText={(text: string) =>
											setFormValues((prev) => ({ ...prev, name: text }))
										}
									/>
								</View>
								<View className="flex flex-row items-center gap-5">
									<Label rootClassName="basis-[17%] text-sm text-black">Age:</Label>
									<View
										style={{ elevation: 5, boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)' }}
										className="align-stretch flex h-12 w-[95px] flex-row items-center rounded bg-white">
										<Input
											value={formValues.age?.toString()}
											keyboardType="numeric"
											placeholder="Eg.24"
											onChangeText={(text: string) =>
												setFormValues((prev) => ({
													...prev,
													age: text === '' ? null : Number(text.replace(/[^0-9]/g, ''))
												}))
											}
											className="web:focus-visible:!shadow-0 !rounded-none border border-r-0 border-[#F2F2F2] bg-white px-3 !outline-none web:focus-visible:!ring-transparent"
										/>
										<View
											style={{ elevation: 5 }}
											className="flex flex-col justify-center gap-1 self-stretch rounded border border-[#F2F2F2] bg-white px-1.5">
											<Pressable
												onPress={() =>
													setFormValues((prev) => ({ ...prev, age: (prev.age ?? 0) + 1 }))
												}>
												<ArrowDownIcon />
											</Pressable>
											<Pressable>
												<ArrowUpIcon
													onPress={() =>
														setFormValues((prev) => ({
															...prev,
															age: Math.max((prev.age ?? 0) - 1, 0)
														}))
													}
												/>
											</Pressable>
										</View>
									</View>
								</View>
								<View className="flex flex-row items-center gap-5">
									<Label rootClassName="basis-[17%] whitespace-nowrap text-sm text-black">Gender:</Label>
									<View className="flex flex-row items-center gap-[23px]">
										<Pressable
											style={{ elevation: 5, boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)' }}
											onPress={() => setFormValues((prev) => ({ ...prev, gender: 'male' }))}
											className={cn(
												'rounded border border-[#F2F2F2] bg-white p-2',
												formValues.gender === 'male' ? 'bg-[#3664C0]' : 'bg-white'
											)}>
											<MaleIcon
												width={24}
												height={24}
												color={formValues.gender === 'male' ? 'white' : '#3664C0'}
											/>
										</Pressable>
										<Pressable
											style={{ elevation: 5, boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)' }}
											onPress={() => setFormValues((prev) => ({ ...prev, gender: 'female' }))}
											className={cn(
												'rounded border border-[#F2F2F2] bg-white p-2',
												formValues.gender === 'female' ? 'bg-[#FF6AFF]' : 'bg-white'
											)}>
											<FemaleIcon
												width={24}
												height={24}
												color={formValues.gender === 'female' ? 'white' : '#FF6AFF'}
											/>
										</Pressable>
									</View>
								</View>
							</View>
						</TabsContent>
						<TabsContent value="interests">
							<View className="mt-5 flex flex-col web:mt-[21px]">
								<Text className="text-sm text-black">Choose preferred interests:</Text>
								<View className="mt-4 flex flex-row flex-wrap items-center gap-4">
									<Pressable
										onPress={() => handleInterestSelection('Animals')}
										className="native:h-[132px] native:w-[174px] flex-1 basis-[45%] overflow-hidden rounded web:[&>div]:!h-full web:[&>div]:!w-full">
										<ImageBackground
											source={require('assets/images/animals.png')}
											resizeMode="cover"
											className="native:h-[132px] native:w-[174px] min-h-[132px] overflow-hidden rounded md:min-w-[174px] web:[&>div]:!h-full web:[&>div]:!w-full">
											<View className="h-full w-full flex-1 rounded p-2">
												<View className="flex w-full flex-row items-center justify-between">
													<Text className="font-bold text-white">Animals</Text>
													<View
														className={cn(
															'h-6 w-6 items-center justify-center rounded-full bg-white',
															formValues.interests.includes('Animals') ? 'flex' : 'invisible'
														)}>
														<View className="size-3 h-3 w-3 rounded-full bg-[#AE9FFF]" />
													</View>
												</View>
											</View>
										</ImageBackground>
									</Pressable>
									<Pressable
										onPress={() => handleInterestSelection('Space')}
										className="native:h-[132px] native:w-[174px] flex-1 basis-[45%] overflow-hidden rounded web:[&>div]:!h-full web:[&>div]:!w-full">
										<ImageBackground
											source={require('assets/images/space.png')}
											resizeMode="cover"
											className="native:h-[132px] native:w-[174px] min-h-[132px] overflow-hidden rounded md:min-w-[174px] web:[&>div]:!h-full web:[&>div]:!w-full">
											<View className="h-full w-full flex-1 rounded p-2">
												<View className="flex w-full flex-row items-center justify-between">
													<Text className="font-bold text-white">Space</Text>
													<View
														className={cn(
															'h-6 w-6 items-center justify-center rounded-full bg-white',
															formValues.interests.includes('Space') ? 'flex' : 'invisible'
														)}>
														<View className="size-3 h-3 w-3 rounded-full bg-[#AE9FFF]" />
													</View>
												</View>
											</View>
										</ImageBackground>
									</Pressable>
									<Pressable
										onPress={() => handleInterestSelection('Sports')}
										className="native:h-[132px] native:w-[174px] flex-1 basis-[45%] overflow-hidden rounded web:[&>div]:!h-full web:[&>div]:!w-full">
										<ImageBackground
											source={require('assets/images/sports.png')}
											resizeMode="cover"
											className="native:h-[132px] native:w-[174px] min-h-[132px] overflow-hidden rounded md:min-w-[174px] web:[&>div]:!h-full web:[&>div]:!w-full">
											<View className="h-full w-full flex-1 rounded p-2">
												<View className="flex w-full flex-row items-center justify-between">
													<Text className="font-bold text-white">Sports</Text>
													<View
														className={cn(
															'h-6 w-6 items-center justify-center rounded-full bg-white',
															formValues.interests.includes('Sports') ? 'flex' : 'invisible'
														)}>
														<View className="size-3 h-3 w-3 rounded-full bg-[#AE9FFF]" />
													</View>
												</View>
											</View>
										</ImageBackground>
									</Pressable>
									<Pressable
										onPress={() => handleInterestSelection('Math')}
										className="native:h-[132px] native:w-[174px] flex-1 basis-[45%] overflow-hidden rounded web:[&>div]:!h-full web:[&>div]:!w-full">
										<ImageBackground
											source={require('assets/images/math.png')}
											resizeMode="cover"
											className="native:h-[132px] native:w-[174px] min-h-[132px] overflow-hidden rounded md:min-w-[174px] web:[&>div]:!h-full web:[&>div]:!w-full">
											<View className="h-full w-full flex-1 rounded p-2">
												<View className="flex w-full flex-row items-center justify-between">
													<Text className="font-bold text-white">Math</Text>
													<View
														className={cn(
															'h-6 w-6 items-center justify-center rounded-full bg-white',
															formValues.interests.includes('Math') ? 'flex' : 'invisible'
														)}>
														<View className="size-3 h-3 w-3 rounded-full bg-[#AE9FFF]" />
													</View>
												</View>
											</View>
										</ImageBackground>
									</Pressable>
									<Pressable
										onPress={() => handleInterestSelection('Science')}
										className="native:h-[132px] native:w-[174px] flex-1 basis-[45%] overflow-hidden rounded web:[&>div]:!h-full web:[&>div]:!w-full">
										<ImageBackground
											source={require('assets/images/science.png')}
											resizeMode="cover"
											className="native:h-[132px] native:w-[174px] min-h-[132px] overflow-hidden rounded md:min-w-[174px] web:[&>div]:!h-full web:[&>div]:!w-full">
											<View className="h-full w-full flex-1 rounded p-2">
												<View className="flex w-full flex-row items-center justify-between">
													<Text className="font-bold text-white">Science</Text>
													<View
														className={cn(
															'h-6 w-6 items-center justify-center rounded-full bg-white',
															formValues.interests.includes('Science') ? 'flex' : 'invisible'
														)}>
														<View className="size-3 h-3 w-3 rounded-full bg-[#AE9FFF]" />
													</View>
												</View>
											</View>
										</ImageBackground>
									</Pressable>
									<Pressable
										onPress={() => handleInterestSelection('Science')}
										className="native:h-[132px] native:w-[174px] invisible flex-1 basis-[45%] overflow-hidden rounded web:[&>div]:!h-full web:[&>div]:!w-full">
										<ImageBackground
											source={require('assets/images/science.png')}
											resizeMode="cover"
											className="native:h-[132px] native:w-[174px] min-h-[132px] overflow-hidden rounded md:min-w-[174px] web:[&>div]:!h-full web:[&>div]:!w-full">
											<View className="native:h-[132px] native:w-[174px] min-h-[132px] flex-1 rounded p-2 web:h-full web:w-full md:min-w-[174px]">
												<View className="flex flex-row items-center justify-between">
													<Text className="font-bold text-white">Science</Text>
												</View>
											</View>
										</ImageBackground>
									</Pressable>
								</View>
							</View>
						</TabsContent>
						<TabsContent value="language">
							<View className="native:justify-center mt-5 flex flex-1 flex-row flex-wrap items-start gap-4 web:mt-6 max-md:justify-center">
								<Pressable
									onPress={() => {
										return handlePresentModalPress()
										setFormValues((prev) => ({ ...prev, language: 'English' }))
									}}
									className="native:basis-[calc(33%-16px)] flex basis-[calc(33%-16px)] flex-col items-center gap-1 lg:web:basis-[calc(25%-16px)]">
									<View className="relative rounded-lg">
										<Image
											source={require('assets/images/english.png')}
											resizeMode="cover"
											className="native:h-[80px] native:w-[80px] h-full w-full"
										/>
										{formValues.language !== 'English' && (
											<View className="absolute inset-0 z-10 rounded-lg bg-black/70" />
										)}
										<View
											className={cn(
												'absolute right-1 top-1 flex size-6 cursor-pointer flex-row items-center justify-center rounded-full bg-white',
												{ invisible: formValues.language !== 'English' }
											)}>
											<View className="size-3 rounded-full bg-[#AE9FFF]" />
										</View>
									</View>
									<Text className="text-sm text-[#404040]">English</Text>
								</Pressable>
								<Pressable
									onPress={() => {
										return handlePresentModalPress()
										setFormValues((prev) => ({ ...prev, language: 'Spanish' }))
									}}
									className="native:basis-[calc(33%-16px)] flex basis-[calc(33%-16px)] flex-col items-center gap-1 lg:web:basis-[calc(25%-16px)]">
									<View className="relative rounded-lg">
										<Image
											source={require('assets/images/spanish.png')}
											resizeMode="cover"
											className="native:h-[80px] native:w-[80px] h-full w-full"
										/>
										{formValues.language !== 'Spanish' && (
											<View className="absolute inset-0 z-10 rounded-lg bg-black/70" />
										)}
										<View
											className={cn(
												'absolute right-1 top-1 flex size-6 cursor-pointer flex-row items-center justify-center rounded-full bg-white',
												{ invisible: formValues.language !== 'Spanish' }
											)}>
											<View className="size-3 rounded-full bg-[#AE9FFF]" />
										</View>
									</View>
									<Text className="text-sm text-[#404040]">Spanish</Text>
								</Pressable>
								<Pressable
									onPress={() => {
										return handlePresentModalPress()
										setFormValues((prev) => ({ ...prev, language: 'German' }))
									}}
									className="native:basis-[calc(33%-16px)] flex basis-[calc(33%-16px)] flex-col items-center gap-1 lg:web:basis-[calc(25%-16px)]">
									<View className="relative rounded-lg">
										<Image
											source={require('assets/images/german.png')}
											resizeMode="cover"
											className="native:h-[80px] native:w-[80px] h-full w-full"
										/>
										{formValues.language !== 'German' && (
											<View className="absolute inset-0 z-10 rounded-lg bg-black/70" />
										)}
										<View
											className={cn(
												'absolute right-1 top-1 flex size-6 cursor-pointer flex-row items-center justify-center rounded-full bg-white',
												{ invisible: formValues.language !== 'German' }
											)}>
											<View className="size-3 rounded-full bg-[#AE9FFF]" />
										</View>
									</View>
									<Text className="text-sm text-[#404040]">German</Text>
								</Pressable>
								<Pressable
									onPress={() => {
										return handlePresentModalPress()
										setFormValues((prev) => ({ ...prev, language: 'Chinese' }))
									}}
									className="native:basis-[calc(33%-16px)] flex basis-[calc(33%-16px)] flex-col items-center gap-1 lg:web:basis-[calc(25%-16px)]">
									<View className="relative rounded-lg">
										<Image
											source={require('assets/images/chinese.png')}
											resizeMode="cover"
											className="native:h-[80px] native:w-[80px] h-full w-full"
										/>
										{formValues.language !== 'Chinese' && (
											<View className="absolute inset-0 z-10 rounded-lg bg-black/70" />
										)}
										<View
											className={cn(
												'absolute right-1 top-1 flex size-6 cursor-pointer flex-row items-center justify-center rounded-full bg-white',
												{ invisible: formValues.language !== 'Chinese' }
											)}>
											<View className="size-3 rounded-full bg-[#AE9FFF]" />
										</View>
									</View>
									<Text className="text-sm text-[#404040]">Chinese</Text>
								</Pressable>
								<Pressable
									onPress={() => {
										return handlePresentModalPress()
										setFormValues((prev) => ({ ...prev, language: 'French' }))
									}}
									className="native:basis-[calc(33%-16px)] flex basis-[calc(33%-16px)] flex-col items-center gap-1 lg:web:basis-[calc(25%-16px)]">
									<View className="relative rounded-lg">
										<Image
											source={require('assets/images/french.png')}
											resizeMode="cover"
											className="native:h-[80px] native:w-[80px] h-full w-full"
										/>
										{formValues.language !== 'French' && (
											<View className="absolute inset-0 z-10 rounded-lg bg-black/70" />
										)}
										<View
											className={cn(
												'absolute right-1 top-1 flex size-6 cursor-pointer flex-row items-center justify-center rounded-full bg-white',
												{ invisible: formValues.language !== 'French' }
											)}>
											<View className="size-3 rounded-full bg-[#AE9FFF]" />
										</View>
									</View>
									<Text className="text-sm text-[#404040]">French</Text>
								</Pressable>
								<Pressable className="native:basis-[calc(33%-16px)] flex basis-[calc(33%-16px)] flex-col items-center gap-1 lg:web:basis-[calc(25%-16px)]">
									<View className="flex size-[80px] flex-row items-center justify-center rounded-lg border-[0.5px] border-[#C5C5C5]">
										<PlusIcon />
									</View>
									<Text className="text-sm text-[#404040]">Add</Text>
								</Pressable>
							</View>
						</TabsContent>
					</Tabs>
				</View>
				<View className="mt-4 flex flex-row justify-end">
					<Button style={{ elevation: 5, boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)' }}>
						<Text className="text-white">Next</Text>
					</Button>
				</View>
			</View>
			<View className="mx-[30px] mb-10 mt-[15px] shrink-0 rounded-lg border border-dashed border-[#AE9FFF] bg-[#AE9FFF1C] p-3">
				<Text className="text-sm font-semibold text-black">
					Note :{' '}
					<Text className="text-[#AE9FFF]">
						{selectedTab === 'language'
							? 'Above information will be used as response language.'
							: 'Above information will be used when interacting with the child.'}
					</Text>
				</Text>
			</View>
		</ScrollView>
	)
}

const MaleIcon = ({ width = 24, height = 24, color = 'currentColor' }) => {
	return (
		<Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
			<G id="man_icon">
				<Path
					id="Vector"
					d="M9 15.25H9.75V21C9.75 21.3463 9.86986 21.6484 10.1107 21.8893C10.3516 22.1301 10.6537 22.25 11 22.25H13C13.3463 22.25 13.6484 22.1301 13.8893 21.8893C14.1301 21.6484 14.25 21.3463 14.25 21V15.25H15C15.3463 15.25 15.6484 15.1301 15.8893 14.8893C16.1301 14.6484 16.25 14.3463 16.25 14V9C16.25 8.38317 16.0275 7.8489 15.5893 7.41072C15.1511 6.97255 14.6168 6.75 14 6.75H10C9.38317 6.75 8.8489 6.97255 8.41072 7.41072C7.97255 7.8489 7.75 8.38317 7.75 9V14C7.75 14.3463 7.86986 14.6484 8.11072 14.8893C8.35159 15.1301 8.65371 15.25 9 15.25ZM10.4107 5.58928C10.8489 6.02745 11.3832 6.25 12 6.25C12.6168 6.25 13.1511 6.02745 13.5893 5.58928C14.0275 5.1511 14.25 4.61683 14.25 4C14.25 3.38317 14.0275 2.8489 13.5893 2.41072C13.1511 1.97255 12.6168 1.75 12 1.75C11.3832 1.75 10.8489 1.97255 10.4107 2.41072C9.97255 2.8489 9.75 3.38317 9.75 4C9.75 4.61683 9.97255 5.1511 10.4107 5.58928Z"
					fill={color}
					stroke={color}
					strokeWidth="0.5"
				/>
			</G>
		</Svg>
	)
}

const FemaleIcon = ({ width = 24, height = 24, color = 'currentColor' }) => {
	return (
		<Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
			<G id="woman_icon">
				<Path
					id="Vector"
					d="M12.0002 6.5C12.5291 6.5 13.0178 6.64416 13.4526 6.93397C13.8873 7.22379 14.2083 7.61949 14.4118 8.10769L14.4153 8.11618L14.4152 8.11621L16.9145 14.4393C16.9146 14.4397 16.9148 14.4401 16.9149 14.4405C17.1086 14.9256 17.0585 15.4138 16.7626 15.8453C16.4705 16.2712 16.0421 16.5 15.5252 16.5H14.5002V21C14.5002 21.4092 14.3563 21.776 14.0663 22.0661C13.7762 22.3561 13.4095 22.5 13.0002 22.5H11.0002C10.591 22.5 10.2242 22.3561 9.93416 22.0661C9.6441 21.776 9.50022 21.4092 9.50022 21V16.5H8.47521C7.9583 16.5 7.52992 16.2712 7.23785 15.8453C6.94193 15.4137 6.89184 14.9255 7.08557 14.4403C7.0857 14.44 7.08584 14.4396 7.08598 14.4393L9.58522 8.11621L9.5886 8.10766L9.58868 8.10769C9.7921 7.61949 10.1131 7.22379 10.5479 6.93397C10.9826 6.64416 11.4713 6.5 12.0002 6.5ZM12.0002 6.5C12.6839 6.5 13.2816 6.25074 13.7663 5.76605C14.251 5.28137 14.5002 4.68366 14.5002 4C14.5002 3.31634 14.251 2.71863 13.7663 2.23395C13.2816 1.74926 12.6839 1.5 12.0002 1.5C11.3166 1.5 10.7188 1.74926 10.2342 2.23395C9.74947 2.71863 9.50022 3.31634 9.50022 4C9.50022 4.68366 9.74947 5.28137 10.2342 5.76605C10.7188 6.25074 11.3166 6.5 12.0002 6.5Z"
					fill={color}
					stroke={color}
				/>
			</G>
		</Svg>
	)
}
