import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'
import { Link, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Image, Platform, Pressable, SafeAreaView, ScrollView, Text, View, StyleSheet, TextInput, Modal, TouchableOpacity, Dimensions, Alert, Linking } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as ImagePicker from 'expo-image-picker'

import { logout } from '../slices/auth'
import { useAppDispatch, useAppSelector } from '../hooks'
import { StorageService, getRealPathFromURI } from '../services/storage-service'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

import CharacterIcon from '../assets/icons/character.svg'
import HelpCircleIcon from '../assets/icons/help-circle.svg'
import LogoutIcon from '../assets/icons/log-out.svg'
import SubscriptionsIcon from '../assets/icons/subscriptions.svg'
import WifiIcon from '../assets/icons/wifi.svg'
import ChevronLeftIcon from '../assets/icons/chevron-left.svg'

// Remove ProfileIcon

interface ProfileItem {
	name: string
	icon: React.ElementType
	href: string
}

const profileItems: ProfileItem[] = [
	{ name: 'Character Management', icon: CharacterIcon, href: '/character-management' },
	{ name: 'Device Pairing', icon: WifiIcon, href: '/qr-code' },
	{ name: 'Subscription', icon: SubscriptionsIcon, href: '/subscription' },
	{ name: 'Support', icon: HelpCircleIcon, href: '/support' }
]

const characterImages: Record<string, any> = {
	Bear: require('../assets/images/avatar.png'),
	Fluffy: require('../assets/images/pro1.png'),
	Robot: require('../assets/images/pro2.png'),
};

const windowHeight = Dimensions.get('window').height;

