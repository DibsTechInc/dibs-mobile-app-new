import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-2xl font-bold text-neutral-900">Dibs</Text>
        <Text className="text-center text-base text-neutral-500">
          Rebuild scaffold — Expo SDK 56, TypeScript, Expo Router, NativeWind.
        </Text>
      </View>
    </SafeAreaView>
  );
}
