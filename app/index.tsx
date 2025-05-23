import { Redirect } from 'expo-router'
import { useAppSelector } from 'hooks'

export default function Page() {
	const auth = useAppSelector((state) => state.auth)
	return auth.uid ? <Redirect href="(private)/" /> : <Redirect href="(public)/login" />
}
