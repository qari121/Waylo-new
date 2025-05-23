import '../global.css'

import { DarkTheme, DefaultTheme, Theme, ThemeProvider } from '@react-navigation/native'
import { PortalHost } from '@rn-primitives/portal'
import { Slot } from 'expo-router'
import * as React from 'react'
import { Platform } from 'react-native'
import Toast from 'react-native-toast-message'
import { Provider } from 'react-redux'
import { persistStore } from 'redux-persist'
import { PersistGate } from 'redux-persist/integration/react'

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { NAV_THEME } from '@lib/constants'
import { useColorScheme } from '@lib/useColorScheme'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import store from 'store'

const LIGHT_THEME: Theme = {
	...DefaultTheme,
	colors: NAV_THEME.light
}
const DARK_THEME: Theme = {
	...DarkTheme,
	colors: NAV_THEME.dark
}

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary
} from 'expo-router'

export default function RootLayout() {
	const persistor = persistStore(store)

	const hasMounted = React.useRef(false)
	const { isDarkColorScheme } = useColorScheme()
	const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false)

	useIsomorphicLayoutEffect(() => {
		if (hasMounted.current) {
			return
		}

		if (Platform.OS === 'web') {
			// Adds the background color to the html element to prevent white background on overscroll.
			document.documentElement.classList.add('bg-white')
		}
		setIsColorSchemeLoaded(true)
		hasMounted.current = true
	}, [])

	if (!isColorSchemeLoaded) {
		return null
	}

	return (
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<GestureHandlerRootView className="flex-1">
					<BottomSheetModalProvider>
						<ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>
							<Slot />
							<PortalHost />
							<Toast />
						</ThemeProvider>
					</BottomSheetModalProvider>
				</GestureHandlerRootView>
			</PersistGate>
		</Provider>
	)
}

const useIsomorphicLayoutEffect =
	Platform.OS === 'web' && typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect
