import { registerRootComponent } from 'expo'
import { ExpoRoot } from 'expo-router'

import './global.css'

export function App() {
	// @ts-ignore
	const ctx = require.context('./app')
	return <ExpoRoot context={ctx} />
}

registerRootComponent(App)
