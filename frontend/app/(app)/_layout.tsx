import { Tabs } from "expo-router";
import { LayoutDashboard, Users, KanbanSquare, CheckSquare, User } from "lucide-react-native";
import { Platform } from "react-native";
import { useI18n } from "../../src/i18n";

export default function AppLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#002FA7",
        tabBarInactiveTintColor: "#A1A1AA",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E4E4E7",
          borderTopWidth: 1,
          height: Platform.OS === "ios" ? 88 : 64,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("tabs.dashboard"),
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: t("tabs.contacts"),
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="pipeline"
        options={{
          title: t("tabs.pipeline"),
          tabBarIcon: ({ color, size }) => <KanbanSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t("tabs.tasks"),
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="contact/[id]" options={{ href: null }} />
    </Tabs>
  );
}
