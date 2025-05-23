import { Link, usePathname } from 'expo-router'
import { memo, useMemo } from 'react'
import { Image, Platform, View, ViewStyle, StyleSheet } from 'react-native'
import Svg, { G, Path } from 'react-native-svg'

import ActiveIndicatorIcon from '../assets/icons/active-indicator.svg'

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
			<View style={styles.menuItemContainer}>
				{isProfile ? (
					<Image
						source={require('../assets/images/avatar.png')}
						style={styles.profileImage}
						resizeMode="cover"
					/>
				) : Icon && (
					<Icon width={30} height={30} color={isActive ? '#416EC8' : '#C5C5C5'} />
				)}
				{isActive && (
					<ActiveIndicatorIcon
						style={[activeIndicatorStyle, styles.activeIndicatorIcon]}
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
		{ href: '/qr-code', icon: QRCodeScanIcon },
		{ href: '/notifications', icon: BellIcon },
		{ href: '/profile', isProfile: true }
	], [])

	return (
		<View
			style={[
				{
					elevation: 5,
					boxShadow: '0px 5px 7px 0px rgba(0, 0, 0, 0.19)',
				},
				styles.floatingMenu
			]}
		>
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

const styles = StyleSheet.create({
	floatingMenu: {
		position: 'absolute',
		bottom: 24,
		left: '50%',
		width: 316,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		overflow: 'hidden',
		borderRadius: 20,
		backgroundColor: 'white',
		paddingHorizontal: 32, // px-8 (8*4)
		paddingVertical: 12, // py-3 (3*4)
		transform: [{ translateX: -158 }], // -translate-x-1/2 of width 316
		zIndex: 100,
	},
	menuItemContainer: {
		position: 'relative',
		flexDirection: 'column',
		alignItems: 'center',
	},
	profileImage: {
		width: 30,
		height: 30,
		borderRadius: 15,
	},
	activeIndicatorIcon: {
		zIndex: 10,
		// For web: bottom: -14, left: '50%', transform: [{ translateX: -0.5 }]
	},
});

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

const QRCodeScanIcon = memo(({ width = 24, height = 24, color = 'currentColor' }: IconProps) => {
	return (
		<Svg width={width} height={height} viewBox="0 0 25 24" fill="none">
			<G id="Icodfn">
				<Path
					id="qrcode-scan"
					fillRule="evenodd"
					clipRule="evenodd"
					d="M8.5 21H4.5C3.94772 21 3.5 20.5523 3.5 20V16C3.5 15.4477 3.05228 15 2.5 15C1.94772 15 1.5 15.4477 1.5 16V20C1.5 21.6569 2.84315 23 4.5 23H8.5C9.05228 23 9.5 22.5523 9.5 22C9.5 21.4477 9.05228 21 8.5 21ZM22.5 15C21.9477 15 21.5 15.4477 21.5 16V20C21.5 20.5523 21.0523 21 20.5 21H16.5C15.9477 21 15.5 21.4477 15.5 22C15.5 22.5523 15.9477 23 16.5 23H20.5C22.1569 23 23.5 21.6569 23.5 20V16C23.5 15.4477 23.0523 15 22.5 15ZM20.5 1H16.5C15.9477 1 15.5 1.44772 15.5 2C15.5 2.55228 15.9477 3 16.5 3H20.5C21.0523 3 21.5 3.44772 21.5 4V8C21.5 8.55228 21.9477 9 22.5 9C23.0523 9 23.5 8.55228 23.5 8V4C23.5 2.34315 22.1569 1 20.5 1ZM2.5 9C3.05228 9 3.5 8.55228 3.5 8V4C3.5 3.44772 3.94772 3 4.5 3H8.5C9.05228 3 9.5 2.55228 9.5 2C9.5 1.44772 9.05228 1 8.5 1H4.5C2.84315 1 1.5 2.34315 1.5 4V8C1.5 8.55228 1.94772 9 2.5 9ZM10.5 5H6.5C5.94772 5 5.5 5.44772 5.5 6V10C5.5 10.5523 5.94772 11 6.5 11H10.5C11.0523 11 11.5 10.5523 11.5 10V6C11.5 5.44772 11.0523 5 10.5 5ZM9.5 9H7.5V7H9.5V9ZM14.5 11H18.5C19.0523 11 19.5 10.5523 19.5 10V6C19.5 5.44772 19.0523 5 18.5 5H14.5C13.9477 5 13.5 5.44772 13.5 6V10C13.5 10.5523 13.9477 11 14.5 11ZM15.5 7H17.5V9H15.5V7ZM10.5 13H6.5C5.94772 13 5.5 13.4477 5.5 14V18C5.5 18.5523 5.94772 19 6.5 19H10.5C11.0523 19 11.5 18.5523 11.5 18V14C11.5 13.4477 11.0523 13 10.5 13ZM9.5 17H7.5V15H9.5V17ZM14.5 16C15.0523 16 15.5 15.5523 15.5 15C16.0523 15 16.5 14.5523 16.5 14C16.5 13.4477 16.0523 13 15.5 13H14.5C13.9477 13 13.5 13.4477 13.5 14V15C13.5 15.5523 13.9477 16 14.5 16ZM18.5 13C17.9477 13 17.5 13.4477 17.5 14V17C16.9477 17 16.5 17.4477 16.5 18C16.5 18.5523 16.9477 19 17.5 19H18.5C19.0523 19 19.5 18.5523 19.5 18V14C19.5 13.4477 19.0523 13 18.5 13ZM14.5 17C13.9477 17 13.5 17.4477 13.5 18C13.5 18.5523 13.9477 19 14.5 19C15.0523 19 15.5 18.5523 15.5 18C15.5 17.4477 15.0523 17 14.5 17Z"
					fill={color}
				/>
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
