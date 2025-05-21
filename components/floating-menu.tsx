import { Link, usePathname } from 'expo-router'
import { memo, useMemo } from 'react'
import { Image, Platform, View, ViewStyle } from 'react-native'
import Svg, { G, Path } from 'react-native-svg'

import ActiveIndicatorIcon from 'assets/icons/active-indicator.svg'

interface IconProps {
	width?: number
	height?: number
	color?: string
}

interface MenuItemProps {
	href: string
	icon?: React.ComponentType<IconProps>
	isActive: boolean
	isProfile?: boolean
}

const activeIndicatorStyle: ViewStyle = Platform.OS !== 'web'
	? { bottom: -13, position: 'absolute', transform: [{ translateX: 2 }] }
	: {}

const MenuItem = memo(({ href, icon: Icon, isActive, isProfile = false }: MenuItemProps) => {
	return (
		<Link href={href}>
			<View className="relative flex flex-col items-center">
				{isProfile ? (
					<Image
						source={require('assets/images/avatar.png')}
						className="rounded-full"
						resizeMode="cover"
						style={{ width: 30, height: 30 }}
					/>
				) : Icon && (
					<Icon width={30} height={30} color={isActive ? '#416EC8' : '#C5C5C5'} />
				)}
				{isActive && (
					<ActiveIndicatorIcon
						style={activeIndicatorStyle}
						className="absolute z-10 web:!-bottom-3.5 web:left-1/2 web:-translate-x-1/2"
					/>
				)}
			</View>
		</Link>
	)
})

export const FloatingMenu = memo(() => {
	const pathname = usePathname()

	const menuItems = useMemo(() => [
		{ href: '/', icon: HomeIcon },
		{ href: '/reports', icon: PresentationChartIcon },
		{ href: '/notifications', icon: BellIcon },
		{ href: '/profile', isProfile: true }
	], [])

	return (
		<View
			style={{ elevation: 5, boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)' }}
			className="absolute bottom-[24px] left-1/2 flex w-[280px] -translate-x-1/2 flex-row items-center justify-between overflow-hidden rounded-[20px] bg-white px-8 py-3">
			{menuItems.map((item) => (
				<MenuItem
					key={item.href}
					href={item.href}
					icon={item.icon}
					isActive={pathname === item.href}
					isProfile={item.isProfile}
				/>
			))}
		</View>
	)
})

const BellIcon = memo(({ width = 24, height = 24, color = 'currentColor' }: IconProps) => {
	return (
		<Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
			<G id="vuesax/linear/notification-bing">
				<G id="notification-bing">
					<Path
						id="Vector"
						d="M12 6.43994V9.76994"
						stroke={color}
						strokeWidth="1.5"
						strokeMiterlimit="10"
						strokeLinecap="round"
					/>
					<Path
						id="Vector_2"
						d="M12.0199 2C8.3399 2 5.3599 4.98 5.3599 8.66V10.76C5.3599 11.44 5.0799 12.46 4.7299 13.04L3.4599 15.16C2.6799 16.47 3.2199 17.93 4.6599 18.41C9.4399 20 14.6099 20 19.3899 18.41C20.7399 17.96 21.3199 16.38 20.5899 15.16L19.3199 13.04C18.9699 12.46 18.6899 11.43 18.6899 10.76V8.66C18.6799 5 15.6799 2 12.0199 2Z"
						stroke={color}
						strokeWidth="1.5"
						strokeMiterlimit="10"
						strokeLinecap="round"
					/>
					<Path
						id="Vector_3"
						d="M15.3299 18.8199C15.3299 20.6499 13.8299 22.1499 11.9999 22.1499C11.0899 22.1499 10.2499 21.7699 9.64992 21.1699C9.04992 20.5699 8.66992 19.7299 8.66992 18.8199"
						stroke={color}
						strokeWidth="1.5"
						strokeMiterlimit="10"
					/>
				</G>
			</G>
		</Svg>
	)
})

const HomeIcon = memo(({ width = 24, height = 24, color = 'currentColor' }: IconProps) => {
	return (
		<Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
			<G id="vuesax/linear/home-2">
				<G id="home-2">
					<Path
						id="Vector"
						d="M9.02 2.84004L3.63 7.04004C2.73 7.74004 2 9.23004 2 10.36V17.77C2 20.09 3.89 21.99 6.21 21.99H17.79C20.11 21.99 22 20.09 22 17.78V10.5C22 9.29004 21.19 7.74004 20.2 7.05004L14.02 2.72004C12.62 1.74004 10.37 1.79004 9.02 2.84004Z"
						stroke={color}
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<Path
						id="Vector_2"
						d="M12 17.99V14.99"
						stroke={color}
						strokeWidth="1.5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</G>
			</G>
		</Svg>
	)
})

const PresentationChartIcon = memo(({ width = 24, height = 24, color = 'currentColor' }: IconProps) => {
	return (
		<Svg width={width} height={height} viewBox="0 0 25 24" fill="none">
			<G id="vuesax/linear/presention-chart">
				<G id="presention-chart">
					<Path
						d="M6.15024 17H18.3402C20.2402 17 21.2402 16 21.2402 14.1V2H3.24023V14.1C3.25023 16 4.25024 17 6.15024 17Z"
						stroke={color}
						strokeWidth="1.5"
						strokeMiterlimit="10"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<Path
						d="M2.25 2H22.25"
						stroke={color}
						strokeWidth="1.5"
						strokeMiterlimit="10"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<Path
						d="M8.25 22L12.25 20V17"
						stroke={color}
						strokeWidth="1.5"
						strokeMiterlimit="10"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<Path
						d="M16.25 22L12.25 20"
						stroke={color}
						strokeWidth="1.5"
						strokeMiterlimit="10"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
					<Path
						d="M7.75 11L10.9 8.37C11.15 8.16 11.48 8.22 11.65 8.5L12.85 10.5C13.02 10.78 13.35 10.83 13.6 10.63L16.75 8"
						stroke={color}
						strokeWidth="1.5"
						strokeMiterlimit="10"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</G>
			</G>
		</Svg>
	)
})
