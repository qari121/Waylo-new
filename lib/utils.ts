import { clsx, type ClassValue } from 'clsx'
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export const getDuration = (date: Date): string => {
	const end = new Date()

	const years = differenceInYears(end, date)
	if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`

	const months = differenceInMonths(end, date)
	if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`

	const days = differenceInDays(end, date)
	if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`

	return 'Today'
}
