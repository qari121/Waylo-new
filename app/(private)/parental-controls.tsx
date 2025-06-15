import { View, StyleSheet } from 'react-native'
import ParentalControlsScreen from '../../screens/ParentalControls'

export default function Page() {
  return (
    <View style={styles.container}>
      <ParentalControlsScreen />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}) 