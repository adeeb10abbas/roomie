import { Redirect } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { View, ActivityIndicator } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function Index() {
  const { isAuthenticated, loading, hasProfile, isGuest } = useApp();
  const colors = useColors();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (isGuest) {
    return <Redirect href="/(tabs)" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!hasProfile) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
