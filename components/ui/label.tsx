import * as LabelPrimitive from '@rn-primitives/label'
import * as React from 'react'
import { StyleSheet, Platform, StyleProp, TextStyle, ViewStyle } from 'react-native'

const styles = StyleSheet.create({
	root: {
		// Remove cursor property as it's not needed for native platforms
	},
	text: {
		fontSize: Platform.select({ native: 16, default: 14 }),
		fontWeight: '500',
		lineHeight: Platform.select({ native: 20, default: 16 }),
		color: 'var(--foreground)',
	},
	disabled: {
		opacity: 0.7,
	},
})

interface LabelProps extends Omit<LabelPrimitive.TextProps, 'style'> {
	style?: StyleProp<TextStyle>
	rootStyle?: ViewStyle
}

const Label = React.forwardRef<LabelPrimitive.TextRef, LabelProps>(
	({ style, rootStyle, onPress, onLongPress, onPressIn, onPressOut, ...props }, ref) => (
		<LabelPrimitive.Root
			style={rootStyle}
			onPress={onPress}
			onLongPress={onLongPress}
			onPressIn={onPressIn}
			onPressOut={onPressOut}>
			<LabelPrimitive.Text
				ref={ref}
				style={[styles.text, props.disabled && styles.disabled, style]}
				{...props}
			/>
		</LabelPrimitive.Root>
	)
)

Label.displayName = LabelPrimitive.Root.displayName

export { Label }
