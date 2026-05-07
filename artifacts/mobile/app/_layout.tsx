import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="filters"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Filters',
          headerTintColor: '#0284C7',
          headerStyle: { backgroundColor: '#F8FBFF' },
        }}
      />
      <Stack.Screen
        name="user/[id]"
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerTintColor: '#FFFFFF',
        }}
      />
      <Stack.Screen
        name="housing-detail/[id]"
        options={{
          headerShown: true,
          headerTitle: '',
          headerTransparent: true,
          headerTintColor: '#FFFFFF',
        }}
      />
      <Stack.Screen
        name="chat/[id]"
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: true,
          headerTitle: 'Settings',
          headerTintColor: '#0284C7',
          headerStyle: { backgroundColor: '#F8FBFF' },
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerTintColor: '#0284C7',
          headerStyle: { backgroundColor: '#F8FBFF' },
        }}
      />
      <Stack.Screen
        name="shortlist"
        options={{
          headerShown: true,
          headerTitle: 'Shortlist',
          headerTintColor: '#0284C7',
          headerStyle: { backgroundColor: '#F8FBFF' },
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
