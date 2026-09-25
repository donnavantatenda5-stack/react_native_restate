import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";

import Comment from "@/components/Comment";
import { PropertyImage } from "@/components/Cards";
import NoResults from "@/components/NoResults";

import icons from "@/constants/icons";
import images from "@/constants/images";

import { getPropertyById } from "@/lib/appwrite";
import { useFavorites } from "@/lib/favorites-provider";
import { useAppwrite } from "@/lib/useAppwrite";
import { createBooking } from "@/lib/bookings";

const facilitiesIcons: Record<string, any> = {
  Laundry: icons.laundry,
  "Car Parking": icons.carPark,
  "Sports Center": icons.run,
  Cutlery: icons.cutlery,
  Gym: icons.dumbell,
  "Swimming pool": icons.swim,
  Wifi: icons.wifi,
  "Pet Center": icons.dog,
};

const specs = (property: Record<string, any>) => [
  {
    label: "Bedrooms",
    value: property.bedrooms,
    icon: icons.bed,
  },
  {
    label: "Bathrooms",
    value: property.bathrooms,
    icon: icons.bath,
  },
  {
    label: "Area",
    value: `${property.area} sqft`,
    icon: icons.area,
  },
];

const getInitialBookingDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const formatBookingDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const Property = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bookingDate, setBookingDate] = useState(getInitialBookingDate);
  const [guests, setGuests] = useState("1");
  const [booking, setBooking] = useState(false);

  const {
    data: property,
    loading,
  } = useAppwrite({
    fn: getPropertyById,
    params: { id: id ?? "" },
    skip: !id,
  });

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setBookingDate(selectedDate);
    }
    if (event.type === "dismissed") {
      setShowDatePicker(false);
    }
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setShowDatePicker(false);
  };

  const handleConfirmBooking = async () => {
    if (!property) {
      return;
    }

    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
      Alert.alert("Invalid guests", "Enter between 1 and 20 guests.");
      return;
    }

    if (bookingDate.getTime() < new Date().setHours(0, 0, 0, 0)) {
      Alert.alert("Invalid date", "Choose today or a future date.");
      return;
    }

    try {
      setBooking(true);
      await createBooking({
        property: {
          $id: property.$id,
          name: property.name,
          address: property.address,
          price: property.price,
          image: property.image,
        },
        date: bookingDate,
        guests: guestCount,
      });
      closeBookingModal();
      Alert.alert(
        "Booking confirmed",
        `${property.name} is booked for ${formatBookingDate(bookingDate)}.`,
        [{ text: "View bookings", onPress: () => router.push("/bookings") }]
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unable to save booking";
      Alert.alert("Booking failed", message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View className="h-full bg-white flex items-center justify-center">
        <ActivityIndicator size="large" className="text-primary-300" />
      </View>
    );
  }

  if (!property) {
    return <NoResults />;
  }

  const agent = property.agent;
  const reviews = Array.isArray(property.reviews) ? property.reviews : [];
  const facilities = Array.isArray(property.facilities)
    ? property.facilities.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0
      )
    : [];

  return (
    <View className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-24"
      >
        <View className="relative w-full">
          <PropertyImage
            item={{ $id: property.$id ?? id ?? "", image: property.image }}
            className="w-full h-72"
            resizeMode="cover"
          />
          <Image
            source={images.whiteGradient}
            className="absolute top-0 w-full h-72 z-40"
          />

          <View className="absolute top-10 left-5 right-5 z-50 flex flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="bg-white rounded-full size-11 flex items-center justify-center"
            >
              <Image source={icons.backArrow} className="size-5" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleFavorite(id ?? "")}
              className="bg-white rounded-full size-11 flex items-center justify-center"
            >
              <Image
                source={icons.heart}
                className="size-5"
                tintColor={isFavorite(id ?? "") ? "#F75555" : "#0061FF"}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-5 mt-5 flex gap-2">
          <Text className="text-2xl font-rubik-bold text-black-300">
            {property.name}
          </Text>

          <View className="flex flex-row items-center gap-2">
            <Image
              source={icons.location}
              className="w-5 h-5"
              resizeMode="contain"
            />
            <Text className="text-sm font-rubik text-black-200">
              {property.address}
            </Text>
          </View>

          <Text className="text-base font-rubik text-black-200 mt-10 leading-7">
            {property.description}
          </Text>
        </View>

        <View className="flex flex-row justify-between mt-5 px-5">
          {specs(property).map((item, index) => (
            <View
              key={index}
              className="flex flex-row items-center flex-1 min-w-[100px]"
            >
              <Image source={item.icon} className="size-5 mr-2" />
              <Text className="text-base font-rubik text-black-200">
                {item.value} {item.label}
              </Text>
            </View>
          ))}
        </View>

        {facilities.length > 0 && (
          <View className="px-5 mt-6">
            <Text className="text-xl font-rubik-bold text-black-300">
              Facilities
            </Text>
            <View className="flex flex-row flex-wrap gap-3 mt-4">
              {facilities.map((item: string, index: number) => (
                <View key={`${item}-${index}`} className="w-[48%]">
                  <View className="flex flex-row items-center min-h-16 bg-primary-100 rounded-2xl px-3 py-3">
                    <View className="bg-white rounded-xl p-2">
                      <Image
                        source={facilitiesIcons[item] ?? icons.info}
                        className="size-6"
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      numberOfLines={2}
                      className="flex-1 text-sm font-rubik-medium text-black-300 ml-2"
                    >
                      {item}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}


        {agent ? (
          <View className="px-5 mt-5 flex gap-2">
            <Text className="text-xl font-rubik-bold text-black-300">
              Agent
            </Text>
            <View className="flex flex-row items-center justify-between mt-3">
              <View className="flex flex-row items-center gap-4">
                <Image
                  source={{ uri: agent.avatar }}
                  className="size-16 rounded-full"
                />
                <View className="flex flex-col gap-1">
                  <Text className="text-xl font-rubik-bold text-black-300">
                    {agent.name}
                  </Text>
                  <Text className="text-sm font-rubik text-black-200">
                    {agent.email}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center gap-4">
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Contact Agent", agent.email ?? "No email")
                  }
                  className="bg-primary-200 rounded-full size-11 flex items-center justify-center"
                >
                  <Image source={icons.phone} className="size-6" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Contact Agent", agent.email ?? "No email")
                  }
                  className="bg-primary-200 rounded-full size-11 flex items-center justify-center"
                >
                  <Image source={icons.chat} className="size-6" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : null}

        {reviews.length > 0 && (
          <View className="px-5 mt-5 flex gap-2">
            <Text className="text-xl font-rubik-bold text-black-300">
              Reviews
            </Text>
            <View className="mt-4 flex gap-6">
              {reviews.map((review: Record<string, any>) => (
                <Comment key={review.$id} item={review as any} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-primary-200 px-5 py-5 flex flex-row items-center justify-between">
        <Text className="text-2xl font-rubik-bold text-primary-300">
          ${property.price}
        </Text>
         <TouchableOpacity
           onPress={() => setShowBookingModal(true)}
           className="bg-primary-300 rounded-full px-6 py-3"
         >
           <Text className="text-white font-rubik-medium text-base">Book Now</Text>
         </TouchableOpacity>
       </View>

       <Modal
         visible={showBookingModal}
         transparent
         animationType="slide"
         onRequestClose={closeBookingModal}
       >
         <KeyboardAvoidingView
           behavior={Platform.OS === "ios" ? "padding" : undefined}
           className="flex-1 justify-end bg-black/50"
         >
           <View className="bg-white rounded-3xl px-6 pt-6 pb-8">
             <View className="flex flex-row items-center justify-between">
               <Text className="text-2xl font-rubik-bold text-black-300">
                 Book this property
               </Text>
               <TouchableOpacity
                 onPress={closeBookingModal}
                 className="bg-primary-100 rounded-full size-10 items-center justify-center"
               >
                 <Text className="text-primary-300 text-xl">×</Text>
               </TouchableOpacity>
             </View>

             <Text className="text-base font-rubik text-black-200 mt-2">
               Choose your stay details for {property.name}.
             </Text>

             <Text className="text-sm font-rubik-medium text-black-300 mt-6">
               Move-in date
             </Text>
             <TouchableOpacity
               onPress={() => setShowDatePicker(true)}
               className="flex flex-row items-center justify-between border border-primary-200 rounded-2xl px-4 py-3 mt-2"
             >
               <Text className="text-base font-rubik text-black-300">
                 {formatBookingDate(bookingDate)}
               </Text>
               <Image source={icons.calendar} className="size-5" />
             </TouchableOpacity>

             {showDatePicker && Platform.OS !== "web" ? (
               <DateTimePicker
                 value={bookingDate}
                 mode="date"
                 minimumDate={new Date()}
                 onChange={handleDateChange}
               />
             ) : null}

             <Text className="text-sm font-rubik-medium text-black-300 mt-6">
               Guests
             </Text>
             <TextInput
               value={guests}
               onChangeText={(value) =>
                 setGuests(value.replace(/[^0-9]/g, ""))
               }
               keyboardType="number-pad"
               className="border border-primary-200 rounded-2xl px-4 py-3 mt-2 text-base font-rubik text-black-300"
               placeholder="1"
               placeholderTextColor="#8E8E8E"
             />

             <TouchableOpacity
               onPress={handleConfirmBooking}
               disabled={booking}
               className="bg-primary-300 rounded-full py-4 mt-7 items-center"
             >
               {booking ? (
                 <ActivityIndicator size="small" color="#ffffff" />
               ) : (
                 <Text className="text-white font-rubik-medium text-base">
                   Confirm booking
                 </Text>
               )}
             </TouchableOpacity>
           </View>
         </KeyboardAvoidingView>
       </Modal>
     </View>
   );
 };

 export default Property;
