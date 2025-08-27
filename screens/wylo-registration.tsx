/* eslint-disable react-native/no-color-literals */
import React, { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Image, ImageBackground, Pressable, ScrollView, Text, View, StyleSheet, Platform, Modal, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
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
import { theme } from '../lib/theme'

import PlusIcon from '../assets/icons/add.svg'
import ArrowDownIcon from '../assets/icons/arrow-down.svg'
import ArrowUpIcon from '../assets/icons/arrow-up.svg'
import ChevronLeftIcon from '../assets/icons/chevron-left.svg'
import MaleIcon from '../assets/icons/male.svg'
import FemaleIcon from '../assets/icons/female.svg'
import SettingsIcon from '../assets/icons/settings.svg'
import { db } from '../firebase'
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore'

// Language mapping from display names to ISO-639-1 codes
const LANGUAGE_MAP: Record<string, string> = {
	'English (UK)': 'en-GB',
	'English (US)': 'en-US',
	'Spanish': 'es',
	'German': 'de',
	'Italian': 'it',
	'Greek': 'el',
	'Portuguese': 'pt',
	'Swedish': 'sv',
	'Dutch': 'nl'
};

// Reverse mapping for display purposes
const LANGUAGE_DISPLAY_MAP: Record<string, string> = {
	'en-GB': 'English (UK)',
	'en-US': 'English (US)',
	'es': 'Spanish',
	'de': 'German',
	'it': 'Italian',
	'el': 'Greek',
	'pt': 'Portuguese',
	'sv': 'Swedish',
	'nl': 'Dutch'
};

type AgeType = number | '45+' | null;
interface FormValues {
	childname: string
	toyname: string
	age: AgeType
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
	const [isLanguageUpdating, setIsLanguageUpdating] = useState(false)
	const [formValues, setFormValues] = useState<FormValues>({
		childname: '',
		toyname: '',
		age: null,
		gender: '',
		interests: [],
		language: 'German'
	})

	// Load current user data from Firestore
	useEffect(() => {
		const loadUserData = async () => {
			if (auth.uid) {
				try {
					console.log('[WyloRegistration] Loading user data for UID:', auth.uid);
					const userDoc = await getDoc(doc(db, 'users', auth.uid));
					if (userDoc.exists()) {
						const userData = userDoc.data();
						console.log('[WyloRegistration] Loaded user data from Firestore:', userData);
						
						// Update form values with fetched data
						const updatedFormValues = {
							childname: userData.childname || userData.name || '',
							toyname: userData.toyname || userData.username || '',
							age: userData.age || null,
							gender: userData.gender || '',
							interests: formValues.interests,
							language: formValues.language
						};
						
						setFormValues(updatedFormValues);
						console.log('[WyloRegistration] Updated form values:', updatedFormValues);
					} else {
						console.log('[WyloRegistration] No user document found for UID:', auth.uid);
					}
				} catch (error) {
					console.error('[WyloRegistration] Error loading user data:', error);
				}
			} else {
				console.log('[WyloRegistration] No auth.uid available yet');
			}
		};

		loadUserData();
	}, [auth.uid]);
	const [agePickerVisible, setAgePickerVisible] = useState(false)

	// Load current language from user data
	useEffect(() => {
		if (auth.language) {
			// Handle both ISO codes and display names for backward compatibility
			const displayLanguage = LANGUAGE_DISPLAY_MAP[auth.language] || auth.language;
			setFormValues((prev) => ({ ...prev, language: displayLanguage }));
		}
	}, [auth.language]);

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

	// New function to handle language selection with confirmation
	const handleLanguageSelection = async (selectedLanguage: string) => {
		// Don't allow multiple language updates at once
		if (isLanguageUpdating) {
			return;
		}
		
		// Validate that the selected language exists in our mapping
		if (!LANGUAGE_MAP[selectedLanguage]) {
			console.error('Invalid language selected:', selectedLanguage);
			Alert.alert('Error', 'Invalid language selection. Please try again.');
			return;
		}
		
		Alert.alert(
			'Change Language',
			`Are you sure you want to change language to ${selectedLanguage}?`,
			[
				{
					text: 'Cancel',
					style: 'cancel',
				},
				{
					text: 'Confirm',
					onPress: async () => {
						setIsLanguageUpdating(true);
						try {
							// Update local state immediately for better UX
							setFormValues((prev) => ({ ...prev, language: selectedLanguage }));
							
							// Save to Firestore with better error handling and retry mechanism
							if (auth.uid) {
								const userRef = doc(db, 'users', auth.uid);
								const languageCode = LANGUAGE_MAP[selectedLanguage];
								
								// Try up to 3 times with exponential backoff
								let lastError;
								for (let attempt = 1; attempt <= 3; attempt++) {
									try {
										// Use setDoc with merge option to ensure the update goes through
										// Add timeout to handle slow network connections
										const timeoutPromise = new Promise((_, reject) => 
											setTimeout(() => reject(new Error('Operation timeout')), 10000)
										);
										
										const updatePromise = setDoc(userRef, {
											language: languageCode,
											updatedAt: new Date().toISOString(),
										}, { merge: true });
										
										await Promise.race([updatePromise, timeoutPromise]);
										
										// Verify the update was successful by reading back the data
										const verifyDoc = await getDoc(userRef);
										if (verifyDoc.exists()) {
											const savedLanguage = verifyDoc.data()?.language;
											if (savedLanguage !== languageCode) {
												throw new Error('Language update verification failed');
											}
										}
										
										// Update Redux state
										dispatch(setUser({
											...auth,
											language: languageCode,
											updatedAt: new Date().toISOString(),
										}));
										
										// Show success message
										Alert.alert('Success', `Language changed to ${selectedLanguage}`);
										return; // Success, exit the retry loop
									} catch (error) {
										lastError = error;
										console.error(`Language update attempt ${attempt} failed:`, error);
										
										// Wait before retrying (exponential backoff)
										if (attempt < 3) {
											await new Promise(resolve => setTimeout(resolve, attempt * 1000));
										}
									}
								}
								
								// If all attempts failed, throw the last error
								throw lastError;
							} else {
								Alert.alert('Error', 'User not authenticated. Please try logging in again.');
							}
						} catch (error) {
							console.error('Error saving language after all retries:', error);
							
							// Provide more specific error messages
							let errorMessage = 'Failed to save language. Please try again.';
							
							if (error instanceof Error) {
								if (error.message.includes('network') || error.message.includes('offline')) {
									errorMessage = 'No internet connection. Please check your network and try again.';
								} else if (error.message.includes('permission')) {
									errorMessage = 'Permission denied. Please try logging in again.';
								} else if (error.message.includes('not-found')) {
									errorMessage = 'User data not found. Please try logging in again.';
								} else if (error.message.includes('unavailable')) {
									errorMessage = 'Service temporarily unavailable. Please try again in a few moments.';
								} else if (error.message.includes('timeout') || error.message.includes('Operation timeout')) {
									errorMessage = 'Request timed out. Please check your internet connection and try again.';
								}
							}
							
							Alert.alert('Error', errorMessage);
							
							// Revert local state if Firestore update failed
							const currentDisplayLanguage = auth.language ? LANGUAGE_DISPLAY_MAP[auth.language] || auth.language : 'German';
							setFormValues((prev) => ({ ...prev, language: currentDisplayLanguage }));
						} finally {
							setIsLanguageUpdating(false);
						}
					},
				},
			]
		);
	};

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop {...props} disappearsOnIndex={-1} opacity={0.6} appearsOnIndex={0} />
		),
		[]
	)

	if (!fontsLoaded) return null;
	
	console.log('[WyloRegistration] Current form values:', formValues);
	console.log('[WyloRegistration] Auth state:', { uid: auth.uid, name: auth.name, username: auth.username, age: auth.age, gender: auth.gender });

	const ageOptions = Array.from({ length: 45 }, (_, i) => (i + 1).toString()).concat('45+');

	const savePersonalInfoToFirestore = async () => {
		if (!auth.uid) return;
		try {
			await updateDoc(doc(db, 'users', auth.uid), {
				childname: formValues.childname,
				toyname: formValues.toyname,
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
								<View style={styles.formRowAligned}>
									<Label style={styles.label} nativeID="childname">Child Name:</Label>
									<Input
										value={formValues.childname}
										nativeID="childname"
										style={[styles.inputAligned, styles.inputShadow]}
										onChangeText={(text: string) => setFormValues((prev) => ({ ...prev, childname: text }))}
									/>
								</View>
								<View style={styles.formRowAligned}>
									<Label style={styles.label} nativeID="toyname">Toy Name:</Label>
									<Input
										value={formValues.toyname}
										nativeID="toyname"
										style={[styles.inputAligned, styles.inputShadow]}
										onChangeText={(text: string) => setFormValues((prev) => ({ ...prev, toyname: text }))}
									/>
								</View>
								<View style={styles.formRowAligned}>
									<Label style={styles.label} nativeID="age">Age:</Label>
									<View style={[styles.ageInputContainerAligned, styles.inputShadow]}>
										<Input
											value={formValues.age?.toString() || ''}
											keyboardType="numeric"
											placeholder="Eg.24"
											style={styles.ageInputAligned}
											editable={true}
											onChangeText={(text: string) => {
												if (text === '45+') {
													setFormValues((prev) => ({ ...prev, age: '45+' }));
												} else {
													const ageNum = parseInt(text);
													if (text === '' || (ageNum >= 1 && ageNum <= 45)) {
														setFormValues((prev) => ({ ...prev, age: text === '' ? null : ageNum }));
													}
												}
											}}
										/>
										<Pressable style={styles.ageDropdown} onPress={() => setAgePickerVisible(true)}>
											<ArrowDownIcon />
										</Pressable>
									</View>
								</View>
								<View style={styles.formRowAligned}>
									<Label style={[styles.label, styles.genderLabel]} nativeID="gender">Gender:</Label>
									<View style={styles.genderButtonsAligned}>
										<Pressable style={[styles.genderButton, styles.inputShadow, formValues.gender === 'male' && styles.genderButtonActive]} onPress={() => setFormValues((prev) => ({ ...prev, gender: 'male' }))}>
											<MaleIcon width={24} height={24} color={formValues.gender === 'male' ? 'white' : theme.colors.primary} />
										</Pressable>
										<Pressable style={[styles.genderButton, styles.inputShadow, formValues.gender === 'female' && styles.genderButtonActiveFemale]} onPress={() => setFormValues((prev) => ({ ...prev, gender: 'female' }))}>
											<FemaleIcon width={24} height={24} color={formValues.gender === 'female' ? 'white' : '#FF6AFF'} />
										</Pressable>
									</View>
								</View>
								<Button
									style={{ marginTop: 24, backgroundColor: theme.colors.primary, borderRadius: 8 }}
									onPress={async () => {
										try {
											const ageValue = formValues.age === '45+' ? '45+' : (typeof formValues.age === 'string' ? formValues.age : Number(formValues.age));
											const childnameValid = typeof formValues.childname === 'string' && formValues.childname.trim().length > 0;
											const toynameValid = typeof formValues.toyname === 'string' && formValues.toyname.trim().length > 0;
											const ageValid = (typeof ageValue === 'string' && ageValue === '45+') || (typeof ageValue === 'number' && !isNaN(ageValue) && ageValue > 0);
											const genderValid = typeof formValues.gender === 'string' && formValues.gender.trim().length > 0;
											if (!childnameValid || !toynameValid || !ageValid || !genderValid) {
												Alert.alert('Error', 'Please fill in all fields.');
												return;
											}
											const updatedUserData = {
												...auth,
												childname: formValues.childname.trim(),
												toyname: formValues.toyname.trim(),
												gender: formValues.gender.trim(),
												updatedAt: new Date().toISOString(),
											};
											// Only add age to Redux if it's a number
											if (typeof ageValue === 'number') {
												(updatedUserData as any).age = ageValue;
											}
											await updateDoc(doc(db, 'users', auth.uid), {
												childname: formValues.childname.trim(),
												toyname: formValues.toyname.trim(),
												age: ageValue,
												gender: formValues.gender.trim(),
												updatedAt: new Date().toISOString(),
											});
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
							<View style={styles.languageContainer}>
								{isLanguageUpdating && (
									<View style={styles.languageLoadingContainer}>
										<ActivityIndicator size="large" color={theme.colors.primary} />
										<Text style={styles.languageLoadingText}>Updating language...</Text>
									</View>
								)}
								<ScrollView 
									showsVerticalScrollIndicator={true}
									contentContainerStyle={styles.languageScrollContent}
									pointerEvents={isLanguageUpdating ? 'none' : 'auto'}
								>
									<View style={styles.languageGrid}>
										{/* English (UK) */}
										<Pressable 
											onPress={() => handleLanguageSelection('English (UK)')} 
											style={[styles.languageItem, isLanguageUpdating && styles.languageItemDisabled]}
											disabled={isLanguageUpdating}
										>
											<View style={styles.languageImageContainer}>
												<Image source={require('../assets/images/english.png')} resizeMode="cover" style={styles.languageImage} />
												{formValues.language !== 'English (UK)' && <View style={styles.languageOverlay} />}
												<View style={[styles.languageCheckbox, formValues.language !== 'English (UK)' && styles.languageCheckboxHidden]}>
													<View style={styles.languageCheckboxInner} />
												</View>
											</View>
											<Text style={styles.languageName}>English (UK)</Text>
										</Pressable>
										{/* English (US) */}
										<Pressable 
											onPress={() => handleLanguageSelection('English (US)')} 
											style={[styles.languageItem, isLanguageUpdating && styles.languageItemDisabled]}
											disabled={isLanguageUpdating}
										>
											<View style={styles.languageImageContainer}>
												<Image source={require('../assets/images/us-english.png')} resizeMode="cover" style={styles.languageImage} />
												{formValues.language !== 'English (US)' && <View style={styles.languageOverlay} />}
												<View style={[styles.languageCheckbox, formValues.language !== 'English (US)' && styles.languageCheckboxHidden]}>
													<View style={styles.languageCheckboxInner} />
												</View>
											</View>
											<Text style={styles.languageName}>English (US)</Text>
										</Pressable>
										{/* Spanish */}
										<Pressable 
											onPress={() => handleLanguageSelection('Spanish')} 
											style={[styles.languageItem, isLanguageUpdating && styles.languageItemDisabled]}
											disabled={isLanguageUpdating}
										>
											<View style={styles.languageImageContainer}>
												<Image source={require('../assets/images/spanish.png')} resizeMode="cover" style={styles.languageImage} />
												{formValues.language !== 'Spanish' && <View style={styles.languageOverlay} />}
												<View style={[styles.languageCheckbox, formValues.language !== 'Spanish' && styles.languageCheckboxHidden]}>
													<View style={styles.languageCheckboxInner} />
												</View>
											</View>
											<Text style={styles.languageName}>Spanish</Text>
										</Pressable>
										{/* German */}
										<Pressable 
											onPress={() => handleLanguageSelection('German')} 
											style={[styles.languageItem, isLanguageUpdating && styles.languageItemDisabled]}
											disabled={isLanguageUpdating}
										>
											<View style={styles.languageImageContainer}>
												<Image source={require('../assets/images/german.png')} resizeMode="cover" style={styles.languageImage} />
												{formValues.language !== 'German' && <View style={styles.languageOverlay} />}
												<View style={[styles.languageCheckbox, formValues.language !== 'German' && styles.languageCheckboxHidden]}>
													<View style={styles.languageCheckboxInner} />
												</View>
											</View>
											<Text style={styles.languageName}>German</Text>
										</Pressable>
										{/* Italian */}
										<Pressable 
											onPress={() => handleLanguageSelection('Italian')} 
											style={[styles.languageItem, isLanguageUpdating && styles.languageItemDisabled]}
											disabled={isLanguageUpdating}
										>
											<View style={styles.languageImageContainer}>
												<Image source={require('../assets/images/italian.png')} resizeMode="cover" style={styles.languageImage} />
												{formValues.language !== 'Italian' && <View style={styles.languageOverlay} />}
												<View style={[styles.languageCheckbox, formValues.language !== 'Italian' && styles.languageCheckboxHidden]}>
													<View style={styles.languageCheckboxInner} />
												</View>
											</View>
											<Text style={styles.languageName}>Italian</Text>
										</Pressable>
										{/* Greek */}
										<Pressable 
											onPress={() => handleLanguageSelection('Greek')} 
											style={[styles.languageItem, isLanguageUpdating && styles.languageItemDisabled]}
											disabled={isLanguageUpdating}
										>
											<View style={styles.languageImageContainer}>
												<Image source={require('../assets/images/greek.png')} resizeMode="cover" style={styles.languageImage} />
												{formValues.language !== 'Greek' && <View style={styles.languageOverlay} />}
												<View style={[styles.languageCheckbox, formValues.language !== 'Greek' && styles.languageCheckboxHidden]}>
													<View style={styles.languageCheckboxInner} />
												</View>
											</View>
											<Text style={styles.languageName}>Greek</Text>
										</Pressable>
										{/* Portuguese */}
										<Pressable 
											onPress={() => handleLanguageSelection('Portuguese')} 
											style={[styles.languageItem, isLanguageUpdating && styles.languageItemDisabled]}
											disabled={isLanguageUpdating}
										>
											<View style={styles.languageImageContainer}>
												<Image source={require('../assets/images/portuguese.png')} resizeMode="cover" style={styles.languageImage} />
												{formValues.language !== 'Portuguese' && <View style={styles.languageOverlay} />}
												<View style={[styles.languageCheckbox, formValues.language !== 'Portuguese' && styles.languageCheckboxHidden]}>
													<View style={styles.languageCheckboxInner} />
												</View>
											</View>
											<Text style={styles.languageName}>Portuguese</Text>
										</Pressable>
										{/* Swedish */}
										<Pressable 
											onPress={() => handleLanguageSelection('Swedish')} 
											style={[styles.languageItem, isLanguageUpdating && styles.languageItemDisabled]}
											disabled={isLanguageUpdating}
										>
											<View style={styles.languageImageContainer}>
												<Image source={require('../assets/images/swedish.png')} resizeMode="cover" style={styles.languageImage} />
												{formValues.language !== 'Swedish' && <View style={styles.languageOverlay} />}
												<View style={[styles.languageCheckbox, formValues.language !== 'Swedish' && styles.languageCheckboxHidden]}>
													<View style={styles.languageCheckboxInner} />
												</View>
											</View>
											<Text style={styles.languageName}>Swedish</Text>
										</Pressable>
										{/* Dutch */}
										<Pressable 
											onPress={() => handleLanguageSelection('Dutch')} 
											style={[styles.languageItem, isLanguageUpdating && styles.languageItemDisabled]}
											disabled={isLanguageUpdating}
										>
											<View style={styles.languageImageContainer}>
												<Image source={require('../assets/images/dutch.png')} resizeMode="cover" style={styles.languageImage} />
												{formValues.language !== 'Dutch' && <View style={styles.languageOverlay} />}
												<View style={[styles.languageCheckbox, formValues.language !== 'Dutch' && styles.languageCheckboxHidden]}>
													<View style={styles.languageCheckboxInner} />
												</View>
											</View>
											<Text style={styles.languageName}>Dutch</Text>
										</Pressable>
									</View>
								</ScrollView>
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
										setFormValues(prev => ({ ...prev, age: item === '45+' ? '45+' : Number(item) }));
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
		backgroundColor: theme.colors.primary + '10',
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
		color: theme.colors.primary,
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
		borderColor: theme.colors.primary + '20',
		zIndex: 2,
	},
	formContainer: {
		marginTop: 10,
		marginHorizontal: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: theme.colors.primary + '20',
		backgroundColor: 'white',
		padding: 16,
		paddingTop: 0,
		shadowColor: theme.colors.primary + '20',
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
		borderBottomColor: theme.colors.primary,
	},
	tabText: {
		fontWeight: '600',
		fontFamily: 'PlusJakartaSans_500Medium',
		fontSize: 14,
		textAlign: 'center',
	},
	tabTextActive: {
		color: theme.colors.primary,
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
	formRowAligned: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 16,
		gap: 20,
},
	label: {
		width: 90,
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
		left: 12,
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
		left: 32,
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
		backgroundColor: theme.colors.primary,
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
		backgroundColor: theme.colors.primary,
	},
	languageContainer: {
		height: 310,
		padding: 16,
	},
	languageScrollContent: {
		flexGrow: 1,
		paddingBottom: 40,
	},
	languageGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-start',
	},
	languageItem: {
		width: '33.33%',
		alignItems: 'center',
		marginBottom: 28,
		paddingHorizontal: 0,
		minWidth: 80,
		maxWidth: 120,
	},
	languageItemDisabled: {
		opacity: 0.7,
	},
	languageImageContainer: {
		position: 'relative',
		borderRadius: 8,
	},
	languageImage: {
		height: 80,
		width: 80,
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
		backgroundColor: theme.colors.primary,
	},
	languageName: {
		fontSize: 14,
		color: '#404040',
		fontFamily: 'PlusJakartaSans_500Medium',
	},
	languageLoadingContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 20,
	},
	languageLoadingText: {
		marginLeft: 10,
		fontSize: 16,
		color: theme.colors.primary,
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
		color: theme.colors.primary,
		fontFamily: 'PlusJakartaSans_400Regular',
	},
	noteBold: {
		fontWeight: 'bold',
		color: theme.colors.primary,
		fontFamily: 'PlusJakartaSans_600SemiBold',
	},
	noteHighlight: {
		color: theme.colors.primary,
		fontFamily: 'PlusJakartaSans_500Medium',
	},
	inputAligned: {
		width: 220,
		marginLeft: 12,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#F2F2F2',
		backgroundColor: 'white',
		fontFamily: 'PlusJakartaSans_400Regular',
		paddingHorizontal: 12,
	},
	ageInputContainerAligned: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 48,
		width: 140,
		borderRadius: 4,
		backgroundColor: 'white',
		marginRight: 24,
	},
	ageInputAligned: {
		width: 100,
		marginLeft: 12,
		borderWidth: 1,
		borderRightWidth: 0,
		borderColor: '#F2F2F2',
		backgroundColor: 'white',
		paddingHorizontal: 12,
		borderTopLeftRadius: 4,
		borderBottomLeftRadius: 4,
		fontFamily: 'PlusJakartaSans_400Regular',
	},
	genderButtonsAligned: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 23,
		left: -20,
	},
	inputUsername: {
		backgroundColor: '#F5F7FA',
		borderColor: '#3664C0',
		left: -72,
	},
})

export default WyloRegistrationScreen;
