import { Link, useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { Image, ScrollView, Text, View, StyleSheet, Platform, SafeAreaView, StatusBar } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import Toast from 'react-native-toast-message'

import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import { Button } from '../components/ui/button'
import { FormInput } from '../components/ui/input'
import { cn } from '../lib/utils'
import { register } from '../slices/auth'
import { useAppDispatch } from '../hooks'

import LockIcon from '../assets/icons/lock.svg'
import MailIcon from '../assets/icons/mail.svg'
import UserIcon from '../assets/icons/user.svg'
import { useState } from 'react'

export interface SignupForm {
	firstName: string
	lastName: string
	username: string
	email: string
	password: string
	confirmPassword: string
}
export const RegisterScreen = () => {
	const dispatch = useAppDispatch()
	const router = useRouter()

	const [isLoading, setIsLoading] = useState(false)

	const schema = yup.object<SignupForm>().shape({
		firstName: yup.string().required('First name is required'),
		lastName: yup.string().required('Last name is required'),
		username: yup.string().required('Username is required'),
		email: yup.string().required('Email is required').email('Enter a valid email'),
		password: yup.string().required('Password is required'),
		confirmPassword: yup
			.string()
			.required('Confirm password is required')
			.oneOf([yup.ref('password'), ''], 'Passwords must match')
	})

	const form = useForm<SignupForm>({
		resolver: yupResolver(schema),
		defaultValues: {
			firstName: '',
			lastName: '',
			username: '',
			email: '',
			password: '',
			confirmPassword: ''
		},
		mode: 'all'
	})

	const onSubmit = async (data: SignupForm) => {
		setIsLoading(true)
		try {
			await dispatch(register(data)).unwrap()
			Toast.show({ text1: 'Registration successfull' })
			setIsLoading(false)
			router.push('/login')
		} catch (err: any) {
			Toast.show({ type: 'error', text1: err ?? 'Registration Failed' })
			setIsLoading(false)
		}
	}

	return (
		<ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
			<StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
			<View style={styles.container}>
				<Image
					source={require('../assets/images/dark-blue-rectangle.png')}
					style={styles.darkBlueRectangle}
				/>
				<Image
					source={require('../assets/images/light-blue-rectangle.png')}
					style={styles.lightBlueRectangle}
				/>
				<View style={styles.contentContainer}>
					<Text style={[styles.title, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Let's Get Started!</Text>
					<Text style={[styles.subtitle, { fontFamily: 'PlusJakartaSans_400Regular' }]}>Create an account on Wylo to get all features</Text>
					<View style={styles.formContainer}>
						<View style={[styles.inputWrapper, { marginBottom: 16 }]}>
							<FormInput
								placeholder="First Name"
								control={form.control}
								name="firstName"
								style={[styles.input, styles.inputWithIcon, form.formState.errors.firstName && styles.inputError]}
							/>
							<View style={styles.iconContainer}><UserIcon width={14} height={14} /></View>
						</View>
						{form.formState.errors.firstName && (
							<Text style={styles.errorText}>{form.formState.errors.firstName.message}</Text>
						)}
						<View style={[styles.inputWrapper, { marginBottom: 16 }]}>
							<FormInput
								placeholder="Last Name"
								name="lastName"
								control={form.control}
								style={[styles.input, styles.inputWithIcon, form.formState.errors.lastName && styles.inputError]}
							/>
							<View style={styles.iconContainer}><UserIcon width={14} height={14} /></View>
						</View>
						{form.formState.errors.lastName && (
							<Text style={styles.errorText}>{form.formState.errors.lastName.message}</Text>
						)}
						<View style={[styles.inputWrapper, { marginBottom: 16 }]}>
							<FormInput
								placeholder="Username"
								name="username"
								control={form.control}
								style={[styles.input, styles.inputWithIcon, form.formState.errors.username && styles.inputError]}
							/>
							<View style={styles.iconContainer}><UserIcon width={14} height={14} /></View>
						</View>
						{form.formState.errors.username && (
							<Text style={styles.errorText}>{form.formState.errors.username.message}</Text>
						)}
						<View style={[styles.inputWrapper, { marginBottom: 16 }]}>
							<FormInput
								placeholder="Email"
								name="email"
								control={form.control}
								style={[styles.input, styles.inputWithIcon, form.formState.errors.email && styles.inputError]}
							/>
							<View style={styles.iconContainer}><MailIcon width={13} height={13} /></View>
						</View>
						{form.formState.errors.email && (
							<Text style={styles.errorText}>{form.formState.errors.email.message}</Text>
						)}
						<View style={[styles.inputWrapper, { marginBottom: 16 }]}>
							<FormInput
								placeholder="Password"
								name="password"
								secureTextEntry
								control={form.control}
								style={[styles.input, styles.inputWithIcon, form.formState.errors.password && styles.inputError]}
							/>
							<View style={styles.iconContainer}><LockIcon width={13} height={13} /></View>
						</View>
						{form.formState.errors.password && (
							<Text style={styles.errorText}>{form.formState.errors.password.message}</Text>
						)}
						<View style={[styles.inputWrapper, { marginBottom: 24 }]}>
							<FormInput
								placeholder="Confirm Password"
								name="confirmPassword"
								secureTextEntry
								control={form.control}
								style={[styles.input, styles.inputWithIcon, form.formState.errors.confirmPassword && styles.inputError]}
							/>
							<View style={styles.iconContainer}><LockIcon width={13} height={13} /></View>
						</View>
						{form.formState.errors.confirmPassword && (
							<Text style={styles.errorText}>{form.formState.errors.confirmPassword.message}</Text>
						)}
						<Button
							style={styles.submitButton}
							onPress={form.handleSubmit(onSubmit)}>
							{isLoading && <Chase size={16} color="white" />}
							<Text style={styles.submitButtonText}>
								{isLoading ? 'Please Wait...' : 'Create'}
							</Text>
						</Button>
					</View>
				</View>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'center',
		paddingBottom: 56,
		paddingHorizontal: -15,
		position: 'relative',
	},
	darkBlueRectangle: {
		position: 'absolute',
		left: 0,
		top: 0,
		zIndex: -10,
	},
	lightBlueRectangle: {
		position: 'absolute',
		left: '15%',
		top: 0,
		zIndex: -20,
	},
	contentContainer: {
		marginTop: 120,
		width: '100%',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'stretch',
		...(Platform.OS === 'web' && {
			marginHorizontal: 'auto',
			width: '75%',
		}),
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: 'black',
	},
	subtitle: {
		fontSize: 14,
		color: '#9A9A9A',
	},
	formContainer: {
		marginTop: 30,
		width: '83.333333%',
		flexDirection: 'column',
		alignSelf: 'stretch',
		...(Platform.OS === 'web' && {
			width: '33.333333%',
		}),
	},
	inputWrapper: {
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'center',
		width: '95%',
		marginLeft: 40,
		marginBottom: 0,
	},
	input: {
		flex: 1,
		borderWidth: 0,
		backgroundColor: '#F2F2F2',
	},
	inputWithIcon: {
		paddingLeft: 56,
	},
	inputError: {
		borderColor: 'red',
		...(Platform.OS === 'web' && {
			ringColor: 'red',
		}),
	},
	iconContainer: {
		position: 'absolute',
		left: 24,
		top: '50%',
		transform: [{ translateY: -7 }],
		flexShrink: 0,
	},
	inputSpacing: {
		marginTop: 28,
	},
	errorText: {
		marginTop: 4,
		fontSize: 12,
		color: 'red',
	},
	submitButton: {
		marginTop: 32,
		marginHorizontal: 'auto',
		width: '50%',
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#AE9FFF',
		gap: 4,
		marginLeft: 130,
		textTransform: 'uppercase',
	},
	submitButtonText: {
		color: 'white',
		textTransform: 'uppercase',
	},
})
