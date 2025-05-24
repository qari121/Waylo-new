import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Image, Text, View, StyleSheet, Platform } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import Toast from 'react-native-toast-message'

import * as yup from 'yup'

import { Button } from '../components/ui/button'
import { FormInput } from '../components/ui/input'
import { yupResolver } from '@hookform/resolvers/yup'
import { cn } from '../lib/utils'
import { login } from '../slices/auth'
import { useAppDispatch } from '../hooks'

import LockIcon from '../assets/icons/lock.svg'
import MailIcon from '../assets/icons/mail.svg'

// Add Plus Jakarta Sans font imports

interface LoginForm {
	email: string
	password: string
}
export const LoginScreen = () => {
	const dispatch = useAppDispatch()
	const router = useRouter()

	const [isLoading, setIsLoading] = useState(false)

	const schema = yup.object<LoginForm>().shape({
		email: yup.string().required('Email is required').email('Enter a valid email'),
		password: yup.string().required('Password is required')
	})

	const form = useForm<LoginForm>({
		resolver: yupResolver(schema),
		defaultValues: { email: '', password: '' },
		mode: 'all'
	})

	const onSubmit = async (data: LoginForm) => {
		setIsLoading(true)
		try {
			await dispatch(login(data)).unwrap()
			Toast.show({ text1: 'Login successfull' })
			setIsLoading(false)
			router.push('/')
		} catch (err: any) {
			Toast.show({ type: 'error', text1: err ?? 'Login Failed' })
			setIsLoading(false)
		}
	}

	return (
		<View style={styles.container}>
			<Image
				source={require('../assets/images/dark-blue-rectangle.png')}
				style={styles.darkBlueRectangle}
			/>
			<Image
				source={require('../assets/images/light-blue-rectangle.png')}
				style={styles.lightBlueRectangle}
			/>
			<Image
				source={require('../assets/images/logo-2.png')}
				style={styles.logo}
			/>
			<View style={styles.contentContainer}>
				<Text style={[styles.welcomeText, { fontFamily: 'PlusJakartaSans_700Bold' }]}>Welcome back!</Text>
				<Text style={[styles.subtitleText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
					Log in to existing Wylo account
				</Text>
				<View style={styles.formContainer}>
					<View>
						<View style={styles.inputWrapper}>
							<FormInput
								placeholder="Email"
								control={form.control}
								name="email"
								style={[
									styles.input,
									form.formState.errors.email && styles.inputError
								]}
							/>
							<View style={styles.iconContainer}>
								<MailIcon width={14} height={14} />
							</View>
						</View>
						{form.formState.errors.email && (
							<Text style={[styles.errorText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
								{form.formState.errors.email.message}
							</Text>
						)}
					</View>

					<View style={styles.passwordContainer}>
						<View style={styles.inputWrapper}>
							<FormInput
								placeholder="Password"
								control={form.control}
								secureTextEntry
								name="password"
								style={[
									styles.input,
									form.formState.errors.password && styles.inputError
								]}
							/>
							<View style={styles.iconContainer}>
								<LockIcon width={13} height={13} />
							</View>
						</View>
						{form.formState.errors.password && (
							<Text style={[styles.errorText, { fontFamily: 'PlusJakartaSans_400Regular' }]}>
								{form.formState.errors.password.message}
							</Text>
						)}
					</View>

					<Text style={[styles.forgotPassword, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
						Forgot Password?
					</Text>
					<Button
						onPress={form.handleSubmit(onSubmit)}
						style={styles.loginButton}>
						{isLoading && <Chase size={16} color="white" />}
						<Text style={[styles.loginButtonText, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}>
							{isLoading ? 'Please Wait...' : 'Log In'}
						</Text>
					</Button>
					<Text style={[styles.signupText, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
						Don&apos;t have an account?{' '}
						<Link href="/register" style={[styles.signupLink, { fontFamily: 'PlusJakartaSans_700Bold' }]}>
							Sign up
						</Link>
					</Text>
				</View>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		position: 'relative',
		flexDirection: 'column',
		alignItems: 'center',
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
	logo: {
		marginTop: 96, // mt-24 equivalent
		width: 246,
		height: 118,
	},
	contentContainer: {
		marginTop: 48, // mt-12 equivalent
		width: '100%',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'stretch',
		...(Platform.OS === 'web' && {
			marginHorizontal: 'auto',
			'@media (min-width: 768px)': {
				width: '75%',
			},
		}),
	},
	welcomeText: {
		fontSize: 24, // text-2xl
		color: '#000000',
		fontWeight: '600',
		
	},
	subtitleText: {
		marginTop: 18,
		fontSize: 14, // text-sm
		color: '#6B7280', // text-muted-foreground
	},
	formContainer: {
		marginTop: 50,
		width: Platform.OS === 'web' ? '33.333333%' : '83.333333%', // w-10/12 equivalent
		flexDirection: 'column',
		alignSelf: 'stretch',
		marginHorizontal: 'auto',
		...(Platform.OS === 'web' && {
			'@media (min-width: 1024px)': {
				width: '33.333333%',
			},
		}),
	},
	inputWrapper: {
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'center',
	},
	input: {
		paddingLeft: 56, 
		borderWidth: 0,
		backgroundColor: '#F2F2F2',
	},
	inputError: {
		borderColor: '#EF4444', // red-500
		...(Platform.OS === 'web' && {
			boxShadow: '0 0 0 1px #EF4444',
		}),
	},
	iconContainer: {
		position: 'absolute',
		left: 24, // left-6 equivalent
		top: '50%',
		transform: [{ translateY: -7 }], // -translate-y-1/2 equivalent
	},
	errorText: {
		marginTop: 4,
		fontSize: 12, // text-xs
		color: '#EF4444', // text-red-500
	},
	passwordContainer: {
		marginTop: 25,
	},
	forgotPassword: {
		marginTop: 8,
		fontSize: 14, // text-sm
		fontWeight: '500',
		color: '#6B7280', // text-muted-foreground
		textAlign: 'right',
	},
	loginButton: {
		marginTop: 32,
		width: '50%',
		marginHorizontal: 'auto',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		textTransform: 'uppercase',
		backgroundColor: '#AE9FFF',
		elevation: 5,
		...(Platform.OS === 'web' && {
			boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)',
		}),
	},
	loginButtonText: {
		color: '#FFFFFF',
		fontWeight: 'bold',
	},
	signupText: {
		marginTop: 48, // mt-12 equivalent
		fontSize: 14, 
		fontWeight: '500',
		color: '#6B7280', // text-muted-foreground
		textAlign: 'center',
	},
	signupLink: {
		fontWeight: 'bold',
		color: '#000000',
		...(Platform.OS === 'web' && {
			cursor: 'pointer',
		}),
	},
})
