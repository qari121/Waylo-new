import * as React from 'react'
import { Control, useController } from 'react-hook-form'
import { TextInput, type TextInputProps, StyleSheet, Platform, StyleProp, TextStyle } from 'react-native'

const styles = StyleSheet.create({
	input: {
		height: Platform.select({ native: 48, default: 40 }),
		width: '100%',
		borderRadius: 6,
		borderWidth: 1,
		borderColor: 'var(--input)',
		backgroundColor: 'var(--background)',
		paddingHorizontal: 12,
		fontSize: Platform.select({ native: 14, default: 14 }),
		lineHeight: Platform.select({ native: 17.5, default: 20 }),
		color: 'var(--foreground)',
	},
	disabled: {
		opacity: 0.5,
	},
	placeholder: {
		color: '#C5C5C5',
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
				placeholderTextColor="#C5C5C5"
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
