import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../src/auth";

export default function Index() {
  const { loading, token, onboarded } = useAuth();

  if (loading) {
    return (
      <View style={styles.container} testID="splash-loading">
        <ActivityIndicator size="large" color="#002FA7" />
      </View>
    );
  }

  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!token) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(app)/dashboard" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
