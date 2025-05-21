import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans'
import { useFonts } from 'expo-font'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Animated, Image, Pressable, ScrollView, Text, View } from 'react-native'


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
    <View className="flex-1 bg-white">
      {/* Header without border */}
      <View className="w-full bg-white">
        <View className="mt-2 flex w-full flex-row items-center justify-between px-5 py-5">
          <Pressable onPress={() => router.back()} className="p-2">
            {/* <ChevronLeftIcon /> */}
          </Pressable>
          <Text
            style={{ fontFamily: 'PlusJakartaSans_600SemiBold' }}
            className="text-center text-[20px] text-[#101828]"
          >
            Support
          </Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="py-4">
          {supportItems.map((item, index) => (
            <Pressable
              key={item.title}
              onPress={() => handlePress(index)}
              className="mb-4"
            >
              <View className="flex-row items-center justify-between">
                <Text
                  style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
                  className="text-base text-[#101828]"
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
                  className="mt-3 rounded-lg p-4"
                  style={{ backgroundColor: 'rgba(174, 159, 255, 0.2)' }}
                >
                  <Text
                    style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
                    className="text-sm leading-5 text-[#475467]"
                  >
                    {item.content}
                  </Text>
                  {item.title === 'Wylo Connectivity' && (
                    <Text
                      style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
                      className="mt-1 text-sm text-[#AE9FFF]"
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
      <View className="items-center justify-center pb-20">
        <Image
          source={require('assets/images/support-illustration.png')}
          style={{
            width: 450,
            height: 400,
            opacity: 0.8
          }}
          resizeMode="contain"
        />
      </View>
    </View>
  )
} 