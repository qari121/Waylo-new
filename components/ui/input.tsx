import { cn } from '../../lib/utils'
import * as React from 'react'
import { Control, useController } from 'react-hook-form'
import { TextInput, type TextInputProps } from 'react-native'

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, TextInputProps>(
	({ className, placeholderClassName, ...props }, ref) => {
		return (
			<TextInput
				ref={ref}
				className={cn(
					'native:h-12 native:text-sm native:leading-[1.25] h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground file:border-0 file:bg-transparent file:font-medium web:flex web:py-2 web:ring-offset-background web:placeholder:text-[#C5C5C5] web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 lg:text-sm',
					props.editable === false && 'opacity-50 web:cursor-not-allowed',
					className
				)}
				placeholderClassName={cn('text-[#C5C5C5]', placeholderClassName)}
				{...props}
			/>
		)
	}
)

Input.displayName = 'Input'

interface FormInputProps extends TextInputProps {
	name: string
	control: Control<any, any>
	placeholder?: string
	className?: string
}

const FormInput = ({ name, control, placeholder, className, ...rest }: FormInputProps) => {
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
			className={className}
		/>
	)
}

export { FormInput, Input }
