import * as TabsPrimitive from '@rn-primitives/tabs'
import { TextClassContext } from '../ui/text'
import * as React from 'react'
import { StyleSheet, Platform, StyleProp, ViewStyle, Text } from 'react-native'

const Tabs = TabsPrimitive.Root

const styles = StyleSheet.create({
	list: {
		height: Platform.select({ native: 48, default: 40 }),
		alignItems: 'center',
		justifyContent: 'center',
		...Platform.select({ web: { flexDirection: 'row' } }),
	},
	trigger: {
		fontSize: Platform.select({ native: 16, default: 14 }),
		fontWeight: '500',
	},
	triggerDisabled: {
		opacity: 0.5,
	},
	triggerText: {
		fontSize: Platform.select({ native: 16, default: 14 }),
		fontWeight: '500',
		color: 'var(--muted-foreground)',
	},
	triggerTextActive: {
		color: 'var(--foreground)',
	},
	content: {
		// Add appropriate styles for the content
	},
})

interface TabsListProps extends Omit<TabsPrimitive.ListProps, 'style'> {
	style?: StyleProp<ViewStyle>
}

const TabsList = React.forwardRef<TabsPrimitive.ListRef, TabsListProps>(
	({ style, ...props }, ref) => (
		<TabsPrimitive.List
			ref={ref}
			style={[styles.list, style]}
			{...props}
		/>
	)
)
TabsList.displayName = TabsPrimitive.List.displayName

interface TabsTriggerProps extends Omit<TabsPrimitive.TriggerProps, 'style'> {
	style?: StyleProp<ViewStyle>
}

const TabsTrigger = React.forwardRef<TabsPrimitive.TriggerRef, TabsTriggerProps>(
	({ style, disabled, value, ...props }, ref) => {
		const { value: selectedValue } = TabsPrimitive.useRootContext()
		const isActive = selectedValue === value

		return (
			<TextClassContext.Provider value={isActive ? 'text-foreground' : 'text-muted-foreground'}>
				<TabsPrimitive.Trigger
					ref={ref}
					style={[disabled && styles.triggerDisabled, style]}
					disabled={disabled}
					value={value}
					{...props}
				/>
			</TextClassContext.Provider>
		)
	}
)
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

interface TabsContentProps extends Omit<TabsPrimitive.ContentProps, 'style'> {
	style?: StyleProp<ViewStyle>
}

const TabsContent = React.forwardRef<TabsPrimitive.ContentRef, TabsContentProps>(
	({ style, ...props }, ref) => (
		<TabsPrimitive.Content
			ref={ref}
			style={[styles.content, style]}
			{...props}
		/>
	)
)
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsContent, TabsList, TabsTrigger }
