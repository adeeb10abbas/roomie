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
  const handledNotificationId = useRef<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const notifId = response.notification.request.identifier;
      if (handledNotificationId.current === notifId) return;
      handledNotificationId.current = notifId;
      const data = response.notification.request.content.data as { screen?: string; matchId?: string };
      routeFromNotificationData(data);
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const notifId = response.notification.request.identifier;
      if (handledNotificationId.current === notifId) return;
      handledNotificationId.current = notifId;
      const data = response.notification.request.content.data as { screen?: string; matchId?: string };
      routeFromNotificationData(data);
    });
    return () => { responseListener.current?.remove(); };
  }, []);

  return null;
}

const headerCommonStyle = {
  headerTintColor: '#0284C7' as const,
  headerStyle: { backgroundColor: '#F8FBFF' as const },
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="filters" options={{ presentation: 'modal', headerShown: true, headerTitle: 'Filters', ...headerCommonStyle }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: true, headerTitle: '', headerTransparent: true, headerTintColor: '#FFFFFF' }} />
      <Stack.Screen name="housing-detail/[id]" options={{ headerShown: true, headerTitle: '', headerTransparent: true, headerTintColor: '#FFFFFF' }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="settings" options={{ headerShown: true, headerTitle: 'Settings', ...headerCommonStyle }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: true, headerTitle: 'Edit Profile', ...headerCommonStyle }} />
      <Stack.Screen name="shortlist" options={{ headerShown: true, headerTitle: 'Shortlist', ...headerCommonStyle }} />
      <Stack.Screen name="verify-edu" options={{ headerShown: false }} />
      <Stack.Screen name="blocked-users" options={{ headerShown: false }} />
      <Stack.Screen name="privacy" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false }} />
      <Stack.Screen name="delete-account" options={{ headerShown: false }} />
      <Stack.Screen name="feedback" options={{ headerShown: false }} />
      <Stack.Screen name="housing-create" options={{ presentation: 'modal', headerShown: true, headerTitle: 'List a Space', ...headerCommonStyle }} />
      <Stack.Screen name="housing-requests/[id]" options={{ headerShown: true, headerTitle: 'Join Requests', ...headerCommonStyle }} />
      <Stack.Screen name="terms" options={{ headerShown: true, headerTitle: 'Terms of Service', ...headerCommonStyle }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: true, headerTitle: 'Privacy Policy', ...headerCommonStyle }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
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
