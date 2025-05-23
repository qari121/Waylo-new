/* eslint-disable react-native/no-color-literals */
import React from 'react'
import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Image, ImageBackground, Pressable, ScrollView, Text, View, StyleSheet, Platform } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import Svg, { G, Path } from 'react-native-svg'

import {
	BottomSheetBackdrop,
	BottomSheetBackdropProps,
	BottomSheetModal,
	BottomSheetView
} from '@gorhom/bottom-sheet'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { cn } from '../lib/utils'
import { fetchInterestLogs } from '../slices/logs'
import { useAppDispatch, useAppSelector } from '../hooks'

import PlusIcon from '../assets/icons/add.svg'
import ArrowDownIcon from '../assets/icons/arrow-down.svg'
import ArrowUpIcon from '../assets/icons/arrow-up.svg'
import ChevronLeftIcon from '../assets/icons/chevron-left.svg'
import MaleIcon from '../assets/icons/male.svg'
import FemaleIcon from '../assets/icons/female.svg'

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
		<ScrollView style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => router.dismiss()}>
					<ChevronLeftIcon />
				</Pressable>
				<Text style={styles.headerTitle}>Wylo Registration</Text>
				<Text />
			</View>
			<View style={styles.characterSection}>
				<Image
					source={require('../assets/images/avatar.png')}
					style={styles.characterImage}
				/>
				<View style={styles.characterInfo}>
					<Text style={styles.characterLabel}>Character Selected</Text>
					<Text style={styles.characterName}>Friendly teddy bear</Text>
					<View style={styles.characterAvatars}>
						<Image
							source={require('../assets/images/avatar.png')}
							style={styles.avatarImage}
						/>
						<Image
							source={require('../assets/images/avatar.png')}
							style={[styles.avatarImage, styles.avatarImageOverlap]}
						/>
						<Image
							source={require('../assets/images/avatar.png')}
							style={[styles.avatarImage, styles.avatarImageOverlap]}
						/>
					</View>
				</View>
			</View>
			<View style={styles.formContainer}>
				<View style={styles.tabsContainer}>
					<Tabs value={selectedTab} onValueChange={setSelectedTab} style={styles.tabs}>
						<TabsList style={styles.tabsList}>
							<TabsTrigger
								asChild
								value="info"
								style={[styles.tabTrigger, selectedTab === 'info' && styles.tabTriggerActive]}>
								<Text style={[styles.tabText, selectedTab === 'info' ? styles.tabTextActive : styles.tabTextInactive]}>
									Personal Info.
								</Text>
							</TabsTrigger>
							<TabsTrigger
								asChild
								value="interests"
								style={[styles.tabTrigger, selectedTab === 'interests' && styles.tabTriggerActive]}>
								<Text style={[styles.tabText, selectedTab === 'interests' ? styles.tabTextActive : styles.tabTextInactive]}>
									Interests
								</Text>
							</TabsTrigger>
							<TabsTrigger
								asChild
								value="language"
								style={[styles.tabTrigger, selectedTab === 'language' && styles.tabTriggerActive]}>
								<Text style={[styles.tabText, selectedTab === 'language' ? styles.tabTextActive : styles.tabTextInactive]}>
									Language
								</Text>
							</TabsTrigger>
						</TabsList>
						<TabsContent value="info">
							<View style={styles.infoForm}>
								<View style={styles.formRow}>
									<Label style={styles.label} nativeID="name">Name:</Label>
									<Input
										value={formValues.name}
										nativeID="name"
										style={[styles.input, styles.inputShadow]}
										onChangeText={(text: string) =>
											setFormValues((prev) => ({ ...prev, name: text }))
										}
									/>
								</View>
								<View style={styles.formRow}>
									<Label style={styles.label} nativeID="age">Age:</Label>
									<View style={[styles.ageInputContainer, styles.inputShadow]}>
										<Input
											value={formValues.age?.toString()}
											keyboardType="numeric"
											placeholder="Eg.24"
											style={styles.ageInput}
											onChangeText={(text: string) =>
												setFormValues((prev) => ({
													...prev,
													age: text === '' ? null : Number(text.replace(/[^0-9]/g, ''))
												}))
											}
										/>
										<View style={styles.ageControls}>
											<Pressable
												onPress={() =>
													setFormValues((prev) => ({ ...prev, age: (prev.age ?? 0) + 1 }))
												}>
												<ArrowDownIcon />
											</Pressable>
											<Pressable
												onPress={() =>
													setFormValues((prev) => ({
														...prev,
														age: Math.max((prev.age ?? 0) - 1, 0)
													}))
												}>
												<ArrowUpIcon />
											</Pressable>
										</View>
									</View>
								</View>
								<View style={styles.formRow}>
									<Label style={[styles.label, styles.genderLabel]} nativeID="gender">
										Gender:
									</Label>
									<View style={styles.genderButtons}>
										<Pressable
											style={[
												styles.genderButton,
												styles.inputShadow,
												formValues.gender === 'male' && styles.genderButtonActive
											]}
											onPress={() => setFormValues((prev) => ({ ...prev, gender: 'male' }))}>
											<MaleIcon
												width={24}
												height={24}
												color={formValues.gender === 'male' ? 'white' : '#3664C0'}
											/>
										</Pressable>
										<Pressable
											style={[
												styles.genderButton,
												styles.inputShadow,
												formValues.gender === 'female' && styles.genderButtonActiveFemale
											]}
											onPress={() => setFormValues((prev) => ({ ...prev, gender: 'female' }))}>
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
							<View style={styles.interestsGrid}>
								<Pressable
									onPress={() => handleInterestSelection('Space')}
									style={styles.interestItem}>
									<ImageBackground
										source={require('../assets/images/space.png')}
										resizeMode="cover"
										style={styles.interestImage}>
										<View style={styles.interestContent}>
											<View style={styles.interestHeader}>
												<Text style={styles.interestTitle}>Space</Text>
												<View style={[
													styles.interestCheckbox,
													!formValues.interests.includes('Space') && styles.interestCheckboxHidden
												]}>
													<View style={styles.interestCheckboxInner} />
												</View>
											</View>
										</View>
									</ImageBackground>
								</Pressable>
							</View>
						</TabsContent>
						<TabsContent value="language">
							<View style={styles.languageGrid}>
								<Pressable
									onPress={() => {
										handlePresentModalPress()
										setFormValues((prev) => ({ ...prev, language: 'Spanish' }))
									}}
									style={styles.languageItem}>
									<View style={styles.languageImageContainer}>
										<Image
											source={require('../assets/images/spanish.png')}
											resizeMode="cover"
											style={styles.languageImage}
										/>
										{formValues.language !== 'Spanish' && (
											<View style={styles.languageOverlay} />
										)}
										<View style={[
											styles.languageCheckbox,
											formValues.language !== 'Spanish' && styles.languageCheckboxHidden
										]}>
											<View style={styles.languageCheckboxInner} />
										</View>
									</View>
									<Text style={styles.languageName}>Spanish</Text>
								</Pressable>
							</View>
						</TabsContent>
					</Tabs>
				</View>
			</View>
		</ScrollView>
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
		paddingTop: 20,
	},
	headerTitle: {
		textAlign: 'center',
		fontWeight: 'bold',
		color: '#7F67FF',
	},
	characterSection: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		paddingHorizontal: 20,
	},
	characterImage: {
		marginTop: 20,
		width: 203,
		height: 272,
	},
	characterInfo: {
		marginTop: 128,
		flexShrink: 1,
		flexDirection: 'column',
	},
	characterLabel: {
		fontSize: 14,
		color: 'black',
	},
	characterName: {
		marginTop: 4,
		fontSize: 20,
		fontWeight: '600',
		color: '#0E2C76',
	},
	characterAvatars: {
		marginTop: 16,
		flexDirection: 'row',
		alignItems: 'center',
	},
	avatarImage: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: 'white',
		overflow: 'hidden',
	},
	avatarImageOverlap: {
		marginLeft: -6,
	},
	formContainer: {
		marginTop: Platform.OS === 'web' ? 8 : 40,
		marginHorizontal: 16,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#F2F2F2',
		backgroundColor: 'white',
		padding: 16,
		paddingTop: 0,
	},
	tabsContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	tabs: {
		width: '100%',
	},
	tabsList: {
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		borderBottomWidth: 1,
		borderBottomColor: '#D9D9D9',
	},
	tabTrigger: {
		paddingBottom: 2,
	},
	tabTriggerActive: {
		borderBottomWidth: 1,
		borderBottomColor: '#0E2C76',
	},
	tabText: {
		fontWeight: '600',
	},
	tabTextActive: {
		color: '#0E2C76',
	},
	tabTextInactive: {
		color: '#B2B1B1',
	},
	infoForm: {
		marginTop: Platform.OS === 'web' ? 29 : 20,
		flexDirection: 'column',
		gap: 36,
	},
	formRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 20,
	},
	label: {
		flexBasis: '17%',
		fontSize: 14,
		color: 'black',
	},
	genderLabel: {
		flexShrink: 0,
	},
	input: {
		flexBasis: Platform.OS === 'web' ? '80%' : '78%',
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#F2F2F2',
		backgroundColor: 'white',
	},
	inputShadow: {
		...(Platform.OS === 'web' ? {
			boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)',
		} : {
			elevation: 5,
		}),
	},
	ageInputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 48,
		width: 95,
		borderRadius: 4,
		backgroundColor: 'white',
	},
	ageInput: {
		flex: 1,
		borderWidth: 1,
		borderRightWidth: 0,
		borderColor: '#F2F2F2',
		backgroundColor: 'white',
		paddingHorizontal: 12,
		borderTopLeftRadius: 4,
		borderBottomLeftRadius: 4,
		...(Platform.OS === 'web' && {
			outlineStyle: 'solid',
		}),
	},
	ageControls: {
		flexDirection: 'column',
		justifyContent: 'center',
		gap: 4,
		alignSelf: 'stretch',
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#F2F2F2',
		backgroundColor: 'white',
		paddingHorizontal: 6,
	},
	genderButtons: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 23,
	},
	genderButton: {
		padding: 8,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#F2F2F2',
		backgroundColor: 'white',
	},
	genderButtonActive: {
		backgroundColor: '#3664C0',
	},
	genderButtonActiveFemale: {
		backgroundColor: '#FF6AFF',
	},
	interestsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 16,
	},
	interestItem: {
		flexBasis: '45%',
		height: Platform.OS === 'web' ? 'auto' : 132,
		width: Platform.OS === 'web' ? 'auto' : 174,
		overflow: 'hidden',
		borderRadius: 4,
	},
	interestImage: {
		height: Platform.OS === 'web' ? '100%' : 132,
		width: Platform.OS === 'web' ? '100%' : 174,
		minHeight: 132,
		overflow: 'hidden',
		...(Platform.OS === 'web' && {
			minWidth: 174,
		}),
	},
	interestContent: {
		height: '100%',
		width: '100%',
		flex: 1,
		borderRadius: 4,
		padding: 8,
	},
	interestHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
	},
	interestTitle: {
		fontWeight: 'bold',
		color: 'white',
	},
	interestCheckbox: {
		height: 24,
		width: 24,
		borderRadius: 12,
		backgroundColor: 'white',
		alignItems: 'center',
		justifyContent: 'center',
	},
	interestCheckboxHidden: {
		opacity: 0,
	},
	interestCheckboxInner: {
		height: 12,
		width: 12,
		borderRadius: 6,
		backgroundColor: '#AE9FFF',
	},
	languageGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 16,
	},
	languageItem: {
		flexBasis: Platform.OS === 'web' ? '25%' : '33%',
		alignItems: 'center',
		gap: 4,
		marginHorizontal: 8,
	},
	languageImageContainer: {
		position: 'relative',
		borderRadius: 8,
	},
	languageImage: {
		height: Platform.OS === 'web' ? '100%' : 80,
		width: Platform.OS === 'web' ? '100%' : 80,
		overflow: 'hidden',
	},
	languageOverlay: {
		position: 'absolute',
		inset: 0,
		zIndex: 10,
		borderRadius: 8,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
	},
	languageCheckbox: {
		position: 'absolute',
		right: 4,
		top: 4,
		height: 24,
		width: 24,
		borderRadius: 12,
		backgroundColor: 'white',
		alignItems: 'center',
		justifyContent: 'center',
		...(Platform.OS === 'web' && {
			cursor: 'pointer',
		}),
	},
	languageCheckboxHidden: {
		opacity: 0,
	},
	languageCheckboxInner: {
		height: 12,
		width: 12,
		borderRadius: 6,
		backgroundColor: '#AE9FFF',
	},
	languageName: {
		fontSize: 14,
		color: '#404040',
	},
})
