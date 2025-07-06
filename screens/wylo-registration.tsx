/* eslint-disable react-native/no-color-literals */
import React from 'react'
import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Image, ImageBackground, Pressable, ScrollView, Text, View, StyleSheet, Platform, Modal, FlatList, TouchableOpacity, Alert } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import Svg, { G, Path } from 'react-native-svg'
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'

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
import { setUser } from '../slices/auth'

import PlusIcon from '../assets/icons/add.svg'
import ArrowDownIcon from '../assets/icons/arrow-down.svg'
import ArrowUpIcon from '../assets/icons/arrow-up.svg'
import ChevronLeftIcon from '../assets/icons/chevron-left.svg'
import MaleIcon from '../assets/icons/male.svg'
import FemaleIcon from '../assets/icons/female.svg'
import SettingsIcon from '../assets/icons/settings.svg'
import { db } from '../firebase'
import { doc, updateDoc } from 'firebase/firestore'

interface FormValues {
	name: string
	username: string
	age: number | null
	gender: string
	interests: string[]
	language: string
}

export const WyloRegistrationScreen = () => {
	const router = useRouter()
	const dispatch = useAppDispatch()
	const interestLogs = useAppSelector((state) => state.logs.interestLogs)
	const auth = useAppSelector(state => state.auth)
	const [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
	})

	const bottomSheetModalRef = useRef<BottomSheetModal>(null)
	const interestBottomSheetModalRef = useRef<BottomSheetModal>(null)
	const [selectedTab, setSelectedTab] = useState('info')
	const [isLoading, setIsLoading] = useState(false)
	const [formValues, setFormValues] = useState<FormValues>({
		name: '',
		username: '',
		age: null,
		gender: '',
		interests: [],
		language: 'German'
	})
	const [agePickerVisible, setAgePickerVisible] = useState(false)

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
			await dispatch(fetchInterestLogs({ interestValue: value.toLowerCase(), macAddress: '' }))
			setIsLoading(false)
		}
	}

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop {...props} disappearsOnIndex={-1} opacity={0.6} appearsOnIndex={0} />
		),
		[]
	)

	if (!fontsLoaded) return null;

	const ageOptions = Array.from({ length: 18 }, (_, i) => (i + 1).toString());

	const savePersonalInfoToFirestore = async () => {
		if (!auth.uid) return;
		try {
			await updateDoc(doc(db, 'users', auth.uid), {
				name: formValues.name,
				username: formValues.username,
				age: formValues.age,
				gender: formValues.gender,
				updatedAt: new Date().toISOString(),
			});
		} catch (error) {
			console.error('Error saving personal info:', error);
		}
	};

	return (
		<ScrollView style={styles.container}>
			<View style={styles.circleBg} />
			<View style={styles.headerRow}>
				<View style={{ width: 24 }} />
				<Text style={styles.headerTitle}>Wylo Registration</Text>
				<Pressable onPress={() => router.push('/profile')}>
					<SettingsIcon width={24} height={24} />
				</Pressable>
			</View>
			<View style={styles.characterSectionRow}>
				<Image
					source={require('../assets/images/avatar.png')}
					style={styles.characterImage}
				/>
				<View style={styles.characterInfoCol}>
					{/* <Text style={styles.characterLabel}>Character Selected</Text>
					<Text style={styles.characterName}>Friendly teddy bear</Text> */}
					{/* <View style={styles.characterAvatarsRow}>
						<Image source={require('../assets/images/avatar.png')} style={styles.avatarImage} />
						<Image source={require('../assets/images/avatar.png')} style={[styles.avatarImage, styles.avatarImageOverlap]} />
						<Image source={require('../assets/images/avatar.png')} style={[styles.avatarImage, styles.avatarImageOverlap]} />
						<View style={styles.avatarPlus}><PlusIcon width={20} height={20} /></View>
					</View> */}
				</View>
			</View>
			<View style={styles.formContainer}>
				<View style={styles.tabsContainer}>
					<Tabs value={selectedTab} onValueChange={async (tab) => {
						if (selectedTab === 'info') {
							await savePersonalInfoToFirestore();
						}
						setSelectedTab(tab);
					}} style={styles.tabs}>
						<TabsList style={styles.tabsList}>
							<TabsTrigger
								asChild
								value="info"
								style={[styles.tabTrigger, selectedTab === 'info' && styles.tabTriggerActive]}
							>
								<Text style={[styles.tabText, selectedTab === 'info' ? styles.tabTextActive : styles.tabTextInactive]}>Personal Info.</Text>
							</TabsTrigger>
							{/*
							<TabsTrigger
								asChild
								value="interests"
								style={[styles.tabTrigger, selectedTab === 'interests' && styles.tabTriggerActive]}
							>
								<Text style={[styles.tabText, selectedTab === 'interests' ? styles.tabTextActive : styles.tabTextInactive]}>Interests</Text>
							</TabsTrigger>
							*/}
							
							<TabsTrigger
								asChild
								value="language"
								style={[styles.tabTrigger, selectedTab === 'language' && styles.tabTriggerActive]}
							>
								<Text style={[styles.tabText, selectedTab === 'language' ? styles.tabTextActive : styles.tabTextInactive]}>Language</Text>
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
										onChangeText={(text: string) => setFormValues((prev) => ({ ...prev, name: text }))}
									/>
								</View>
								<View style={styles.formRow}>
									<Label style={styles.label} nativeID="username">Username:</Label>
									<Input
										value={formValues.username}
										nativeID="username"
										style={[styles.input, styles.inputShadow]}
										onChangeText={(text: string) => setFormValues((prev) => ({ ...prev, username: text }))}
									/>
								</View>
								<View style={styles.formRow}>
									<Label style={styles.label} nativeID="age">Age:</Label>
									<View style={[styles.ageInputContainer, styles.inputShadow]}>
										<Input
											value={formValues.age?.toString() || ''}
											keyboardType="numeric"
											placeholder="Eg.24"
											style={styles.ageInput}
											editable={true}
											onChangeText={(text: string) => {
												const ageNum = parseInt(text);
												if (text === '' || (ageNum >= 1 && ageNum <= 18)) {
													setFormValues((prev) => ({ ...prev, age: text === '' ? null : ageNum }));
												}
											}}
										/>
										<Pressable style={styles.ageDropdown} onPress={() => setAgePickerVisible(true)}>
											<ArrowDownIcon />
										</Pressable>
									</View>
								</View>
								<View style={styles.formRow}>
									<Label style={[styles.label, styles.genderLabel]} nativeID="gender">Gender:</Label>
									<View style={styles.genderButtons}>
										<Pressable style={[styles.genderButton, styles.inputShadow, formValues.gender === 'male' && styles.genderButtonActive]} onPress={() => setFormValues((prev) => ({ ...prev, gender: 'male' }))}>
											<MaleIcon width={24} height={24} color={formValues.gender === 'male' ? 'white' : '#3664C0'} />
										</Pressable>
										<Pressable style={[styles.genderButton, styles.inputShadow, formValues.gender === 'female' && styles.genderButtonActiveFemale]} onPress={() => setFormValues((prev) => ({ ...prev, gender: 'female' }))}>
											<FemaleIcon width={24} height={24} color={formValues.gender === 'female' ? 'white' : '#FF6AFF'} />
										</Pressable>
									</View>
								</View>
								<Button
									style={{ marginTop: 24, backgroundColor: '#AE9FFF', borderRadius: 8 }}
									onPress={async () => {
										try {
											const ageNum = typeof formValues.age === 'string' ? Number(formValues.age) : formValues.age;
											const nameValid = typeof formValues.name === 'string' && formValues.name.trim().length > 0;
											const usernameValid = typeof formValues.username === 'string' && formValues.username.trim().length > 0;
											const ageValid = typeof ageNum === 'number' && !isNaN(ageNum) && ageNum > 0;
											const genderValid = typeof formValues.gender === 'string' && formValues.gender.trim().length > 0;
											if (!nameValid || !usernameValid || !ageValid || !genderValid) {
												Alert.alert('Error', 'Please fill in all fields.');
												return;
											}
											
											const updatedUserData = {
												...auth,
												name: formValues.name.trim(),
												username: formValues.username.trim(),
												age: ageNum,
												gender: formValues.gender.trim(),
												updatedAt: new Date().toISOString(),
											};
											
											await updateDoc(doc(db, 'users', auth.uid), {
												name: formValues.name.trim(),
												username: formValues.username.trim(),
												age: ageNum,
												gender: formValues.gender.trim(),
												updatedAt: new Date().toISOString(),
											});
											
											// Update Redux state immediately
											dispatch(setUser(updatedUserData));
											
											Alert.alert('Success', 'Personal info saved!');
										} catch (error) {
											Alert.alert('Error', 'Failed to save personal info.');
										}
									}}
								>
									<Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Save</Text>
								</Button>
							</View>
						</TabsContent>
						{/*
						<TabsContent value="interests">
							<View style={styles.interestsGrid}>
								<Pressable onPress={() => handleInterestSelection('Space')} style={styles.interestItem}>
									<ImageBackground source={require('../assets/images/space.png')} resizeMode="cover" style={styles.interestImage}>
										<View style={styles.interestContent}>
											<View style={styles.interestHeader}>
												<Text style={styles.interestTitle}>Space</Text>
												<View style={[styles.interestCheckbox, !formValues.interests.includes('Space') && styles.interestCheckboxHidden]}>
													<View style={styles.interestCheckboxInner} />
												</View>
											</View>
										</View>
									</ImageBackground>
								</Pressable>
							</View>
						</TabsContent>
						*/}
						
						<TabsContent value="language">
							<View style={styles.languageGrid}>
								<Pressable onPress={() => { handlePresentModalPress(); setFormValues((prev) => ({ ...prev, language: 'Spanish' })); }} style={styles.languageItem}>
									<View style={styles.languageImageContainer}>
										<Image source={require('../assets/images/spanish.png')} resizeMode="cover" style={styles.languageImage} />
										{formValues.language !== 'Spanish' && <View style={styles.languageOverlay} />}
										<View style={[styles.languageCheckbox, formValues.language !== 'Spanish' && styles.languageCheckboxHidden]}>
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

			{/* Age Picker Modal */}
			<Modal
				visible={agePickerVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setAgePickerVisible(false)}
			>
				<TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPressOut={() => setAgePickerVisible(false)}>
					<View style={{ backgroundColor: 'white', borderRadius: 10, padding: 16, minWidth: 120, maxHeight: 300 }}>
						<FlatList
							data={ageOptions}
							keyExtractor={item => item}
							renderItem={({ item }) => (
								<TouchableOpacity
									style={{ paddingVertical: 12, alignItems: 'center' }}
									onPress={() => {
										setFormValues(prev => ({ ...prev, age: Number(item) }));
										setAgePickerVisible(false);
									}}
								>
									<Text style={{ fontSize: 18 }}>{item}</Text>
								</TouchableOpacity>
							)}
						/>
					</View>
				</TouchableOpacity>
			</Modal>

			<View style={styles.noteBox}>
				<Text style={styles.noteText}><Text style={styles.noteBold}>Note :</Text> <Text style={styles.noteHighlight}>Above information will be used when interacting with the child.</Text></Text>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: 'white',
		paddingTop: Platform.OS === 'ios' ? 44 : 0,
	},
	circleBg: {
		position: 'absolute',
		top: -90,
		right: -120,
		width: 500,
		height: 350,
		borderRadius: 250,
		backgroundColor: '#E5D8FF',
		zIndex: -1,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		paddingTop: Platform.OS === 'ios' ? 14 : 20,
		marginBottom: 8,
	},
	headerTitle: {
		flex: 1,
		textAlign: 'center',
		fontWeight: 'bold',
		color: '#7F67FF',
		fontSize: 20,
		fontFamily: 'PlusJakartaSans_600SemiBold',
	},
	characterSectionRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
		gap: 12,
		paddingHorizontal: 20,
		marginBottom: 8,
	},
	characterImage: {
		width: 160,
		height: 210,
		marginTop: 10,
		marginRight: 8,
	},
	characterInfoCol: {
		flex: 1,
		flexDirection: 'column',
		marginTop: 40,
	},
	characterLabel: {
		fontSize: 14,
		color: '#222',
		fontFamily: 'PlusJakartaSans_400Regular',
	},
	characterName: {
		marginTop: 4,
		fontSize: 20,
		fontWeight: '600',
		color: '#0E2C76',
		fontFamily: 'PlusJakartaSans_600SemiBold',
	},
	characterAvatarsRow: {
		marginTop: 12,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 0,
	},
	avatarImage: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 2,
		borderColor: 'white',
		backgroundColor: '#eee',
		zIndex: 1,
	},
	avatarImageOverlap: {
		marginLeft: -10,
		zIndex: 0,
	},
	avatarPlus: {
		marginLeft: -10,
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#E5D8FF',
		zIndex: 2,
	},
	formContainer: {
		marginTop: 10,
		marginHorizontal: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#F2F2F2',
		backgroundColor: 'white',
		padding: 16,
		paddingTop: 0,
		shadowColor: '#E5D8FF',
		shadowOpacity: 0.12,
		shadowRadius: 12,
		elevation: 2,
	},
	tabsContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	tabs: {
		width: '100%',
	},
	tabsList: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		borderBottomWidth: 1,
		borderBottomColor: '#D9D9D9',
		marginBottom: 8,
	},
	tabTrigger: {
		paddingBottom: 2,
		flex: 1,
		alignItems: 'center',
	},
	tabTriggerActive: {
		borderBottomWidth: 2,
		borderBottomColor: '#0E2C76',
	},
	tabText: {
		fontWeight: '600',
		fontFamily: 'PlusJakartaSans_500Medium',
		fontSize: 14,
		textAlign: 'center',
	},
	tabTextActive: {
		color: '#0E2C76',
		fontFamily: 'PlusJakartaSans_600SemiBold',
	},
	tabTextInactive: {
		color: '#B2B1B1',
	},
	infoForm: {
		marginTop: 20,
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
		fontFamily: 'PlusJakartaSans_500Medium',
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
		fontFamily: 'PlusJakartaSans_400Regular',
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
		fontFamily: 'PlusJakartaSans_400Regular',
		...(Platform.OS === 'web' && {
			outlineStyle: 'solid',
		}),
	},
	ageDropdown: {
		width: 32,
		height: 48,
		alignItems: 'center',
		justifyContent: 'center',
		borderTopRightRadius: 4,
		borderBottomRightRadius: 4,
		borderWidth: 1,
		borderColor: '#F2F2F2',
		backgroundColor: 'white',
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
		borderRadius: 8,
		backgroundColor: '#F7F6FF',
		borderWidth: 1,
		borderColor: '#E5D8FF',
	},
	interestImage: {
		height: Platform.OS === 'web' ? '100%' : 132,
		width: Platform.OS === 'web' ? '100%' : 174,
		minHeight: 132,
		overflow: 'hidden',
		borderRadius: 8,
		...(Platform.OS === 'web' && {
			minWidth: 174,
		}),
	},
	interestContent: {
		height: '100%',
		width: '100%',
		flex: 1,
		borderRadius: 8,
		padding: 8,
		justifyContent: 'flex-end',
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
		fontFamily: 'PlusJakartaSans_600SemiBold',
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
		borderRadius: 8,
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
		fontFamily: 'PlusJakartaSans_500Medium',
	},
	noteBox: {
		marginTop: 24,
		marginBottom: 94,
		marginHorizontal: 16,
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#E5D8FF',
		backgroundColor: '#F7F6FF',
	},
	noteText: {
		fontSize: 14,
		color: '#7F67FF',
		fontFamily: 'PlusJakartaSans_400Regular',
	},
	noteBold: {
		fontWeight: 'bold',
		color: '#3C2FCB',
		fontFamily: 'PlusJakartaSans_600SemiBold',
	},
	noteHighlight: {
		color: '#7F67FF',
		fontFamily: 'PlusJakartaSans_500Medium',
	},
})

export default WyloRegistrationScreen;
