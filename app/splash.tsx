import { Image, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import images from "@/constants/images";

const Splash = () => {
  return (
    <SafeAreaView className="bg-primary-300 h-full flex items-center justify-center px-6">
      <Image
        source={images.onboarding}
        className="w-4/5 h-1/2"
        resizeMode="contain"
      />

      <Text className="text-4xl font-rubik-extrabold text-white mt-10">
        Real Scout
      </Text>
      <Text className="text-lg font-rubik text-white/80 mt-2 text-center">
        Find your dream home
      </Text>
    </SafeAreaView>
  );
};

export default Splash;