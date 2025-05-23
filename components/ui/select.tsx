import { Check } from '../../@lib/icons/Check'
import { ChevronDown } from '../../@lib/icons/ChevronDown'
import { ChevronUp } from '../../@lib/icons/ChevronUp'
import { cn } from '../../lib/utils'
import * as SelectPrimitive from '@rn-primitives/select'
import * as React from 'react'
import { Platform, StyleSheet, View, StyleProp, ViewStyle, TextStyle } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'

type Option = SelectPrimitive.Option

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const styles = StyleSheet.create({
	trigger: {
		height: Platform.select({ native: 48, default: 40 }),
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderRadius: 6,
		borderWidth: 1,
		borderColor: 'var(--input)',
		backgroundColor: 'white',
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	triggerDisabled: {
		opacity: 0.5,
	},
	label: {
		paddingBottom: Platform.select({ native: 8, default: 6 }),
		paddingLeft: Platform.select({ native: 40, default: 32 }),
		paddingRight: 8,
		fontSize: Platform.select({ native: 16, default: 14 }),
		fontWeight: '600',
		color: '#92929D',
	},
	item: {
		paddingVertical: Platform.select({ native: 8, default: 6 }),
		paddingLeft: Platform.select({ native: 40, default: 24 }),
		paddingRight: 8,
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		borderRadius: 4,
	},
	itemDisabled: {
		opacity: 0.5,
	},
	itemIndicator: {
		position: 'absolute',
		left: Platform.select({ native: 14, default: 4 }),
		top: Platform.select({ native: 1, default: 0 }),
		height: 14,
		width: 14,
		alignItems: 'center',
		justifyContent: 'center',
	},
	itemText: {
		fontSize: Platform.select({ native: 16, default: 14 }),
		color: '#92929D',
	},
	separator: {
		marginHorizontal: -4,
		marginVertical: 4,
		height: 1,
		backgroundColor: 'var(--muted)',
	},
})

interface SelectTriggerProps extends SelectPrimitive.TriggerProps {
	style?: StyleProp<ViewStyle>
}

const SelectTrigger = React.forwardRef<SelectPrimitive.TriggerRef, SelectTriggerProps>(
	({ style, children, disabled, ...props }, ref) => (
		<SelectPrimitive.Trigger
			ref={ref}
			style={[styles.trigger, disabled && styles.triggerDisabled, style]}
			{...props}>
			{(state) => (
				<>
					{typeof children === 'function' ? children(state) : children}
					<ChevronDown size={16} aria-hidden={true} color="#979797" />
				</>
			)}
		</SelectPrimitive.Trigger>
	)
)
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

/**
 * Platform: WEB ONLY
 */
const SelectScrollUpButton = ({ className, ...props }: SelectPrimitive.ScrollUpButtonProps) => {
	if (Platform.OS !== 'web') {
		return null
	}
	return (
		<SelectPrimitive.ScrollUpButton
			className={cn('flex items-center justify-center py-1 web:cursor-default', className)}
			{...props}>
			<ChevronUp size={14} className="text-foreground" />
		</SelectPrimitive.ScrollUpButton>
	)
}

/**
 * Platform: WEB ONLY
 */
const SelectScrollDownButton = ({ className, ...props }: SelectPrimitive.ScrollDownButtonProps) => {
	if (Platform.OS !== 'web') {
		return null
	}
	return (
		<SelectPrimitive.ScrollDownButton
			className={cn('flex items-center justify-center py-1 web:cursor-default', className)}
			{...props}>
			<ChevronDown size={14} className="text-foreground" />
		</SelectPrimitive.ScrollDownButton>
	)
}

interface SelectContentProps extends Omit<SelectPrimitive.ContentProps, 'style'> {
	style?: ViewStyle
	portalHost?: string
}

const SelectContent = React.forwardRef<SelectPrimitive.ContentRef, SelectContentProps>(
	({ style, children, position = 'popper', portalHost, ...props }, ref) => {
		const { open } = SelectPrimitive.useRootContext()

		const contentStyle: ViewStyle = {
			position: 'relative',
			zIndex: 50,
			marginTop: 2,
			maxHeight: 384,
			minWidth: 96,
			borderRadius: 6,
			borderWidth: 1,
			borderColor: 'var(--border)',
			backgroundColor: 'var(--popover)',
			shadowColor: 'var(--foreground)',
			shadowOpacity: 0.1,
			shadowRadius: 4,
			shadowOffset: { width: 0, height: 2 },
			...style,
		}

		return (
			<SelectPrimitive.Portal hostName={portalHost}>
				<SelectPrimitive.Overlay style={Platform.OS !== 'web' ? StyleSheet.absoluteFill : undefined}>
					<Animated.View style={{ zIndex: 50 }} entering={FadeIn} exiting={FadeOut}>
						<SelectPrimitive.Content
							ref={ref}
							style={contentStyle}
							position={position}
							{...props}>
							<SelectScrollUpButton />
							<SelectPrimitive.Viewport style={{ padding: 4 }}>
								{children}
							</SelectPrimitive.Viewport>
							<SelectScrollDownButton />
						</SelectPrimitive.Content>
					</Animated.View>
				</SelectPrimitive.Overlay>
			</SelectPrimitive.Portal>
		)
	}
)
SelectContent.displayName = SelectPrimitive.Content.displayName

interface SelectLabelProps extends Omit<SelectPrimitive.LabelProps, 'style'> {
	style?: TextStyle
}

const SelectLabel = React.forwardRef<SelectPrimitive.LabelRef, SelectLabelProps>(
	({ style, ...props }, ref) => (
		<SelectPrimitive.Label
			ref={ref}
			style={[styles.label, style]}
			{...props}
		/>
	)
)
SelectLabel.displayName = SelectPrimitive.Label.displayName

interface SelectItemProps extends Omit<SelectPrimitive.ItemProps, 'style'> {
	style?: ViewStyle
}

const SelectItem = React.forwardRef<SelectPrimitive.ItemRef, SelectItemProps>(
	({ style, disabled, ...props }, ref) => (
		<SelectPrimitive.Item
			ref={ref}
			style={[styles.item, disabled && styles.itemDisabled, style]}
			{...props}>
			<View style={styles.itemIndicator}>
				<SelectPrimitive.ItemIndicator>
					<Check size={16} strokeWidth={3} color="#92929D" />
				</SelectPrimitive.ItemIndicator>
			</View>
			<SelectPrimitive.ItemText style={styles.itemText} />
		</SelectPrimitive.Item>
	)
)
SelectItem.displayName = SelectPrimitive.Item.displayName

interface SelectSeparatorProps extends Omit<SelectPrimitive.SeparatorProps, 'style'> {
	style?: ViewStyle
}

const SelectSeparator = React.forwardRef<SelectPrimitive.SeparatorRef, SelectSeparatorProps>(
	({ style, ...props }, ref) => (
		<SelectPrimitive.Separator
			ref={ref}
			style={[styles.separator, style]}
			{...props}
		/>
	)
)
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
	type Option
}
