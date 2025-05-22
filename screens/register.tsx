import { Link, useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'
import { Image, ScrollView, Text, View } from 'react-native'
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
		<ScrollView
			horizontal={false}
			bounces={false}
			showsVerticalScrollIndicator
			showsHorizontalScrollIndicator={false}>
			<View className="relative flex flex-col items-center pb-14">
				<Image
					source={require('../assets/images/dark-blue-rectangle.png')}
					className="absolute left-0 top-0 -z-10"
				/>
				<Image
					source={require('../assets/images/light-blue-rectangle.png')}
					className="absolute left-[15%] top-0 -z-20"
				/>

				<View className="mt-[120px] flex w-full flex-col items-center justify-center self-stretch web:mx-auto md:web:w-3/4">
					<Text className="text-2xl font-bold text-black">Let’s Get Started!</Text>
					<Text className="text-sm text-muted-foreground">
						Create an account on Wylo to get all features
					</Text>
					<View className="native:w-10/12 mx-auto mt-[30px] flex w-10/12 flex-col self-stretch lg:web:w-1/3">
						<View>
							<View className="relative flex items-center">
								<FormInput
									placeholder="First Name"
									control={form.control}
									name="firstName"
									className={cn('pl-14', {
										'native:!border-red-500 web:!ring-red-500': !!form.formState.errors.firstName
									})}
								/>
								<View className="absolute left-6 top-1/2 shrink-0 -translate-y-1/2">
									<UserIcon width={14} height={14} />
								</View>
							</View>
							{form.formState.errors.firstName && (
								<Text className="mt-1 text-xs text-red-500">
									{form.formState.errors.firstName.message}
								</Text>
							)}
						</View>

						<View>
							<View className="relative mt-7 flex items-center">
								<FormInput
									placeholder="Last Name"
									name="lastName"
									control={form.control}
									className={cn('pl-14', {
										'native:!border-red-500 web:!ring-red-500': !!form.formState.errors.lastName
									})}
								/>
								<View className="absolute left-6 top-1/2 shrink-0 -translate-y-1/2">
									<UserIcon width={14} height={14} />
								</View>
							</View>
							{form.formState.errors.lastName && (
								<Text className="mt-1 text-xs text-red-500">
									{form.formState.errors.lastName.message}
								</Text>
							)}
						</View>

						<View>
							<View className="relative mt-7 flex items-center">
								<FormInput
									placeholder="Username"
									name="username"
									control={form.control}
									className={cn('pl-14', {
										'native:!border-red-500 web:!ring-red-500': !!form.formState.errors.username
									})}
								/>
								<View className="absolute left-6 top-1/2 shrink-0 -translate-y-1/2">
									<UserIcon width={14} height={14} />
								</View>
							</View>
							{form.formState.errors.username && (
								<Text className="mt-1 text-xs text-red-500">
									{form.formState.errors.username.message}
								</Text>
							)}
						</View>

						<View className="mt-7">
							<View className="relative flex items-center">
								<FormInput
									placeholder="Email"
									name="email"
									control={form.control}
									className={cn('pl-14', {
										'native:!border-red-500 web:!ring-red-500': !!form.formState.errors.email
									})}
								/>
								<View className="absolute left-6 top-1/2 shrink-0 -translate-y-1/2">
									<MailIcon width={13} height={13} />
								</View>
							</View>
							{form.formState.errors.email && (
								<Text className="mt-1 text-xs text-red-500">
									{form.formState.errors.email.message}
								</Text>
							)}
						</View>

						<View className="mt-7">
							<View className="relative flex items-center">
								<FormInput
									placeholder="Password"
									name="password"
									secureTextEntry
									control={form.control}
									className={cn('pl-14', {
										'native:!border-red-500 web:!ring-red-500': !!form.formState.errors.password
									})}
								/>
								<View className="absolute left-6 top-1/2 shrink-0 -translate-y-1/2">
									<LockIcon width={13} height={13} />
								</View>
							</View>
							{form.formState.errors.password && (
								<Text className="mt-1 text-xs text-red-500">
									{form.formState.errors.password.message}
								</Text>
							)}
						</View>

						<View className="mt-7">
							<View className="relative flex items-center">
								<FormInput
									placeholder="Confirm Password"
									name="confirmPassword"
									secureTextEntry
									control={form.control}
									className={cn('pl-14', {
										'native:!border-red-500 web:!ring-red-500':
											!!form.formState.errors.confirmPassword
									})}
								/>
								<View className="absolute left-6 top-1/2 shrink-0 -translate-y-1/2">
									<LockIcon width={13} height={13} />
								</View>
							</View>
							{form.formState.errors.confirmPassword && (
								<Text className="mt-1 text-xs text-red-500">
									{form.formState.errors.confirmPassword.message}
								</Text>
							)}
						</View>

						<Button
							style={{ elevation: 5, boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)' }}
							onPress={form.handleSubmit(onSubmit)}
							className="mx-auto mt-8 flex w-fit flex-row items-center gap-1 uppercase">
							{isLoading && <Chase size={16} color="white" />}
							<Text className="text-white">{isLoading ? 'Please Wait...' : 'Create'}</Text>
						</Button>
						<View className="mt-12">
							<Text className="text-center text-muted-foreground">
								Already have an account?{' '}
								<Link href="/login">
									<Text className="font-bold text-black web:cursor-pointer">Login here</Text>
								</Link>
							</Text>
						</View>
					</View>
				</View>
			</View>
		</ScrollView>
	)
}
