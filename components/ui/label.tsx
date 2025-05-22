import { cn } from '../../lib/utils'
import * as LabelPrimitive from '@rn-primitives/label'
import * as React from 'react'

interface LabelProps extends LabelPrimitive.TextProps {
	rootClassName?: string
}

const Label = React.forwardRef<LabelPrimitive.TextRef, LabelProps>(
	({ className, onPress, onLongPress, onPressIn, onPressOut, rootClassName, ...props }, ref) => (
		<LabelPrimitive.Root
			className={cn('web:cursor-default', rootClassName)}
			onPress={onPress}
			onLongPress={onLongPress}
			onPressIn={onPressIn}
			onPressOut={onPressOut}>
			<LabelPrimitive.Text
				ref={ref}
				className={cn(
					'native:text-base text-sm font-medium leading-none text-foreground web:peer-disabled:cursor-not-allowed web:peer-disabled:opacity-70',
					className
				)}
				{...props}
			/>
		</LabelPrimitive.Root>
	)
)
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
