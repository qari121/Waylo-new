import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Image, Text, View } from 'react-native'
import { Chase } from 'react-native-animated-spinkit'
import Toast from 'react-native-toast-message'
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, useFonts } from '@expo-google-fonts/plus-jakarta-sans'

import * as yup from 'yup'

import { Button } from '@components/ui/button'
import { FormInput } from '@components/ui/input'
import { yupResolver } from '@hookform/resolvers/yup'
import { cn } from 'lib/utils'
import { login } from '@slices/auth'
import { useAppDispatch } from 'hooks'

import LockIcon from 'assets/icons/lock.svg'
import MailIcon from 'assets/icons/mail.svg'

interface LoginForm {
	email: string
	password: string
}
export const LoginScreen = () => {
	const dispatch = useAppDispatch()
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)

	let [fontsLoaded] = useFonts({
		PlusJakartaSans_400Regular,
		PlusJakartaSans_500Medium,
		PlusJakartaSans_600SemiBold,
		PlusJakartaSans_700Bold
	})

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
			Toast.show({ text1: 'Login successful' })
			setIsLoading(false)
			router.replace('/(private)')
		} catch (err: any) {
			Toast.show({ type: 'error', text1: err ?? 'Login Failed' })
			setIsLoading(false)
		}
	}

	if (!fontsLoaded) {
		return (
			<View className="flex-1 items-center justify-center">
				<Chase size={24} color="#CBC0FE" />
				<Text>Loading...</Text>
			</View>
		)
	}

	return (
		<View className="relative flex flex-col items-center">
			<Image
				source={require('assets/images/dark-blue-rectangle.png')}
				className="absolute left-0 top-0 -z-10"
			/>
			<Image
				source={require('assets/images/light-blue-rectangle.png')}
				className="absolute left-[15%] top-0 -z-20"
			/>
			<Image
				source={require('assets/images/logo-2.png')}
				className="mt-24"
				style={{ width: 246, height: 118 }}
			/>
			<View className="mt-12 flex w-full flex-col items-center justify-center self-stretch web:mx-auto md:web:w-3/4">
				<Text className="text-2xl text-black" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>Welcome back!</Text>
				<Text className="mt-[18px] text-sm text-muted-foreground" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>
					Log in to existing Wylo account
				</Text>
				<View className="native:w-10/12 mx-auto mt-[50px] flex w-10/12 flex-col self-stretch lg:web:w-1/3">
					<View>
						<View className="relative flex items-center">
							<FormInput
								placeholder="Email"
								control={form.control}
								name="email"
								className={cn('pl-14', {
									'native:!border-red-500 web:!ring-red-500': !!form.formState.errors.email
								})}
							/>
							<View className="absolute left-6 top-1/2 shrink-0 -translate-y-1/2">
								<MailIcon width={14} height={14} />
							</View>
						</View>
						{form.formState.errors.email && (
							<Text className="mt-1 text-xs text-red-500" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>
								{form.formState.errors.email.message}
							</Text>
						)}
					</View>

					<View className="mt-[25px]">
						<View className="relative flex items-center">
							<FormInput
								placeholder="Password"
								control={form.control}
								secureTextEntry
								name="password"
								className={cn('pl-14', {
									'native:!border-red-500 web:!ring-red-500': !!form.formState.errors.password
								})}
							/>
							<View className="absolute left-6 top-1/2 -translate-y-1/2">
								<LockIcon width={13} height={13} />
							</View>
						</View>
						{form.formState.errors.password && (
							<Text className="mt-1 text-xs text-red-500" style={{ fontFamily: 'PlusJakartaSans_400Regular' }}>
								{form.formState.errors.password.message}
							</Text>
						)}
					</View>

					<Text className="mt-2 text-right text-sm font-medium text-muted-foreground" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
						Forgot Password?
					</Text>
					<Button
						onPress={form.handleSubmit(onSubmit)}
						style={{ elevation: 5, boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)' }}
						className="mx-auto mt-8 flex w-fit flex-row items-center gap-1 uppercase">
						{isLoading && <Chase size={16} color="white" />}
						<Text className="text-white" style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}>{isLoading ? 'Please Wait...' : 'Log In'}</Text>
					</Button>
					<Text className="mt-12 text-center text-sm font-medium text-muted-foreground" style={{ fontFamily: 'PlusJakartaSans_500Medium' }}>
						Don&apos;t have an account?{' '}
						<Link href="/register" className="font-bold text-black web:cursor-pointer" style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>
							Sign up
						</Link>
					</Text>
				</View>
			</View>
		</View>
	)
}
