/* ──────────────────────────────────────────────────────────── */
/*  Floating bottom menu with working active-bar indicator      */
/*  Expo + React Native                                         */
/* ──────────────────────────────────────────────────────────── */

import { usePathname, useRouter } from 'expo-router';
import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { G, Path } from 'react-native-svg';

/* ────── SVG icons ────── */
interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

const SvgPart = ({
  width = 24,
  height = 24,
  color = 'currentColor',
  d,
}: IconProps & { d: string[] }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <G stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {d.map((p, i) => (
        <Path key={i} d={p} />
      ))}
    </G>
  </Svg>
);

const HomeIcon = (p: IconProps) => (
  <SvgPart
    {...p}
    d={[
      'M9.02 2.84 3.63 7.04C2.73 7.74 2 9.23 2 10.36v7.41C2 20.09 3.89 22 6.21 22h11.58C20.11 22 22 20.09 22 17.78V10.5c0-1.21-.81-2.76-1.8-3.45L14.02 2.72c-1.4-.98-3.65-.93-5 .12Z',
      'M12 18v-3',
    ]}
  />
);

const ChartIcon = (p: IconProps) => (
  <SvgPart
    {...p}
    d={[
      'M6.15 17h12.19C20.24 17 21.24 16 21.24 14.1V2H3.24v12.1C3.25 16 4.25 17 6.15 17Z',
      'M2.25 2h20',
      'M8.25 22 12.25 20v-3',
      'm16.25 22-4-2',
      'm7.75 11 3.15-2.63c.25-.21.58-.15.75.13l1.2 2c.17.28.5.33.75.13L16.75 8',
    ]}
  />
);

const ProfileIcon = (p: IconProps) => (
  <SvgPart
    {...p}
    d={[
      'M12 12c2.76 0 5-2.24 5-5S14.76 2 12 2 7 4.24 7 7s2.24 5 5 5Z',
      'M3 22c0-3.87 3.13-7 7-7h4c3.87 0 7 3.13 7 7',
    ]}
  />
);

const ParentalControlsIcon = (p: IconProps) => (
  <SvgPart
    {...p}
    d={[
      'M12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z',
      'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'
    ]}
  />
);

/* ────── Character avatars ────── */
const characterImages: Record<string, any> = {
  Bear: require('../assets/images/avatar.png'),
  Fluffy: require('../assets/images/pro1.png'),
  Robot: require('../assets/images/pro2.png'),
};

/* ────── Helper: strip `(group)` segments from a pathname ────── */
const stripRouteGroups = (path: string) => path.replace(/\([^)]*\)/g, '');

/* ────── Single menu item ────── */
interface MenuItemProps {
  icon?: React.ComponentType<IconProps>;
  isActive: boolean;
  isProfile?: boolean;
  profileImage?: any;
  onPress: () => void;
}

const MenuItem = memo(
  ({ icon: Icon, isActive, isProfile, profileImage, onPress }: MenuItemProps) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuItem}>
        {/* main icon / avatar */}
        {isProfile ? (
          <Image source={profileImage} style={styles.profilePic} resizeMode="cover" />
        ) : (
          Icon && (
            <Icon
              width={Icon === ParentalControlsIcon ? 25 : 30}
              height={Icon === ParentalControlsIcon ? 25 : 30}
              color={isActive ? '#AE9FFF' : '#C5C5C5'}
            />
          )
        )}
        {/* active indicator */}
        {isActive && <View style={styles.activeBar} />}
      </View>
    </TouchableOpacity>
  ),
);

/* ────── Main floating menu ────── */
export const FloatingMenu = memo(() => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  /* resolve current path (w/out query + group segments) */
  const rawPathname = usePathname().split('?')[0];
  const pathname = stripRouteGroups(rawPathname);

  /* user-selected avatar */
  const [avatar, setAvatar] = useState<'Bear' | 'Fluffy' | 'Robot'>('Bear');
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('selectedCharacter');
      if (stored && characterImages[stored]) {
        setAvatar(stored as any);
      }
    })();
  }, []);

  /* tab definitions */
  const tabs = useMemo(
    () => [
      {
        href: '/',
        isActive: (p: string) => p === '/' || p === '/index' || p === '/(private)/' || p === '/(private)/index',
        icon: HomeIcon,
      },
      {
        href: '/reports',
        isActive: (p: string) => p.startsWith('/reports'),
        icon: ChartIcon,
      },
      {
        href: '/parental-controls',
        isActive: (p: string) => p.startsWith('/parental-controls'),
        icon: ParentalControlsIcon,
      },
      {
        href: '/profile',
        isActive: (p: string) => p.startsWith('/profile'),
        isProfile: true,
        profileImage: characterImages[avatar],
      },
    ],
    [avatar],
  );

  /* which tab is active? */
  const activeIdx = tabs.findIndex((t) => t.isActive(pathname));

  /* navigation handler */
  const handlePress = (href: string) => {
    if (pathname !== href) {
      router.replace(href);
    }
  };

  // Hide menu on toy-logs screen
  if (pathname.includes('/toy-logs')) {
    return null;
  }

  /* render */
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {tabs.map((t, i) => (
        <MenuItem
          key={t.href}
          {...t}
          isActive={i === activeIdx}
          onPress={() => handlePress(t.href)}
        />
      ))}
    </View>
  );
});

/* ────── Styles ────── */
const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E6E6E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 999,
  },

  /* each icon wrapper */
  menuItem: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    /* allow the indicator to poke outside on Android */
    overflow: 'visible',
  },

  profilePic: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  /* blue pill at the bottom of active icon */
  activeBar: {
    position: 'absolute',
    bottom: -10,          // sits just outside the main bar
    left: 0,
    right: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#AE9FFF',
  },
});

export default FloatingMenu;
