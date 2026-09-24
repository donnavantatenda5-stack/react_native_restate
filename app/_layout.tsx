import { useEffect, useRef, useState } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import "./global.css";
import GlobalProvider, { useGlobalContext } from "@/lib/global-provider";
import { FavoritesProvider } from "@/lib/favorites-provider";

function RootNavigator() {
  const { canEnter, loading } = useGlobalContext();
  const [splashDone, setSplashDone] = useState(false);
  const wasAbleToEnter = useRef<boolean | null>(null);

  useEffect(() => {
    if (loading || splashDone) {
      return;
    }
    const timer = setTimeout(() => setSplashDone(true), 2500);
    return () => clearTimeout(timer);
  }, [loading, splashDone]);

  useEffect(() => {
    if (wasAbleToEnter.current === true && !canEnter) {
      setSplashDone(false);
    }
    wasAbleToEnter.current = canEnter;
  }, [canEnter]);

  const showSplash = loading || !splashDone;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {showSplash ? (
        <Stack.Screen name="splash" />
      ) : !canEnter ? (
        <Stack.Screen name="sign-in" />
      ) : (
        <Stack.Screen name="(root)" />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
    "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
    "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
    "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
    "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GlobalProvider>
      <FavoritesProvider>
        <RootNavigator />
      </FavoritesProvider>
    </GlobalProvider>
  );
}