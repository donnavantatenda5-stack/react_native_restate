import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import Comment from "@/components/Comment";
import NoResults from "@/components/NoResults";

import icons from "@/constants/icons";
import images from "@/constants/images";

import { getPropertyById } from "@/lib/appwrite";
import { useFavorites } from "@/lib/favorites-provider";
import { useAppwrite } from "@/lib/useAppwrite";

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

const Property = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();

  const {
    data: property,
    loading,
  } = useAppwrite({
    fn: getPropertyById,
    params: { id: id ?? "" },
    skip: !id,
  });

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
    ? property.facilities
    : [];

  return (
    <View className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-24"
      >
        <View className="relative w-full">
          <Image
            source={{ uri: property.image }}
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
          <View className="px-5 mt-5 flex gap-2">
            <Text className="text-xl font-rubik-bold text-black-300">
              Facilities
            </Text>
            <View className="flex flex-row flex-wrap justify-between mt-5 gap-4">
              {facilities.map((item: string, index: number) => (
                <View
                  key={index}
                  className="flex flex-row flex-1 items-center min-w-1/4"
                >
                  <Image
                    source={facilitiesIcons[item] ?? icons.info}
                    className="size-7"
                  />
                  <Text className="text-base font-rubik text-black-300 ml-2">
                    {item}
                  </Text>
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
          onPress={() => Alert.alert("Book Now", "Booking is coming soon")}
          className="bg-primary-300 rounded-full px-6 py-3"
        >
          <Text className="text-white font-rubik-medium text-base">Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Property;