import { registerRootComponent } from 'expo'
import { ExpoRoot } from 'expo-router'
import { Provider } from 'react-redux'
import store from './store'
import { StripeProvider } from '@stripe/stripe-react-native'
import AuthRealtimeListener from './AuthRealtimeListener'

function App() {
	// @ts-ignore
	const ctx = require.context('./app')
	return (
		<StripeProvider publishableKey="pk_test_51RTIXaRt36pEMZd0V8nbpVaXcPt3ERzbVkll7SEh1hfRvV8vEZ22MnKeDbv2fe2DJVTT1HnLQkEqWnNjVXrbnFat000DTzLOos">
			<Provider store={store}>
				<AuthRealtimeListener />
				<ExpoRoot context={ctx} />
			</Provider>
		</StripeProvider>
	)
}

export default App

registerRootComponent(App)
