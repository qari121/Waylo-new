import { registerRootComponent } from 'expo'
import { ExpoRoot } from 'expo-router'
import { Provider } from 'react-redux'
import store from './store'

import './global.css'

function App() {
	// @ts-ignore
	const ctx = require.context('./app')
	return (
		<Provider store={store}>
			<ExpoRoot context={ctx} />
		</Provider>
	)
}

export default App

registerRootComponent(App)
