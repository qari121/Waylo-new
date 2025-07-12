import * as React from 'react'
import { Control, useController } from 'react-hook-form'
import { TextInput, type TextInputProps, StyleSheet, Platform, StyleProp, TextStyle } from 'react-native'
import { theme } from '../../lib/theme'

const styles = StyleSheet.create({
	input: {
		height: Platform.select({ native: 48, default: 40 }),
		width: '100%',
		borderRadius: theme.borderRadius.sm,
		borderWidth: 1,
		borderColor: theme.colors.inputBorder,
		backgroundColor: theme.colors.background,
		paddingHorizontal: 12,
		fontSize: Platform.select({ native: 14, default: 14 }),
		lineHeight: Platform.select({ native: 17.5, default: 20 }),
		color: theme.colors.textPrimary,
		...(Platform.OS === 'web' && {
			boxShadow: theme.shadows.sm,
		}),
	},
	disabled: {
		opacity: 0.5,
	},
	placeholder: {
		color: theme.colors.textMuted,
	},
})

type InputProps = Omit<TextInputProps, 'style'> & {
	style?: StyleProp<TextStyle>
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
	({ editable, style, ...props }, ref) => {
		return (
			<TextInput
				ref={ref}
				style={[styles.input, editable === false && styles.disabled, style]}
				placeholderTextColor={theme.colors.textMuted}
				{...props}
			/>
		)
	}
)

Input.displayName = 'Input'

interface FormInputProps extends InputProps {
	name: string
	control: Control<any, any>
	placeholder?: string
}

const FormInput = ({ name, control, placeholder, style, ...rest }: FormInputProps) => {
	const { field } = useController({
		control,
		name
	})
	return (
		<Input
			{...rest}
			value={field.value}
			onChangeText={field.onChange}
			placeholder={placeholder}
			style={style}
		/>
	)
}

export { FormInput, Input }
export type { InputProps, FormInputProps }
