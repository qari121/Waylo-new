import { View } from 'react-native'

import { FloatingMenu } from '../../components/floating-menu'
import { ReportScreen } from '../../screens/reports'

 const Page = () => {
	return (
		<View className="relative flex-1 gap-5 bg-secondary/30 p-6">
			<ReportScreen />
			<FloatingMenu />
		</View>
	)
}
export default Page;