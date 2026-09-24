import { useEffect } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import Search from "@/components/Search";
import Filters from "@/components/Filters";
import NoResults from "@/components/NoResults";
import { Card, CardProps, FeaturedCard } from "@/components/Cards";

import icons from "@/constants/icons";
import images from "@/constants/images";

import { useAppwrite } from "@/lib/useAppwrite";
import { getLatestProperties, getProperties } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";

const Home = () => {
  const params = useLocalSearchParams<{ query?: string; filter?: string }>();
  const { user, avatar } = useGlobalContext();

  const { data: latestProperties, loading: latestLoading } = useAppwrite({
    fn: getLatestProperties,
  });

  const {
    data: properties,
    loading: propertiesLoading,
    refetch: refetchProperties,
  } = useAppwrite({
    fn: getProperties,
    params: {
      filter: params.filter!,
      query: params.query!,
    },
    skip: true,
  });

  useEffect(() => {
    refetchProperties({
      filter: params.filter!,
      query: params.query!,
    });
  }, [params.filter, params.query, refetchProperties]);

  const handleCardPress = (id: string) => router.push(`/properties/${id}`);

  const latest = latestProperties ?? [];

  return (
    <SafeAreaView className="h-full bg-white">
      <FlatList
        data={properties}
        numColumns={2}
        renderItem={({ item }) => (
          <Card
            item={item as unknown as CardProps["item"]}
            onPress={() => handleCardPress(item.$id)}
          />
        )}
        keyExtractor={(item) => item.$id}
        contentContainerClassName="pb-32"
        columnWrapperClassName="flex gap-5 px-5"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          propertiesLoading ? (
            <ActivityIndicator size="large" className="text-primary-300 mt-5" />
          ) : ( 
            <NoResults />
          )
        }
        ListHeaderComponent={
          <View className="px-5">
            <View className="flex flex-row items-center justify-between mt-5">
              <View className="flex flex-row items-center">
                <Image
                  source={avatar ? { uri: avatar } : images.avatar}
                  className="size-12 rounded-full"
                />
                <View className="flex flex-col items-start ml-2 justify-center">
                  <Text className="text-xs font-rubik text-black-100">
                    Good Morning
                  </Text>
                  <Text className="text-base font-rubik-medium text-black-300">
                    {user?.name ?? "Guest"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Notifications", "Notifications are coming soon.")
                }
                className="bg-primary-100 rounded-full size-10 flex items-center justify-center"
              >
                <Image source={icons.bell} className="size-6" />
              </TouchableOpacity>
            </View>

            <Search />

            <View className="my-5">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-xl font-rubik-bold text-black-300">
                  Featured
                </Text>
                <TouchableOpacity onPress={() => router.push("/explore")}>
                  <Text className="text-base font-rubik-bold text-primary-300">
                    See all
                  </Text>
                </TouchableOpacity>
              </View>

              {latestLoading ? (
                <ActivityIndicator
                  size="small"
                  className="text-primary-300 mt-10"
                />
              ) : (
                <FlatList
                  data={latest}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerClassName="flex gap-5 mt-5"
                  keyExtractor={(item) => item.$id}
                  renderItem={({ item }) => (
                    <FeaturedCard
                      item={item as unknown as CardProps["item"]}
                      onPress={() => handleCardPress(item.$id)}
                    />
                  )}
                />
              )}
            </View>

            <View className="flex flex-row items-center justify-between">
              <Text className="text-xl font-rubik-bold text-black-300">
                Our Recommendations
              </Text>
              <TouchableOpacity onPress={() => router.push("/explore")}>
                <Text className="text-base font-rubik-bold text-black-300">
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            <Filters />
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Home;