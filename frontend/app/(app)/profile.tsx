import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { LogOut, Mail, User as UserIcon, Cloud, ChevronRight, Bell, Shield, HelpCircle } from "lucide-react-native";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const onLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const initials = (user?.full_name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <View style={styles.userCard} testID="profile-user-card">
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.full_name || "User"}</Text>
            <View style={styles.userRow}>
              <Mail size={12} color="#52525B" />
              <Text style={styles.userMail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>CLOUD INTEGRATIONS</Text>
        <View style={styles.group}>
          <Row
            icon={<Cloud size={18} color="#0A0A0A" />}
            title="Cloud Sync"
            subtitle="Backup & sync with cloud (coming soon)"
            badge="SOON"
            testID="profile-cloud"
          />
        </View>

        <Text style={styles.section}>PREFERENCES</Text>
        <View style={styles.group}>
          <Row icon={<Bell size={18} color="#0A0A0A" />} title="Notifications" testID="profile-notifications" />
          <Row icon={<Shield size={18} color="#0A0A0A" />} title="Privacy & Security" testID="profile-privacy" />
          <Row icon={<HelpCircle size={18} color="#0A0A0A" />} title="Help & Support" testID="profile-help" />
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <TouchableOpacity style={styles.logout} onPress={onLogout} testID="profile-logout-btn">
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Driftask · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  icon,
  title,
  subtitle,
  badge,
  testID,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  testID?: string;
}) {
  return (
    <TouchableOpacity style={styles.row} testID={testID}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      <ChevronRight size={18} color="#A1A1AA" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  title: { fontSize: 32, fontWeight: "800", color: "#0A0A0A", letterSpacing: -1 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginHorizontal: 24,
    backgroundColor: "#0A0A0A",
    borderRadius: 8,
    padding: 20,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#002FA7", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" },
  userName: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  userRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  userMail: { color: "#A1A1AA", fontSize: 13 },
  section: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A1A1AA",
    letterSpacing: 1.5,
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 8,
  },
  group: { marginHorizontal: 24, borderWidth: 1, borderColor: "#E4E4E7", borderRadius: 8, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
  },
  rowIcon: { width: 36, height: 36, borderRadius: 4, backgroundColor: "#F4F4F5", alignItems: "center", justifyContent: "center" },
  rowTitle: { fontSize: 15, fontWeight: "600", color: "#0A0A0A" },
  rowSubtitle: { fontSize: 12, color: "#52525B", marginTop: 2 },
  badge: { backgroundColor: "#F4F4F5", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#52525B", letterSpacing: 0.5 },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  logoutText: { color: "#EF4444", fontWeight: "700", fontSize: 16 },
  version: { textAlign: "center", color: "#A1A1AA", fontSize: 12, marginTop: 24 },
});
