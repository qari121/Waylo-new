import * as RadioGroupPrimitive from '@rn-primitives/radio-group'
import * as React from 'react'
import { View, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native'

const styles = StyleSheet.create({
	root: {
		gap: 8,
		...Platform.select({ web: { flexDirection: 'row', flexWrap: 'wrap' } }),
	},
	item: {
		height: Platform.select({ native: 20, default: 16 }),
		width: Platform.select({ native: 20, default: 16 }),
		aspectRatio: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 9999,
		borderWidth: 1,
		borderColor: 'var(--primary)',
	},
	itemDisabled: {
		opacity: 0.5,
	},
	indicator: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	indicatorDot: {
		height: Platform.select({ native: 10, default: 9 }),
		width: Platform.select({ native: 10, default: 9 }),
		aspectRatio: 1,
		borderRadius: 9999,
		backgroundColor: 'var(--primary)',
	},
})

interface RadioGroupProps extends RadioGroupPrimitive.RootProps {
	style?: StyleProp<ViewStyle>
}

interface RadioGroupItemProps extends RadioGroupPrimitive.ItemProps {
	style?: StyleProp<ViewStyle>
}

const RadioGroup = React.forwardRef<RadioGroupPrimitive.RootRef, RadioGroupProps>(
	({ style, ...props }, ref) => (
		<RadioGroupPrimitive.Root style={[styles.root, style]} {...props} ref={ref} />
	)
)
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = React.forwardRef<RadioGroupPrimitive.ItemRef, RadioGroupItemProps>(
	({ style, disabled, ...props }, ref) => (
		<RadioGroupPrimitive.Item
			ref={ref}
			style={[styles.item, disabled && styles.itemDisabled, style]}
			{...props}>
			<RadioGroupPrimitive.Indicator style={styles.indicator}>
				<View style={styles.indicatorDot} />
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	)
)
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
