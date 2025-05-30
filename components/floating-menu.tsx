import { usePathname, useRouter } from 'expo-router'
import React, { memo, useMemo, useEffect, useRef, useState } from 'react'
import { Image, Platform, View, ViewStyle, StyleSheet, TouchableOpacity } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Svg, { G, Path } from 'react-native-svg'
import ActiveIndicatorIcon from '../assets/icons/active-indicator.svg'

interface IconProps {
  width?: number
  height?: number
  color?: string
}

interface MenuItemProps {
  icon?: React.ComponentType<IconProps>
  isActive: boolean
  isProfile?: boolean
  profileImage?: any
  onPress: () => void
}

const activeIndicatorStyle: ViewStyle = Platform.OS !== 'web'
  ? { bottom: -13, position: 'absolute', transform: [{ translateX: 2 }] }
  : {}

const characterImages: Record<string, any> = {
  Bear: require('../assets/images/avatar.png'),
  Fluffy: require('../assets/images/pro1.png'),
  Robot: require('../assets/images/pro2.png'),
}

const MenuItem = memo(
  ({ icon: Icon, isActive, isProfile = false, profileImage, onPress }: MenuItemProps) => (
    <TouchableOpacity onPress={onPress} disabled={isActive} activeOpacity={0.7}>
      <View style={styles.menuItemContainer}>
        {isProfile ? (
          <Image
            source={profileImage || characterImages.Bear}
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
    </TouchableOpacity>
  )
)

export const FloatingMenu = memo(() => {
  const pathname = usePathname()
  const router = useRouter()
  const [selectedCharacter, setSelectedCharacter] = useState('Bear')
  const [currentTab, setCurrentTab] = useState(0)

  const menuItems = useMemo(
    () => [
      { href: '/', icon: HomeIcon },
      { href: '/reports', icon: PresentationChartIcon },
      { href: '/profile', isProfile: true, profileImage: characterImages[selectedCharacter] }
    ],
    [selectedCharacter]
  )

  useEffect(() => {
    const loadSelectedCharacter = async () => {
      const saved = await AsyncStorage.getItem('selectedCharacter')
      if (saved && characterImages[saved]) setSelectedCharacter(saved)
    }
    loadSelectedCharacter()
  }, [])

  useEffect(() => {
    const idx = menuItems.findIndex(item => item.href === pathname)
    if (idx !== -1) setCurrentTab(idx)
  }, [pathname, menuItems])

  const handleTabPress = (newIndex: number, href: string) => {
    let direction: 'left' | 'right' = 'left'
    if (newIndex < currentTab) {
      direction = 'right'
    } else if (newIndex > currentTab) {
      direction = 'left'
    }
    router.replace(`${href}?direction=${direction}`)
  }

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
      {menuItems.map((item, index) => (
        <MenuItem
          key={item.href}
          icon={item.icon}
          isActive={pathname === item.href}
          isProfile={item.isProfile}
          profileImage={item.profileImage}
          onPress={() => handleTabPress(index, item.href)}
        />
      ))}
    </View>
  )
})

const HomeIcon = memo(({ width = 24, height = 24, color = 'currentColor' }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <G>
      <Path
        d="M9.02 2.84004L3.63 7.04004C2.73 7.74004 2 9.23004 2 10.36V17.77C2 20.09 3.89 21.99 6.21 21.99H17.79C20.11 21.99 22 20.09 22 17.78V10.5C22 9.29004 21.19 7.74004 20.2 7.05004L14.02 2.72004C12.62 1.74004 10.37 1.79004 9.02 2.84004Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 17.99V14.99"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  </Svg>
))

const PresentationChartIcon = memo(({ width = 24, height = 24, color = 'currentColor' }: IconProps) => (
  <Svg width={width} height={height} viewBox="0 0 25 24" fill="none">
    <G>
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
  </Svg>
))

const styles = StyleSheet.create({
  floatingMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 70,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    overflow: 'hidden',
    borderRadius: 0,
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 12,
    paddingTop: 6,
    zIndex: 100,
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItemContainer: {
    position: 'relative',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 0,
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  activeIndicatorIcon: {
    zIndex: 10,
  },
})

export default FloatingMenu
