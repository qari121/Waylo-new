import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans'
import { useFonts } from 'expo-font'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Animated, Image, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native'

const supportItems = [
  {
    title: 'Wylo Connectivity',
    content: 'Check the Wi-Fi network and Bluetooth pairing. Check if wylo is paired with correct device. For further assistance contact',
    expanded: false
  },
  {
    title: 'Realtime recording glitch',
    content: 'Check the Wi-Fi network and Bluetooth pairing. Check if wylo is paired with correct device. For further assistance contact'
  },
  {
    title: 'Payment failure',
    content: 'Check the Wi-Fi network and Bluetooth pairing. Check if wylo is paired with correct device. For further assistance contact'
  },
  {
    title: 'Wylo battery issue',
    content: 'Check the Wi-Fi network and Bluetooth pairing. Check if wylo is paired with correct device. For further assistance contact'
  },
  {
    title: 'Wylo Camera issue',
    content: 'Check the Wi-Fi network and Bluetooth pairing. Check if wylo is paired with correct device. For further assistance contact'
  },
  {
    title: 'Parental Control',
    content: 'Check the Wi-Fi network and Bluetooth pairing. Check if wylo is paired with correct device. For further assistance contact'
  }
]

export default function Support() {
  const router = useRouter()
  const [expandedItem, setExpandedItem] = useState<number>(-1)
  const rotateAnims = useRef(supportItems.map(() => new Animated.Value(0))).current

  let [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold
  })

  const handlePress = (index: number) => {
    const toValue = expandedItem === index ? 0 : 1

    // Reset other animations
    rotateAnims.forEach((anim, i) => {
      if (i !== index) {
        Animated.spring(anim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 10,
          tension: 50
        }).start()
      }
    })

    // Animate the clicked item
    Animated.spring(rotateAnims[index], {
      toValue,
      useNativeDriver: true,
      friction: 10,
      tension: 50
    }).start()

    setExpandedItem(expandedItem === index ? -1 : index)
  }

  if (!fontsLoaded) {
    return null
  }

  return (
    <View style={styles.root}>
      {/* Header without border */}
      <View style={styles.headerWrapper}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.headerBackBtn}>
            {/* <ChevronLeftIcon /> */}
          </Pressable>
          <Text
            style={[styles.headerTitle, { fontFamily: 'PlusJakartaSans_600SemiBold' }]}
          >
            Support
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.supportList}>
          {supportItems.map((item, index) => (
            <Pressable
              key={item.title}
              onPress={() => handlePress(index)}
              style={styles.supportItem}
            >
              <View style={styles.supportItemRow}>
                <Text
                  style={[styles.supportItemTitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}
                >
                  {item.title}
                </Text>
                <Animated.View
                  style={{
                    transform: [{
                      rotate: rotateAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg']
                      })
                    }]
                  }}
                >
                  {/* <ChevronDownIcon width={24} height={24} /> */}
                </Animated.View>
              </View>

              {expandedItem === index && item.content && (
                <View
                  style={[styles.supportItemContent, { backgroundColor: 'rgba(174, 159, 255, 0.2)' }]}
                >
                  <Text
                    style={[styles.supportItemContentText, { fontFamily: 'PlusJakartaSans_400Regular' }]}
                  >
                    {item.content}
                  </Text>
                  {item.title === 'Wylo Connectivity' && (
                    <Text
                      style={[styles.supportItemContentEmail, { fontFamily: 'PlusJakartaSans_400Regular' }]}
                    >
                      support.wylo@connectivity.com
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Image */}
      <View style={styles.bottomImageWrapper}>
        <Image
          source={require('assets/images/support-illustration.png')}
          style={styles.bottomImage}
          resizeMode="contain"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerWrapper: {
    width: '100%',
    backgroundColor: 'white',
  },
  headerRow: {
    marginTop: 8, // mt-2
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, // px-5
    paddingVertical: 20, // py-5
  },
  headerBackBtn: {
    padding: 8, // p-2
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 20,
    color: '#101828',
  },
  headerSpacer: {
    width: 24, // w-6
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20, // px-5
  },
  supportList: {
    paddingVertical: 16, // py-4
  },
  supportItem: {
    marginBottom: 16, // mb-4
  },
  supportItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  supportItemTitle: {
    fontSize: 16, // text-base
    color: '#101828',
  },
  supportItemContent: {
    marginTop: 12, // mt-3
    borderRadius: 8, // rounded-lg
    padding: 16, // p-4
  },
  supportItemContentText: {
    fontSize: 14, // text-sm
    lineHeight: 20, // leading-5
    color: '#475467',
  },
  supportItemContentEmail: {
    marginTop: 4, // mt-1
    fontSize: 14, // text-sm
    color: '#AE9FFF',
  },
  bottomImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80, // pb-20
  },
  bottomImage: {
    width: 450,
    height: 400,
    opacity: 0.8,
  },
}); 