import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import { logout } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { useFavorites } from "@/lib/favorites-provider";
import seed from "@/lib/seed";
import { agentImages } from "@/lib/data";

import icons from "@/constants/icons";
import images from "@/constants/images";
import { settings } from "@/constants/data";

interface SettingsItemProp {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  textStyle?: string;
  showArrow?: boolean;
  disabled?: boolean;
}

const SettingsItem = ({
  icon,
  title,
  onPress,
  textStyle,
  showArrow = true,
  disabled = false,
}: SettingsItemProp) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    className="flex flex-row items-center justify-between py-3"
  >
    <View className="flex flex-row items-center gap-3">
      <Image source={icon} className="size-6" />
      <Text className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}>
        {title}
      </Text>
    </View>

    {showArrow && <Image source={icons.rightArrow} className="size-5" />}
  </TouchableOpacity>
);

const Profile = () => {
  const { user, refetch, avatar, setAvatar, guest, exitGuest } =
    useGlobalContext();
  const { clearFavorites } = useFavorites();
  const [seeding, setSeeding] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  const avatarChoices: {
    key: string;
    source: ImageSourcePropType;
    selected: boolean;
  }[] = [
    {
      key: "account",
      source: { uri: user?.avatar ?? "" },
      selected: !!user?.avatar && avatar === user.avatar,
    },
    {
      key: "default",
      source: images.avatar,
      selected: !avatar,
    },
    ...agentImages.map((uri) => ({
      key: uri,
      source: { uri },
      selected: avatar === uri,
    })),
  ];

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: "Check out Restate - find your dream home!",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to share";
      Alert.alert("Error", message);
    }
  };

  const handleSettingPress = (title: string) => {
    switch (title) {
      case "Invite Friends":
        handleInviteFriends();
        break;
      case "My Bookings":
        router.push("/bookings");
        break;
      case "Payments":
      case "Profile":
      case "Notifications":
      case "Security":
      case "Language":
      case "Help Center":
        router.push(`/settings?section=${encodeURIComponent(title)}`);
        break;
      default:
        router.push("/settings?section=Help%20Center");
    }
  };

  const handleEditAvatar = () => setShowAvatarPicker(true);

  const selectAvatar = async (source: ImageSourcePropType) => {
    if (typeof source === "number" || Array.isArray(source)) {
      await setAvatar("");
    } else {
      await setAvatar(source.uri ?? "");
    }
    setShowAvatarPicker(false);
  };

  const handleChooseFromGallery = async () => {
    try {
      setLoadingAvatar(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Allow photo access to choose a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await setAvatar(result.assets[0].uri);
        setShowAvatarPicker(false);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to open your gallery";
      Alert.alert("Gallery error", message);
    } finally {
      setLoadingAvatar(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await seed();
      Alert.alert(
        "Success",
        `${result.properties} properties, ${result.agents} agents, ${result.reviews} reviews, and ${result.galleries} gallery items are ready. Reload the app to see them.`
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      Alert.alert(
        "Seed failed",
        `Verify the Appwrite collection IDs and your signed-in user's permissions.\n\n${message}`
      );
    } finally {
      setSeeding(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      const result = await logout();
      if (!result) {
        Alert.alert("Error", "Failed to logout");
        return;
      }

      await setAvatar("");
      clearFavorites();
      if (guest) {
        exitGuest();
      }

      await refetch();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to log out";
      Alert.alert("Error", message);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-7"
      >
        <View className="flex flex-row items-center justify-between mt-5">
          <Text className="text-xl font-rubik-bold text-black-300">Profile</Text>
          <TouchableOpacity
            onPress={() => router.push("/settings?section=Notifications")}
            className="bg-primary-100 rounded-full size-10 flex items-center justify-center"
          >
            <Image source={icons.bell} className="size-5" />
          </TouchableOpacity>
        </View>

        <View className="flex flex-row justify-center mt-5">
          <View className="flex flex-col items-center relative mt-5">
            <Image
              source={avatar ? { uri: avatar } : images.avatar}
              className="size-44 relative rounded-full"
            />
            <TouchableOpacity
              onPress={handleEditAvatar}
              className="absolute bottom-11 right-2 bg-primary-200 rounded-full p-2"
            >
              <Image source={icons.edit} className="size-6" />
            </TouchableOpacity>

            <Text className="text-2xl font-rubik-bold text-black-300 mt-2">
              {user?.name?.trim() || "Restate User"}
            </Text>
            <Text className="text-sm font-rubik text-black-200 mt-1">
              {user?.email || "Signed in with Google"}
            </Text>

          </View>
        </View>

        <View className="flex flex-col mt-10">
          <SettingsItem
            icon={icons.calendar}
            title="My Bookings"
            onPress={() => handleSettingPress("My Bookings")}
          />
          <SettingsItem
            icon={icons.wallet}
            title="Payments"
            onPress={() => handleSettingPress("Payments")}
          />
        </View>

        <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
          {settings.slice(2).map((item, index) => (
            <SettingsItem
              key={index}
              {...item}
              onPress={() => handleSettingPress(item.title)}
            />
          ))}
        </View>

        <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
          {__DEV__ && user ? (
            <TouchableOpacity
              onPress={handleSeed}
              disabled={seeding}
              className="flex flex-row items-center justify-center py-3 bg-primary-100 rounded-full mb-6"
            >
              {seeding ? (
                <ActivityIndicator
                  size="small"
                  className="text-primary-300"
                />
              ) : (
                <Text className="text-lg font-rubik-medium text-primary-300">
                  Seed Demo Data
                </Text>
              )}
            </TouchableOpacity>
          ) : null}

          <SettingsItem
            icon={icons.logout}
            title={loggingOut ? "Logging out..." : "Logout"}
            textStyle="text-danger"
            showArrow={false}
            disabled={loggingOut}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showAvatarPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-3xl p-6">
            <Text className="text-xl font-rubik-bold text-black-300 text-center">
              Choose Profile Picture
            </Text>

            <View className="flex flex-row flex-wrap justify-center gap-4 mt-6">
              {avatarChoices.map((choice) => (
                <TouchableOpacity
                  key={choice.key}
                  onPress={() => selectAvatar(choice.source)}
                >
                  <Image
                    source={choice.source}
                    className={`size-20 rounded-full ${
                      choice.selected
                        ? "border-4 border-primary-300"
                        : "border border-primary-200"
                    }`}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleChooseFromGallery}
              disabled={loadingAvatar}
              className="mt-6 bg-primary-100 rounded-full py-3"
            >
              <Text className="text-center font-rubik-medium text-primary-300">
                {loadingAvatar ? "Opening gallery..." : "Choose from Gallery"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAvatarPicker(false)}
              className="mt-6 bg-primary-100 rounded-full py-3"
            >
              <Text className="text-center font-rubik-medium text-primary-300">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;