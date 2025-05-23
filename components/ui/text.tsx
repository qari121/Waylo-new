import * as Slot from '@rn-primitives/slot'
import type { SlottableTextProps, TextRef } from '@rn-primitives/types'
import * as React from 'react'
import { Text as RNText, StyleSheet, StyleProp, TextStyle, Platform } from 'react-native'

const TextClassContext = React.createContext<string | undefined>(undefined)

interface TextProps extends Omit<SlottableTextProps, 'style'> {
	style?: StyleProp<TextStyle>
}

const Text = React.forwardRef<TextRef, TextProps>(
	({ style, asChild = false, ...props }, ref) => {
		const Component = asChild ? Slot.Text : RNText
		return (
			<Component
				style={[
					styles.text,
					Platform.OS === 'web' && styles.webText,
					style
				]}
				ref={ref}
				{...props}
			/>
		)
	}
)

const styles = StyleSheet.create({
	text: {
		fontSize: 16,
		color: 'var(--foreground)',
	},
	webText: {
		// @ts-ignore - web only property
		userSelect: 'text',
	},
})

Text.displayName = 'Text'

export { Text, TextClassContext }
