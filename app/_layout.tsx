// app/_layout.tsx
console.log('[LAYOUT] Promise is', global.Promise?.name ?? global.Promise);

import 'react-native-reanimated';
import '../global.css';

import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import * as React from 'react';
import { Platform, ActivityIndicator, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import Toast from 'react-native-toast-message';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NAV_THEME } from 'lib/constants';
import { useColorScheme } from 'lib/useColorScheme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import store from '../store';

// Better navigation perf
enableScreens(true);

const LIGHT_THEME: Theme = {
  ...DefaultTheme,
  colors: NAV_THEME.light,
};
const DARK_THEME: Theme = {
  ...DarkTheme,
  colors: NAV_THEME.dark,
};

export { ErrorBoundary } from 'expo-router';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}

const persistor = persistStore(store);

export default function RootLayout() {
  const { isDarkColorScheme } = useColorScheme();

  // Web-only tweak — no need to block first render
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.classList.add('bg-white');
    }
  }, []);

  return (
    <PersistGate loading={<LoadingScreen />} persistor={persistor}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            <ThemeProvider
              value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}
            >
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' },
                  animation: Platform.select({
                    ios: 'default',
                    android: 'none',
                  }),
                  presentation: 'card',
                  orientation: 'portrait',
                  gestureEnabled: Platform.OS === 'ios',
                  fullScreenGestureEnabled: false,
                  freezeOnBlur: true,
                  autoHideHomeIndicator: true,
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="(private)"
                  options={{
                    headerShown: false,
                    animation: Platform.select({
                      ios: 'default',
                      android: 'none',
                    }),
                  }}
                />
                <Stack.Screen
                  name="(public)"
                  options={{
                    headerShown: false,
                    animation: Platform.select({
                      ios: 'default',
                      android: 'none',
                    }),
                  }}
                />
              </Stack>
              <PortalHost />
              <Toast />
            </ThemeProvider>
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </PersistGate>
  );
}
