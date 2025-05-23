import { TextClassContext } from 'components/ui/text'
import * as React from 'react'
import { Pressable, StyleSheet, ViewStyle, TextStyle, Platform, StyleProp } from 'react-native'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

const styles = StyleSheet.create({
	baseButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 8,
	},
	baseText: {
		fontSize: Platform.select({ native: 16, default: 14 }),
		fontWeight: '500',
	},
	default: {
		backgroundColor: 'var(--primary)',
	},
	destructive: {
		backgroundColor: 'var(--destructive)',
	},
	outline: {
		borderWidth: 1,
		borderColor: 'var(--input)',
		backgroundColor: 'var(--background)',
	},
	secondary: {
		backgroundColor: 'var(--secondary)',
	},
	ghost: {},
	link: {},
	defaultText: {
		color: 'var(--primary-foreground)',
	},
	destructiveText: {
		color: 'var(--destructive-foreground)',
	},
	outlineText: {
		color: 'var(--foreground)',
	},
	secondaryText: {
		color: 'var(--secondary-foreground)',
	},
	ghostText: {
		color: 'var(--foreground)',
	},
	linkText: {
		color: 'var(--primary)',
	},
	sizeDefault: {
		height: Platform.select({ native: 48, default: 40 }),
		paddingHorizontal: Platform.select({ native: 20, default: 16 }),
		paddingVertical: Platform.select({ native: 12, default: 8 }),
		borderRadius: 8,
	},
	sizeSm: {
		height: 36,
		paddingHorizontal: 12,
		borderRadius: 6,
	},
	sizeLg: {
		height: Platform.select({ native: 56, default: 44 }),
		paddingHorizontal: 32,
		borderRadius: 6,
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