export const ProfileScreen = () => {
	const router = useRouter()
	const dispatch = useAppDispatch()
	const auth = useAppSelector(state => state.auth) // 👈 get user data from Redux
	const [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
	})
	const [selectedCharacter, setSelectedCharacter] = useState('Bear');
	const [modalVisible, setModalVisible] = useState(false);
	const [profileImage, setProfileImage] = useState<string | null>(null);
	const [editUsername, setEditUsername] = useState(auth?.username || 'User');
	const [displayUsername, setDisplayUsername] = useState(auth?.username || 'User');
	const [saving, setSaving] = useState(false);
	const [uploading, setUploading] = useState(false);

	useEffect(() => {
		const loadProfileData = async () => {
			const saved = await AsyncStorage.getItem('selectedCharacter');
			if (saved && characterImages[saved]) setSelectedCharacter(saved);
			
			// Use Firebase Storage URL if available, otherwise fall back to local storage
			if (auth.profileImageUrl) {
				setProfileImage(auth.profileImageUrl);
			} else {
				const savedImage = await AsyncStorage.getItem('profileImage');
				if (savedImage) setProfileImage(savedImage);
			}
			
			const savedUsername = await AsyncStorage.getItem('profileUsername');
			if (savedUsername) {
				setEditUsername(savedUsername);
				setDisplayUsername(savedUsername);
			}

		};
		loadProfileData();
	}, [auth.profileImageUrl, auth.username]);

	// Fallbacks if username/email are not present
	const username = auth?.username || 'User'
	const email = auth?.email || 'user@email.com'

	const handlePickImage = async () => {
		console.log('handlePickImage called');
		try {
			// Request permissions first
			console.log('Requesting media library permissions...');
			const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
			console.log('Media library permission status:', mediaLibraryStatus);
			
			if (mediaLibraryStatus !== 'granted') {
				Alert.alert(
					'Permission Required', 
					'This app needs access to your photo library to select a profile picture. Please grant permission in your device settings.',
					[
						{ text: 'Cancel', style: 'cancel' },
						{ text: 'Settings', onPress: () => Linking.openSettings() }
					]
				);
				return;
			}

			// Directly launch photo library
			console.log('Launching image library...');
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
				allowsMultipleSelection: false,
			});
			
			console.log('Image picker result:', result);
			
			if (!result.canceled && result.assets && result.assets.length > 0) {
				console.log('Setting profile image:', result.assets[0].uri);
				setProfileImage(result.assets[0].uri);
				
				// Show upload progress
				setUploading(true);
				try {
					// Test Firebase Storage connection first
					const storageConnected = await StorageService.testStorageConnection();
					if (!storageConnected) {
						throw new Error('Firebase Storage connection failed');
					}
					
					// Use getRealPathFromURI to handle iOS ph:// URIs
					const realUri = await getRealPathFromURI(result.assets[0].uri);
					const imageUrl = await StorageService.uploadProfileImage(realUri, auth.uid);
					console.log('Image uploaded successfully:', imageUrl);
					// Update Firestore immediately
					const userRef = doc(db, 'users', auth.uid);
					await updateDoc(userRef, {
						profileImageUrl: imageUrl,
						updatedAt: new Date().toISOString(),
					});
					Alert.alert('Success', 'Profile picture updated successfully!');
				} catch (error) {
					console.error('Error uploading image:', error);
					Alert.alert('Error', `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
				} finally {
					setUploading(false);
				}
			}
		} catch (error) {
			console.error('Image picker error:', error);
			Alert.alert('Error', 'An error occurred while picking the image. Please try again.');
		}
	};

	const handleSaveProfile = async () => {
		setSaving(true);
		try {
			let newProfileImageUrl = auth.profileImageUrl; // Keep existing URL if no new image
			
			// Upload new image to Firebase Storage if selected
			if (profileImage && profileImage !== auth.profileImageUrl) {
				console.log('Uploading new profile image to Firebase Storage...');
				newProfileImageUrl = await StorageService.updateProfileImage(
					profileImage,
					auth.uid,
					auth.profileImageUrl // Delete old image if exists
				);
				console.log('Profile image uploaded successfully:', newProfileImageUrl);
			}
			
			// Update user document in Firestore
			const userRef = doc(db, 'users', auth.uid);
			await updateDoc(userRef, {
				username: editUsername,
				profileImageUrl: newProfileImageUrl,
				updatedAt: new Date().toISOString(),
			});
			
			// Update local storage
			await AsyncStorage.setItem('profileImage', profileImage || '');
			await AsyncStorage.setItem('profileUsername', editUsername);
			
			// Update local state
			setDisplayUsername(editUsername);
			
			Alert.alert('Success', 'Profile updated successfully!');
		} catch (error) {
			console.error('Error saving profile:', error);
			Alert.alert('Error', 'Failed to save profile. Please try again.');
		} finally {
			setSaving(false);
			setModalVisible(false);
		}
	};

	if (!fontsLoaded) {
		return null
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.header}>
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<Pressable onPress={() => router.back()} style={{ marginRight: 12, marginLeft: 12 }}>
							<ChevronLeftIcon width={24} height={24} />
						</Pressable>
						<View style={styles.headerContent}>
							<Pressable onPress={() => setModalVisible(true)} style={styles.profileInfo}>
								<View style={styles.avatarContainer}>
									<Image
										source={auth.profileImageUrl ? { uri: auth.profileImageUrl } : profileImage ? { uri: profileImage } : characterImages[selectedCharacter] || characterImages['Bear']}
										style={styles.avatar}
										resizeMode="cover"
									/>
									<View style={styles.statusIndicator} />
								</View>
								<View style={styles.userInfo}>
									<Text style={[styles.userName, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}> {displayUsername} </Text>
									<Text style={[styles.userEmail, { fontFamily: 'PlusJakartaSans_400Regular' }]}> {email} </Text>
								</View>
							</Pressable>
						</View>
					</View>
				</View>

				{/* Modal for editing profile */}
				<Modal
					visible={modalVisible}
					animationType="fade"
					transparent={true}
					onRequestClose={() => setModalVisible(false)}
				>
					<View style={styles.modalOverlay}>
						<View style={styles.modalContentImproved}>
							<TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
								<Text style={{ fontSize: 22, fontWeight: 'bold' }}>×</Text>
							</TouchableOpacity>
							<ScrollView
								contentContainerStyle={{ alignItems: 'center', paddingBottom: 16 }}
								style={{ maxHeight: windowHeight * 0.7, width: '100%' }}
								showsVerticalScrollIndicator={false}
							>
								<Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold' }}>Edit Profile</Text>
								<TouchableOpacity 
									onPress={handlePickImage} 
									style={[styles.editAvatarContainer, uploading && { opacity: 0.5 }]} 
									activeOpacity={0.7}
									disabled={uploading}
								>
									<Image
										source={auth.profileImageUrl ? { uri: auth.profileImageUrl } : profileImage ? { uri: profileImage } : characterImages[selectedCharacter] || characterImages['Bear']}
										style={styles.editAvatar}
										resizeMode="cover"
									/>
									<Text style={[styles.editAvatarText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
										{uploading ? 'Uploading...' : 'Change Photo'}
									</Text>
								</TouchableOpacity>
								<View style={styles.inputGroup}>
									<Text style={[styles.inputLabel, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>Username</Text>
									<View style={styles.inputBox}>
										<TextInput
											style={[styles.input, { fontFamily: 'PlusJakartaSans_400Regular' }]}
											editable={true}
											onChangeText={setEditUsername}
											value={editUsername}
											placeholder="Enter username"
											autoCapitalize="none"
											returnKeyType="done"
											maxLength={32}
										/>
									</View>
								</View>
								<Pressable onPress={handleSaveProfile} style={styles.saveButton} disabled={saving || uploading}>
									<Text style={[styles.saveButtonText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
										{uploading ? 'Uploading...' : saving ? 'Saving...' : 'Update'}
									</Text>
								</Pressable>
								<Pressable onPress={() => setModalVisible(false)} style={styles.cancelButton}>
									<Text style={[styles.cancelButtonText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>Cancel</Text>
								</Pressable>
							</ScrollView>
						</View>
					</View>
				</Modal>

				<ScrollView
					showsVerticalScrollIndicator={false}
					scrollEnabled
					style={styles.scrollView}
					showsHorizontalScrollIndicator={false}>
					<View style={styles.content}>
						<View style={styles.divider} />

						<View style={styles.menuContainer}>
							{profileItems.map((item: ProfileItem) => (
								<Link href={item.href} key={item.name} asChild>
									<Pressable style={styles.menuItem}>
										<View style={styles.menuItemContent}>
											<item.icon width={20} height={20} style={styles.menuIcon as any} />
											<Text style={[styles.menuText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
												{item.name}
											</Text>
										</View>
									</Pressable>
								</Link>
							))}

							<View style={styles.logoutContainer}>
								<Pressable
									onPress={() => dispatch(logout())}
									style={styles.menuItem}
								>
									<View style={styles.menuItemContent}>
										<LogoutIcon width={20} height={20} style={styles.menuIcon as any} />
										<Text style={[styles.menuText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
											Log out
										</Text>
									</View>
								</Pressable>
							</View>
						</View>
					</View>
				</ScrollView>
			</View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: 'white',
	},
	container: {
		flex: 1,
		backgroundColor: 'white',
	},
	header: {
		width: '100%',
		backgroundColor: 'white',
		zIndex: 1,
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.1,
				shadowRadius: 3,
			},
			android: {
				elevation: 4,
			},
		}),
	},
	headerContent: {
		marginTop: 16,
		paddingHorizontal: 20,
	},
	profileInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 12,
	},
	avatarContainer: {
		position: 'relative',
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
	},
	statusIndicator: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		width: 12,
		height: 12,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: 'white',
		backgroundColor: '#12B76A',
	},
	userInfo: {
		flexDirection: 'column',
	},
	userName: {
		fontSize: 16,
		color: '#101828',
	},
	userEmail: {
		fontSize: 14,
		color: '#475467',
	},
	scrollView: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 20,
	},
	divider: {
		marginTop: 16,
		height: 1,
		width: '100%',
		backgroundColor: '#F2F4F7',
	},
	menuContainer: {
		marginTop: 16,
		flexDirection: 'column',
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 16,
	},
	menuItemContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	menuIcon: {
		color: '#344054',
	},
	menuText: {
		fontSize: 16,
		color: '#344054',
	},
	logoutContainer: {
		marginTop: 8,
	},
	modalOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContentImproved: {
		backgroundColor: 'white',
		padding: 28,
		borderRadius: 18,
		width: '90%',
		maxWidth: 380,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.18,
		shadowRadius: 8,
		elevation: 8,
		position: 'relative',
	},
	closeButton: {
		position: 'absolute',
		top: 20,
		right: 12,
		zIndex: 10,
		backgroundColor: '#f2f2f2',
		borderRadius: 16,
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	editAvatarContainer: {
		alignItems: 'center',
		marginBottom: 16,
		marginTop: 36,
	},
	editAvatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
		marginBottom: 8,
	},
	editAvatarText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	inputGroup: {
		marginBottom: 50,
		marginTop: 36,
		width: '100%',
	},
	inputLabel: {
		fontSize: 14,
		fontWeight: '700',
		marginBottom: 8,
	},
	inputBox: {
		borderWidth: 1,
		borderColor: 'white',
		backgroundColor: '#F8F8F8',
		borderRadius: 12,
		padding: 10,
	},
	input: {
		fontSize: 16,
	},
	saveButton: {
		width: '85%',
		backgroundColor: '#AE9FFF',
		padding: 16,
		borderRadius: 10,
		alignItems: 'center',
		marginBottom: 16,
	},
	saveButtonText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: 'white',
	},
	cancelButton: {
		backgroundColor: '#ccc',
		padding: 16,
		width: '85%',
		borderRadius: 10,
		alignItems: 'center',
	},
	cancelButtonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
})

export default ProfileScreen
