import { TextClassContext } from 'components/ui/text'
import * as React from 'react'
import { Pressable, StyleSheet, ViewStyle, TextStyle, Platform, StyleProp } from 'react-native'
import { theme } from '../../lib/theme'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const styles = StyleSheet.create({
	baseButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: theme.borderRadius.md,
	},
	baseText: {
		fontSize: Platform.select({ native: 16, default: 14 }),
		fontWeight: '500',
	},
	default: {
		backgroundColor: theme.colors.buttonPrimary,
		...(Platform.OS === 'web' && {
			boxShadow: theme.shadows.red,
		}),
	},
	destructive: {
		backgroundColor: theme.colors.error,
	},
	outline: {
		borderWidth: 1,
		borderColor: theme.colors.inputBorder,
		backgroundColor: theme.colors.background,
	},
	secondary: {
		backgroundColor: theme.colors.buttonSecondary,
	},
	ghost: {},
	link: {},
	defaultText: {
		color: theme.colors.background,
	},
	destructiveText: {
		color: theme.colors.background,
	},
	outlineText: {
		color: theme.colors.textPrimary,
	},
	secondaryText: {
		color: theme.colors.textPrimary,
	},
	ghostText: {
		color: theme.colors.textPrimary,
	},
	linkText: {
		color: theme.colors.primary,
	},
	sizeDefault: {
		height: 56,
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: theme.borderRadius.md,
	},
	sizeSm: {
		height: 36,
		paddingHorizontal: 12,
		borderRadius: theme.borderRadius.sm,
	},
	sizeLg: {
		height: 56,
		paddingHorizontal: 24,
		borderRadius: theme.borderRadius.md,
	},
	sizeIcon: {
		height: 40,
		width: 40,
	},
	disabled: {
		opacity: 0.5,
	},
} as const)

const getButtonStyles = (variant: ButtonVariant, size: ButtonSize, disabled?: boolean) => {
	const sizeKey = `size${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles
	const textKey = `${variant}Text` as keyof typeof styles

	return {
		button: [
			styles.baseButton,
			styles[variant],
			styles[sizeKey],
			disabled && styles.disabled,
		] as StyleProp<ViewStyle>,
		textClass: `text-base text-foreground ${variant === 'default' ? 'text-primary-foreground' : ''} ${variant === 'destructive' ? 'text-destructive-foreground' : ''} ${variant === 'outline' ? 'text-foreground' : ''} ${variant === 'secondary' ? 'text-secondary-foreground' : ''} ${variant === 'ghost' ? 'text-foreground' : ''} ${variant === 'link' ? 'text-primary' : ''}`,
	}
}

type ButtonProps = Omit<React.ComponentPropsWithoutRef<typeof Pressable>, 'style'> & {
	variant?: ButtonVariant
	size?: ButtonSize
	style?: StyleProp<ViewStyle>
}

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
	({ variant = 'default', size = 'default', disabled, style, ...props }, ref) => {
		const { button, textClass } = getButtonStyles(variant, size, !!disabled)

		return (
			<TextClassContext.Provider value={textClass}>
				<Pressable
					ref={ref}
					style={[button, style]}
					role="button"
					disabled={disabled}
					{...props}
				/>
			</TextClassContext.Provider>
		)
	}
)

Button.displayName = 'Button'

export { Button }
export type { ButtonProps, ButtonVariant, ButtonSize }
