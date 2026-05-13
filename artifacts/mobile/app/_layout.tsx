import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router as expoRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function routeFromNotificationData(data: { screen?: string; matchId?: string }): void {
  if (data?.screen === "chat" && data.matchId) {
    expoRouter.push(`/chat/${data.matchId}`);
  } else if (data?.screen === "messages") {
    expoRouter.push("/(tabs)/messages");
  }
}

function NotificationHandler() {
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  // Track the notification ID we already acted on to prevent duplicate navigations
  const handledNotificationId = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Cold-start: app was terminated when user tapped the notification.
    // getLastNotificationResponseAsync() returns the tap that launched the app.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const notifId = response.notification.request.identifier;
      if (handledNotificationId.current === notifId) return;
      handledNotificationId.current = notifId;

      const data = response.notification.request.content.data as {
        screen?: string;
        matchId?: string;
      };
      routeFromNotificationData(data);
    });

    // Foreground / background tap: app was already running.
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const notifId = response.notification.request.identifier;
      if (handledNotificationId.current === notifId) return;
      handledNotificationId.current = notifId;

      const data = response.notification.request.content.data as {
        screen?: string;
        matchId?: string;
      };
      routeFromNotificationData(data);
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  return null;
}

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
                <NotificationHandler />
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
