import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageSourcePropType,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import icons from "@/constants/icons";
import images from "@/constants/images";
import { Booking, cancelBooking, getBookings } from "@/lib/bookings";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getBookingImage = (image: Booking["image"]): ImageSourcePropType => {
  if (typeof image === "number") {
    return image;
  }

  return image ? { uri: image } : images.newYork;
};

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void getBookings()
      .then((storedBookings) => {
        if (active) {
          setBookings(storedBookings);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      "Cancel booking",
      `Are you sure you want to cancel your booking for ${booking.propertyName}?`,
      [
        { text: "Keep booking", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelBooking(booking.id);
              setBookings(await getBookings());
            } catch (error: unknown) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Unable to cancel booking";
              Alert.alert("Cancellation failed", message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <FlatList
        data={bookings}
        keyExtractor={(booking) => booking.id}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
        ListHeaderComponent={
          <View className="px-5 pt-5">
            <View className="flex flex-row items-center">
              <TouchableOpacity
                onPress={() => router.back()}
                className="bg-primary-200 rounded-full size-11 items-center justify-center"
              >
                <Image source={icons.backArrow} className="size-5" />
              </TouchableOpacity>
              <Text className="flex-1 text-center text-xl font-rubik-bold text-black-300 mr-11">
                My Bookings
              </Text>
            </View>
            <Text className="text-base font-rubik text-black-200 mt-5">
              Keep track of your upcoming stays in one place.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="mx-5 mt-5 border border-primary-200 rounded-3xl overflow-hidden">
            <TouchableOpacity
              onPress={() => router.push(`/properties/${item.propertyId}`)}
            >
              <Image
                source={getBookingImage(item.image)}
                className="w-full h-44"
                resizeMode="cover"
              />
            </TouchableOpacity>
            <View className="p-5">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl font-rubik-bold text-black-300 flex-1">
                  {item.propertyName}
                </Text>
                <View className="bg-primary-100 rounded-full px-3 py-1">
                  <Text className="text-xs font-rubik-medium text-primary-300">
                    Confirmed
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center gap-2 mt-3">
                <Image source={icons.location} className="size-4" />
                <Text className="text-sm font-rubik text-black-200 flex-1">
                  {item.address}
                </Text>
              </View>

              <View className="flex flex-row items-center justify-between mt-5">
                <View>
                  <Text className="text-xs font-rubik text-black-100">Move-in</Text>
                  <Text className="text-base font-rubik-medium text-black-300 mt-1">
                    {formatDate(item.date)}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs font-rubik text-black-100">Guests</Text>
                  <Text className="text-base font-rubik-medium text-black-300 mt-1">
                    {item.guests}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs font-rubik text-black-100">Price</Text>
                  <Text className="text-base font-rubik-medium text-primary-300 mt-1">
                    ${item.price}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row gap-3 mt-5">
                <TouchableOpacity
                  onPress={() => router.push(`/properties/${item.propertyId}`)}
                  className="flex-1 bg-primary-100 rounded-full py-3 items-center"
                >
                  <Text className="font-rubik-medium text-primary-300">
                    View property
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleCancelBooking(item)}
                  className="flex-1 border border-danger rounded-full py-3 items-center"
                >
                  <Text className="font-rubik-medium text-danger">Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" className="text-primary-300 mt-20" />
          ) : (
            <View className="items-center px-10 mt-20">
              <Image source={icons.calendar} className="size-16" />
              <Text className="text-xl font-rubik-bold text-black-300 mt-5">
                No bookings yet
              </Text>
              <Text className="text-base font-rubik text-black-200 text-center mt-2">
                Find a home you love and book your stay in a few taps.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/explore")}
                className="bg-primary-300 rounded-full px-6 py-3 mt-6"
              >
                <Text className="text-white font-rubik-medium">
                  Explore homes
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Bookings;
