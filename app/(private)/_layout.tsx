import AuthMiddleware from '../../components/auth-middleware';
import FloatingMenu   from '../../components/floating-menu';   //  ← ADD
import { Stack }      from 'expo-router';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrivateLayout() {
  const insets = useSafeAreaInsets();

  return (
    <AuthMiddleware>
      <View style={{ 
        flex: 1,
        backgroundColor: 'white',
        paddingTop: Platform.OS === 'ios' ? insets.top : 0,
        position: 'relative',
        minHeight: '100%',
      }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
            presentation: 'transparentModal',
            orientation: 'portrait',
            gestureEnabled: false,
            fullScreenGestureEnabled: false,
            contentStyle: { backgroundColor: 'white' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="wylo-registration" />
        </Stack>

        {/* single persistent bottom bar */}
        <FloatingMenu />
      </View>
    </AuthMiddleware>
  );
}
