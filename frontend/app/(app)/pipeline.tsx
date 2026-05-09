import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Plus, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react-native";
import { apiFetch } from "../../src/auth";

const { width } = Dimensions.get("window");
const STAGE_W = width;

const STAGES = [
  { id: "lead", label: "Lead", color: "#A1A1AA" },
  { id: "qualified", label: "Qualified", color: "#0EA5E9" },
  { id: "proposal", label: "Proposal", color: "#F59E0B" },
  { id: "negotiation", label: "Negotiation", color: "#8B5CF6" },
  { id: "won", label: "Won", color: "#10B981" },
  { id: "lost", label: "Lost", color: "#EF4444" },
];

type Deal = {
  id: string;
  title: string;
  value: number;
  stage: string;
  contact_name?: string;
  notes?: string;
};

export default function Pipeline() {
  const scrollRef = useRef<ScrollView>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [contactName, setContactName] = useState("");
  const [stage, setStage] = useState("lead");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/deals");
      setDeals(data);
    } catch (e) {
      console.warn("deals", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / STAGE_W);
    if (i !== stageIndex) setStageIndex(i);
  };

  const goToStage = (i: number) => {
    if (i < 0 || i >= STAGES.length) return;
    scrollRef.current?.scrollTo({ x: i * STAGE_W, animated: true });
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a deal title");
      return;
    }
    try {
      setSaving(true);
      await apiFetch("/deals", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          value: parseFloat(value) || 0,
          stage,
          contact_name: contactName.trim() || null,
        }),
      });
      setTitle("");
      setValue("");
      setContactName("");
      setStage("lead");
      setShowModal(false);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create deal");
    } finally {
      setSaving(false);
    }
  };

  const moveDeal = async (deal: Deal, direction: "prev" | "next") => {
    const idx = STAGES.findIndex((s) => s.id === deal.stage);
    const newIdx = direction === "next" ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= STAGES.length) return;
    const newStage = STAGES[newIdx].id;
    setDeals((prev) => prev.map((d) => (d.id === deal.id ? { ...d, stage: newStage } : d)));
    try {
      await apiFetch(`/deals/${deal.id}`, {
        method: "PATCH",
        body: JSON.stringify({ stage: newStage }),
      });
    } catch (e) {
      load();
    }
  };

  const removeDeal = async (id: string) => {
    try {
      await apiFetch(`/deals/${id}`, { method: "DELETE" });
      setDeals((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to delete");
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Pipeline</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} testID="deal-add-btn">
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {STAGES.map((s, i) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => goToStage(i)}
            style={[styles.tab, i === stageIndex && styles.tabActive]}
            testID={`stage-tab-${s.id}`}
          >
            <View style={[styles.tabDot, { backgroundColor: s.color }]} />
            <Text style={[styles.tabText, i === stageIndex && styles.tabTextActive]}>
              {s.label}
            </Text>
            <Text style={[styles.tabCount, i === stageIndex && styles.tabTextActive]}>
              {deals.filter((d) => d.stage === s.id).length}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        testID="pipeline-stage-scroll"
      >
        {STAGES.map((s, i) => {
          const stageDeals = deals.filter((d) => d.stage === s.id);
          const total = stageDeals.reduce((acc, d) => acc + (d.value || 0), 0);
          return (
            <View key={s.id} style={[styles.stageCol, { width: STAGE_W }]} testID={`stage-col-${s.id}`}>
              <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 8 }}>
                <View style={styles.stageHeader}>
                  <View style={[styles.stageBadge, { backgroundColor: s.color }]} />
                  <Text style={styles.stageTitle}>{s.label}</Text>
                  <Text style={styles.stageTotal}>{fmt(total)}</Text>
                </View>
                {stageDeals.length === 0 ? (
                  <Text style={styles.emptyStage}>No deals in this stage</Text>
                ) : (
                  stageDeals.map((d) => (
                    <View key={d.id} style={styles.dealCard} testID={`deal-card-${d.id}`}>
                      <View style={styles.dealRow}>
                        <Text style={styles.dealTitle}>{d.title}</Text>
                        <TouchableOpacity onPress={() => removeDeal(d.id)} testID={`deal-delete-${d.id}`}>
                          <Trash2 size={14} color="#A1A1AA" />
                        </TouchableOpacity>
                      </View>
                      {d.contact_name ? (
                        <Text style={styles.dealContact}>{d.contact_name}</Text>
                      ) : null}
                      <View style={styles.dealFooter}>
                        <Text style={styles.dealValue}>{fmt(d.value || 0)}</Text>
                        <View style={styles.moveRow}>
                          <TouchableOpacity
                            style={styles.moveBtn}
                            onPress={() => moveDeal(d, "prev")}
                            disabled={i === 0}
                            testID={`deal-move-prev-${d.id}`}
                          >
                            <ChevronLeft size={16} color={i === 0 ? "#E4E4E7" : "#0A0A0A"} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.moveBtn}
                            onPress={() => moveDeal(d, "next")}
                            disabled={i === STAGES.length - 1}
                            testID={`deal-move-next-${d.id}`}
                          >
                            <ChevronRight size={16} color={i === STAGES.length - 1 ? "#E4E4E7" : "#0A0A0A"} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )}
                <View style={{ height: 24 }} />
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Deal</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} testID="deal-modal-close">
                <X size={24} color="#0A0A0A" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>TITLE *</Text>
              <TextInput style={styles.fieldInput} value={title} onChangeText={setTitle} testID="deal-title-input" />

              <Text style={styles.fieldLabel}>VALUE (USD)</Text>
              <TextInput
                style={styles.fieldInput}
                value={value}
                onChangeText={setValue}
                keyboardType="decimal-pad"
                testID="deal-value-input"
              />

              <Text style={styles.fieldLabel}>CONTACT NAME</Text>
              <TextInput
                style={styles.fieldInput}
                value={contactName}
                onChangeText={setContactName}
                testID="deal-contact-input"
              />

              <Text style={styles.fieldLabel}>STAGE</Text>
              <View style={styles.stagePills}>
                {STAGES.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.pill, stage === s.id && styles.pillActive]}
                    onPress={() => setStage(s.id)}
                    testID={`deal-stage-${s.id}`}
                  >
                    <Text style={[styles.pillText, stage === s.id && styles.pillTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.cta, saving && { opacity: 0.7 }]}
                onPress={submit}
                disabled={saving}
                testID="deal-save-btn"
              >
                <Text style={styles.ctaText}>{saving ? "Saving..." : "Save Deal"}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 12,
  },
  title: { fontSize: 32, fontWeight: "800", color: "#0A0A0A", letterSpacing: -1 },
  addBtn: { width: 44, height: 44, backgroundColor: "#002FA7", borderRadius: 4, alignItems: "center", justifyContent: "center" },
  tabsRow: { paddingHorizontal: 24, paddingVertical: 10, gap: 8 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#F4F4F5",
    borderRadius: 4,
  },
  tabActive: { backgroundColor: "#0A0A0A" },
  tabDot: { width: 6, height: 6, borderRadius: 3 },
  tabText: { fontSize: 13, color: "#52525B", fontWeight: "600" },
  tabTextActive: { color: "#FFFFFF" },
  tabCount: { fontSize: 12, color: "#A1A1AA", fontWeight: "700" },
  stageCol: { flex: 1 },
  stageHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  stageBadge: { width: 8, height: 8, borderRadius: 4 },
  stageTitle: { fontSize: 18, fontWeight: "800", color: "#0A0A0A", flex: 1 },
  stageTotal: { fontSize: 14, fontWeight: "700", color: "#52525B" },
  emptyStage: { fontSize: 14, color: "#A1A1AA", textAlign: "center", paddingVertical: 32 },
  dealCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  dealRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  dealTitle: { fontSize: 16, fontWeight: "700", color: "#0A0A0A", flex: 1 },
  dealContact: { fontSize: 13, color: "#52525B", marginTop: 4 },
  dealFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  dealValue: { fontSize: 18, fontWeight: "800", color: "#002FA7" },
  moveRow: { flexDirection: "row", gap: 8 },
  moveBtn: { width: 32, height: 32, borderRadius: 4, borderWidth: 1, borderColor: "#E4E4E7", alignItems: "center", justifyContent: "center" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E7",
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#0A0A0A", letterSpacing: -0.5 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#52525B", marginBottom: 6, marginTop: 12, letterSpacing: 0.8 },
  fieldInput: { backgroundColor: "#F4F4F5", borderRadius: 4, paddingHorizontal: 16, height: 52, fontSize: 16, color: "#0A0A0A" },
  stagePills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#F4F4F5", borderRadius: 4 },
  pillActive: { backgroundColor: "#002FA7" },
  pillText: { fontSize: 13, color: "#52525B", fontWeight: "600" },
  pillTextActive: { color: "#FFFFFF" },
  cta: { backgroundColor: "#002FA7", paddingVertical: 16, borderRadius: 4, alignItems: "center", marginTop: 16 },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
