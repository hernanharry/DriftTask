import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { apiFetch, useAuth } from "../../src/auth";
import {
  TrendingUp,
  Users,
  Target,
  CheckSquare,
  ArrowUpRight,
  DollarSign,
  Activity,
} from "lucide-react-native";

const { width } = Dimensions.get("window");
const CARD_W = width - 48 - 32; // screen padding * 2 + reveal next 32

type Stats = {
  total_contacts: number;
  total_deals: number;
  won_deals: number;
  open_tasks: number;
  revenue: number;
  pipeline_value: number;
  conversion_rate: number;
  deals_by_stage: Record<string, number>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/dashboard/stats");
      setStats(data);
    } catch (e) {
      console.warn("stats", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

  const metricCards = [
    {
      label: "Revenue",
      value: fmtMoney(stats?.revenue || 0),
      icon: <DollarSign size={20} color="#002FA7" />,
      hint: "from won deals",
      accent: "#002FA7",
    },
    {
      label: "Pipeline Value",
      value: fmtMoney(stats?.pipeline_value || 0),
      icon: <TrendingUp size={20} color="#10B981" />,
      hint: "across all stages",
      accent: "#10B981",
    },
    {
      label: "Conversion",
      value: `${stats?.conversion_rate ?? 0}%`,
      icon: <Activity size={20} color="#F59E0B" />,
      hint: "won / total deals",
      accent: "#F59E0B",
    },
    {
      label: "Won Deals",
      value: `${stats?.won_deals ?? 0}`,
      icon: <Target size={20} color="#0A0A0A" />,
      hint: "this period",
      accent: "#0A0A0A",
    },
  ];

  const firstName = (user?.full_name || "there").split(" ")[0];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#002FA7" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Hello, {firstName}</Text>
            <Text style={styles.brand}>Driftask</Text>
          </View>
          <View style={styles.brandMark} />
        </View>

        <Text style={styles.sectionLabel}>METRICS — SWIPE</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={CARD_W + 12}
          snapToAlignment="start"
          contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 32 }}
          testID="metrics-carousel"
        >
          {metricCards.map((m, i) => (
            <View
              key={i}
              style={[styles.metricCard, { width: CARD_W, marginRight: 12 }]}
              testID={`metric-card-${i}`}
            >
              <View style={styles.metricTop}>
                <View style={styles.metricIconWrap}>{m.icon}</View>
                <ArrowUpRight size={18} color="#A1A1AA" />
              </View>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
              <View style={[styles.metricBar, { backgroundColor: m.accent }]} />
              <Text style={styles.metricHint}>{m.hint}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bento}>
          <TouchableOpacity
            style={styles.bentoBox}
            onPress={() => router.push("/(app)/contacts")}
            testID="bento-contacts"
          >
            <Users size={20} color="#0A0A0A" />
            <Text style={styles.bentoValue}>{stats?.total_contacts ?? 0}</Text>
            <Text style={styles.bentoLabel}>Contacts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bentoBox}
            onPress={() => router.push("/(app)/pipeline")}
            testID="bento-deals"
          >
            <Target size={20} color="#0A0A0A" />
            <Text style={styles.bentoValue}>{stats?.total_deals ?? 0}</Text>
            <Text style={styles.bentoLabel}>Active Deals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bentoBox}
            onPress={() => router.push("/(app)/tasks")}
            testID="bento-tasks"
          >
            <CheckSquare size={20} color="#0A0A0A" />
            <Text style={styles.bentoValue}>{stats?.open_tasks ?? 0}</Text>
            <Text style={styles.bentoLabel}>Open Tasks</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>PIPELINE BREAKDOWN</Text>
        <View style={styles.stageList}>
          {["lead", "qualified", "proposal", "negotiation", "won", "lost"].map((s) => (
            <View key={s} style={styles.stageRow} testID={`stage-row-${s}`}>
              <Text style={styles.stageName}>{s}</Text>
              <View style={styles.stageBarWrap}>
                <View
                  style={[
                    styles.stageBar,
                    {
                      width: `${Math.min(((stats?.deals_by_stage?.[s] || 0) / Math.max(stats?.total_deals || 1, 1)) * 100, 100)}%`,
                      backgroundColor: s === "won" ? "#10B981" : s === "lost" ? "#EF4444" : "#002FA7",
                    },
                  ]}
                />
              </View>
              <Text style={styles.stageCount}>{stats?.deals_by_stage?.[s] || 0}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  hello: { fontSize: 14, color: "#52525B" },
  brand: { fontSize: 32, fontWeight: "800", color: "#0A0A0A", letterSpacing: -1 },
  brandMark: { width: 16, height: 16, backgroundColor: "#002FA7" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A1A1AA",
    letterSpacing: 1.5,
    paddingHorizontal: 24,
    marginBottom: 12,
    marginTop: 16,
  },
  metricCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 8,
    padding: 20,
    minHeight: 160,
  },
  metricTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: "#F4F4F5",
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: { fontSize: 12, color: "#52525B", marginTop: 16, fontWeight: "500" },
  metricValue: { fontSize: 32, fontWeight: "800", color: "#0A0A0A", letterSpacing: -1, marginTop: 4 },
  metricBar: { height: 3, width: 32, marginTop: 12 },
  metricHint: { fontSize: 12, color: "#A1A1AA", marginTop: 8 },
  bento: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 12,
  },
  bentoBox: {
    flex: 1,
    backgroundColor: "#F4F4F5",
    borderRadius: 8,
    padding: 16,
    minHeight: 110,
    justifyContent: "space-between",
  },
  bentoValue: { fontSize: 28, fontWeight: "800", color: "#0A0A0A", letterSpacing: -0.5 },
  bentoLabel: { fontSize: 12, color: "#52525B", fontWeight: "500" },
  stageList: { paddingHorizontal: 24, gap: 12 },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stageName: {
    width: 92,
    fontSize: 12,
    fontWeight: "600",
    color: "#0A0A0A",
    textTransform: "capitalize",
  },
  stageBarWrap: {
    flex: 1,
    height: 8,
    backgroundColor: "#F4F4F5",
    borderRadius: 4,
    overflow: "hidden",
  },
  stageBar: { height: "100%", borderRadius: 4 },
  stageCount: { width: 28, fontSize: 14, fontWeight: "700", color: "#0A0A0A", textAlign: "right" },
});
