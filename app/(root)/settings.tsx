import { ReactNode, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import icons from "@/constants/icons";
import images from "@/constants/images";
import { updateUserName, updateUserPassword } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";

type Section =
  | "Profile"
  | "Payments"
  | "Notifications"
  | "Security"
  | "Language"
  | "Help Center";

interface ProfilePreferences {
  pushNotifications: boolean;
  emailUpdates: boolean;
  language: string;
  cardLastFour: string;
  cardExpiry: string;
}

const PREFERENCES_STORAGE_KEY = "restate:profile-preferences";

const defaultPreferences: ProfilePreferences = {
  pushNotifications: true,
  emailUpdates: true,
  language: "English",
  cardLastFour: "",
  cardExpiry: "",
};

const sectionTitles: Record<Section, string> = {
  Profile: "Profile",
  Payments: "Payments",
  Notifications: "Notifications",
  Security: "Security",
  Language: "Language",
  "Help Center": "Help Center",
};

const languageOptions = ["English", "Spanish", "French"];

const faqs = [
  {
    question: "How do I book a home?",
    answer: "Open a property, select Book Now, choose your date and guests, then confirm the booking.",
  },
  {
    question: "Where can I see my bookings?",
    answer: "Open Profile and select My Bookings to see, review, or cancel your bookings.",
  },
  {
    question: "Can I change my profile picture?",
    answer: "Yes. Tap the edit icon on your profile picture and choose a picture from your gallery.",
  },
];

const SettingsCard = ({ children }: { children: ReactNode }) => (
  <View className="bg-primary-100 rounded-3xl p-5 mt-5">{children}</View>
);

const Settings = () => {
  const params = useLocalSearchParams<{ section?: string | string[] }>();
  const requestedSection = Array.isArray(params.section)
    ? params.section[0]
    : params.section;
  const section = (requestedSection ?? "Profile") as Section;
  const { user, avatar, refetch } = useGlobalContext();
  const [preferences, setPreferences] =
    useState<ProfilePreferences>(defaultPreferences);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [name, setName] = useState(user?.name ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    void AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)
      .then((stored) => {
        if (!active || !stored) {
          return;
        }

        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setPreferences({
            ...defaultPreferences,
            ...(parsed as Partial<ProfilePreferences>),
          });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setPreferencesLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const savePreferences = async (
    updates: Partial<ProfilePreferences>
  ): Promise<void> => {
    const nextPreferences = { ...preferences, ...updates };
    setPreferences(nextPreferences);

    try {
      await AsyncStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(nextPreferences)
      );
    } catch {
      Alert.alert("Unable to save", "Your preference could not be saved.");
    }
  };

  const handleSaveProfile = async () => {
    const nextName = name.trim();
    if (nextName.length < 2) {
      Alert.alert("Invalid name", "Enter at least two characters.");
      return;
    }

    if (!user) {
      Alert.alert("Sign in required", "Sign in to update your profile.");
      return;
    }

    try {
      setSavingProfile(true);
      await updateUserName(nextName);
      await refetch();
      Alert.alert("Profile updated", "Your display name has been updated.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to update profile";
      Alert.alert("Update failed", message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePayment = async () => {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 12) {
      Alert.alert("Invalid card", "Enter a valid card number.");
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      Alert.alert("Invalid expiry", "Use the format MM/YY.");
      return;
    }

    try {
      setSavingPayment(true);
      await savePreferences({
        cardLastFour: digits.slice(-4),
        cardExpiry,
      });
      setCardNumber("");
      setCardExpiry("");
      setShowPaymentForm(false);
      Alert.alert("Payment method saved", "Only the last four digits are stored on this device.");
    } finally {
      setSavingPayment(false);
    }
  };

  const handleRemovePayment = () => {
    void savePreferences({ cardLastFour: "", cardExpiry: "" });
  };

  const handleSavePassword = async () => {
    if (!user) {
      Alert.alert("Sign in required", "Sign in to update your password.");
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert("Invalid password", "Use at least eight characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Passwords do not match", "Enter the same password twice.");
      return;
    }

    try {
      setSavingPassword(true);
      await updateUserPassword(newPassword, oldPassword || undefined);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Password updated", "Your password has been changed.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to update password";
      Alert.alert("Update failed", message);
    } finally {
      setSavingPassword(false);
    }
  };

  const renderProfile = () => (
    <>
      <View className="items-center mt-7">
        <Image
          source={avatar ? { uri: avatar } : images.avatar}
          className="size-28 rounded-full"
        />
        <Text className="text-2xl font-rubik-bold text-black-300 mt-4">
          {user?.name?.trim() || "Restate User"}
        </Text>
        <Text className="text-sm font-rubik text-black-200 mt-1">
          {user?.email || "Signed in with Google"}
        </Text>
      </View>

      <SettingsCard>
        <Text className="text-lg font-rubik-bold text-black-300">
          Display name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          editable={!!user}
          className="bg-white rounded-2xl px-4 py-3 mt-3 text-base font-rubik text-black-300"
          placeholder="Your name"
          placeholderTextColor="#8E8E8E"
        />
        <TouchableOpacity
          onPress={handleSaveProfile}
          disabled={savingProfile || !user}
          className="bg-primary-300 rounded-full py-3 mt-4 items-center"
        >
          {savingProfile ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-white font-rubik-medium">
              Save profile
            </Text>
          )}
        </TouchableOpacity>
        {!user ? (
          <Text className="text-xs font-rubik text-black-200 mt-3 text-center">
            Sign in to edit your account details.
          </Text>
        ) : null}
      </SettingsCard>
    </>
  );

  const renderPayments = () => (
    <SettingsCard>
      <View className="flex flex-row items-center gap-3">
        <Image source={icons.wallet} className="size-7" />
        <Text className="text-lg font-rubik-bold text-black-300">
          Payment methods
        </Text>
      </View>

      {preferences.cardLastFour ? (
        <View className="bg-white rounded-2xl p-4 mt-4">
          <View className="flex flex-row items-center justify-between">
            <Text className="font-rubik-medium text-black-300">
              Card ending in {preferences.cardLastFour}
            </Text>
            <Text className="text-sm font-rubik text-black-200">
              {preferences.cardExpiry}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRemovePayment}
            className="mt-3 self-start"
          >
            <Text className="text-sm font-rubik-medium text-danger">
              Remove card
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text className="text-sm font-rubik text-black-200 mt-3">
          No payment methods saved.
        </Text>
      )}

      <TouchableOpacity
        onPress={() => setShowPaymentForm((current) => !current)}
        className="bg-primary-300 rounded-full py-3 mt-5 items-center"
      >
        <Text className="text-white font-rubik-medium">
          {showPaymentForm ? "Cancel" : "Add payment method"}
        </Text>
      </TouchableOpacity>

      {showPaymentForm ? (
        <View className="bg-white rounded-2xl p-4 mt-4">
          <TextInput
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="number-pad"
            placeholder="Card number"
            placeholderTextColor="#8E8E8E"
            className="border border-primary-200 rounded-xl px-3 py-3 text-base font-rubik text-black-300"
          />
          <TextInput
            value={cardExpiry}
            onChangeText={setCardExpiry}
            placeholder="MM/YY"
            placeholderTextColor="#8E8E8E"
            maxLength={5}
            className="border border-primary-200 rounded-xl px-3 py-3 text-base font-rubik text-black-300 mt-3"
          />
          <TouchableOpacity
            onPress={handleSavePayment}
            disabled={savingPayment}
            className="bg-primary-300 rounded-full py-3 mt-4 items-center"
          >
            {savingPayment ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-rubik-medium">Save card</Text>
            )}
          </TouchableOpacity>
          <Text className="text-xs font-rubik text-black-200 mt-3">
            Only the last four digits and expiry are saved locally.
          </Text>
        </View>
      ) : null}
    </SettingsCard>
  );

  const renderNotifications = () => (
    <SettingsCard>
      <Text className="text-lg font-rubik-bold text-black-300">
        Notification preferences
      </Text>
      <View className="flex flex-row items-center justify-between mt-5">
        <View className="flex-1 pr-4">
          <Text className="font-rubik-medium text-black-300">
            Push notifications
          </Text>
          <Text className="text-sm font-rubik text-black-200 mt-1">
            Get updates about bookings and new homes.
          </Text>
        </View>
        <Switch
          value={preferences.pushNotifications}
          onValueChange={(value) =>
            void savePreferences({ pushNotifications: value })
          }
          trackColor={{ false: "#D6D6D6", true: "#0061FF" }}
          thumbColor="#ffffff"
        />
      </View>
      <View className="h-px bg-primary-200 mt-5" />
      <View className="flex flex-row items-center justify-between mt-5">
        <View className="flex-1 pr-4">
          <Text className="font-rubik-medium text-black-300">
            Email updates
          </Text>
          <Text className="text-sm font-rubik text-black-200 mt-1">
            Receive booking and account summaries by email.
          </Text>
        </View>
        <Switch
          value={preferences.emailUpdates}
          onValueChange={(value) =>
            void savePreferences({ emailUpdates: value })
          }
          trackColor={{ false: "#D6D6D6", true: "#0061FF" }}
          thumbColor="#ffffff"
        />
      </View>
    </SettingsCard>
  );

  const renderSecurity = () => (
    <SettingsCard>
      <Text className="text-lg font-rubik-bold text-black-300">
        Change password
      </Text>
      <TextInput
        value={oldPassword}
        onChangeText={setOldPassword}
        secureTextEntry
        placeholder="Current password"
        placeholderTextColor="#8E8E8E"
        className="bg-white rounded-2xl px-4 py-3 mt-4 text-base font-rubik text-black-300"
      />
      <TextInput
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        placeholder="New password"
        placeholderTextColor="#8E8E8E"
        className="bg-white rounded-2xl px-4 py-3 mt-3 text-base font-rubik text-black-300"
      />
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        placeholder="Confirm new password"
        placeholderTextColor="#8E8E8E"
        className="bg-white rounded-2xl px-4 py-3 mt-3 text-base font-rubik text-black-300"
      />
      <TouchableOpacity
        onPress={handleSavePassword}
        disabled={savingPassword || !user}
        className="bg-primary-300 rounded-full py-3 mt-4 items-center"
      >
        {savingPassword ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="text-white font-rubik-medium">
            Update password
          </Text>
        )}
      </TouchableOpacity>
      {!user ? (
        <Text className="text-xs font-rubik text-black-200 mt-3 text-center">
          Sign in to update your password.
        </Text>
      ) : null}
    </SettingsCard>
  );

  const renderLanguage = () => (
    <SettingsCard>
      <Text className="text-lg font-rubik-bold text-black-300">
        App language
      </Text>
      {languageOptions.map((language) => (
        <TouchableOpacity
          key={language}
          onPress={() => void savePreferences({ language })}
          className="flex flex-row items-center justify-between py-4 border-b border-primary-200"
        >
          <Text className="font-rubik-medium text-black-300">{language}</Text>
          {preferences.language === language ? (
            <Text className="font-rubik-medium text-primary-300">Selected</Text>
          ) : null}
        </TouchableOpacity>
      ))}
    </SettingsCard>
  );

  const renderHelpCenter = () => (
    <SettingsCard>
      <Text className="text-lg font-rubik-bold text-black-300">
        Frequently asked questions
      </Text>
      {faqs.map((faq, index) => (
        <View key={faq.question} className="border-b border-primary-200">
          <TouchableOpacity
            onPress={() =>
              setExpandedFaq((current) => (current === index ? null : index))
            }
            className="flex flex-row items-center justify-between py-4"
          >
            <Text className="flex-1 font-rubik-medium text-black-300 pr-3">
              {faq.question}
            </Text>
            <Text className="text-primary-300 text-xl">
              {expandedFaq === index ? "−" : "+"}
            </Text>
          </TouchableOpacity>
          {expandedFaq === index ? (
            <Text className="text-sm font-rubik text-black-200 pb-4 leading-6">
              {faq.answer}
            </Text>
          ) : null}
        </View>
      ))}
    </SettingsCard>
  );

  const renderSection = () => {
    switch (section) {
      case "Profile":
        return renderProfile();
      case "Payments":
        return renderPayments();
      case "Notifications":
        return renderNotifications();
      case "Security":
        return renderSecurity();
      case "Language":
        return renderLanguage();
      case "Help Center":
        return renderHelpCenter();
      default:
        return renderHelpCenter();
    }
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-12 px-5"
      >
        <View className="flex flex-row items-center pt-5">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-primary-200 rounded-full size-11 items-center justify-center"
          >
            <Image source={icons.backArrow} className="size-5" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-xl font-rubik-bold text-black-300 ml-[-44px]">
            {sectionTitles[section] ?? "Settings"}
          </Text>
        </View>

        {preferencesLoading ? (
          <ActivityIndicator size="small" className="text-primary-300 mt-6" />
        ) : (
          renderSection()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
