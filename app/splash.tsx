import { Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Splash = () => {
  return (
    <SafeAreaView className="bg-white h-full flex items-center justify-center">
      <Image
        source={require("@/assets/images/android-icon-foreground.png")}
        style={{ width: "80%", maxWidth: 400, aspectRatio: 1 }}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
};

export default Splash;
