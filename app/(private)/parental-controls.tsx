import { View, StyleSheet } from 'react-native'
import { FloatingMenu } from '../../components/floating-menu'
import ParentalControlsScreen from '../../screens/ParentalControls'

export default function Page() {
  return (
    <View style={styles.container}>
      <ParentalControlsScreen />
      <FloatingMenu />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}) 