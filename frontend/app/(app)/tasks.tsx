import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Plus, X, Check, Circle, Trash2, Flag, Bell, BellOff, Clock } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { apiFetch } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import { scheduleTaskReminder, cancelReminder, ensureNotifPermissions } from "../../src/notifications";

type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: string;
  due_date?: string;
};

export default function Tasks() {
  const { t, lang } = useI18n();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
  const [saving, setSaving] = useState(false);

  const PRIORITIES = [
    { id: "low", label: t("tasks.priority.low"), color: "#52525B" },
    { id: "medium", label: t("tasks.priority.medium"), color: "#F59E0B" },
    { id: "high", label: t("tasks.priority.high"), color: "#EF4444" },
  ];

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/tasks");
      setTasks(data);
    } catch (e) {
      console.warn("tasks", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = tasks.filter((t) =>
    filter === "all" ? true : filter === "open" ? !t.completed : t.completed
  );

  const toggle = async (task: Task) => {
    setTasks((prev) =>
      prev.map((x) => (x.id === task.id ? { ...x, completed: !x.completed } : x))
    );
    try {
      await apiFetch(`/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed }),
      });
    } catch (e) {
      load();
    }
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`/tasks/${id}`, { method: "DELETE" });
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message || "Failed");
    }
  };

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert(t("common.error"), t("tasks.errTitle"));
      return;
    }
    try {
      setSaving(true);
      const created = await apiFetch("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          completed: false,
          due_date: dueDate ? dueDate.toISOString() : null,
        }),
      });
      if (dueDate && dueDate.getTime() > Date.now()) {
        await scheduleTaskReminder({
          taskId: created.id,
          title: t("tasks.notifTitle"),
          body: `${created.title} — ${t("tasks.notifBody")}`,
          dueAt: dueDate,
        });
      }
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(null);
      setShowModal(false);
      await load();
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const openPicker = async (mode: "date" | "time") => {
    if (Platform.OS !== "web") {
      await ensureNotifPermissions();
    }
    setPickerMode(mode);
    setShowPicker(true);
  };

  const onPickerChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (!selectedDate) return;
    if (pickerMode === "date") {
      const base = dueDate || new Date();
      const next = new Date(selectedDate);
      next.setHours(base.getHours(), base.getMinutes(), 0, 0);
      setDueDate(next);
      if (Platform.OS === "android") {
        setTimeout(() => openPicker("time"), 100);
      }
    } else {
      const next = dueDate ? new Date(dueDate) : new Date();
      next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      setDueDate(next);
    }
  };

  const fmtDate = (d: Date) =>
    d.toLocaleString(lang === "es" ? "es-ES" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("tasks.title")}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} testID="task-add-btn">
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(["open", "all", "done"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            testID={`task-filter-${f}`}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {t(`tasks.${f}` as any)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(task) => task.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.empty} testID="tasks-empty">
            <Text style={styles.emptyTitle}>{t("tasks.empty")}</Text>
            <Text style={styles.emptyText}>{t("tasks.emptySub")}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const p = PRIORITIES.find((x) => x.id === item.priority) || PRIORITIES[1];
          return (
            <View style={styles.card} testID={`task-card-${item.id}`}>
              <TouchableOpacity onPress={() => toggle(item)} testID={`task-toggle-${item.id}`}>
                {item.completed ? (
                  <View style={styles.checkOn}>
                    <Check size={14} color="#FFFFFF" />
                  </View>
                ) : (
                  <Circle size={22} color="#A1A1AA" />
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskTitle, item.completed && styles.taskTitleDone]}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}
                <View style={styles.metaRow}>
                  <Flag size={12} color={p.color} />
                  <Text style={[styles.priorityText, { color: p.color }]}>{p.label}</Text>
                  {item.due_date ? (
                    <>
                      <View style={styles.metaSep} />
                      <Bell size={12} color="#52525B" />
                      <Text style={styles.dueText}>{fmtDate(new Date(item.due_date))}</Text>
                    </>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity onPress={() => remove(item.id)} testID={`task-delete-${item.id}`}>
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("tasks.new")}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} testID="task-modal-close">
                <X size={24} color="#0A0A0A" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>{t("tasks.titleField")}</Text>
              <TextInput style={styles.fieldInput} value={title} onChangeText={setTitle} testID="task-title-input" />

              <Text style={styles.fieldLabel}>{t("tasks.descField")}</Text>
              <TextInput
                style={[styles.fieldInput, { height: 100, paddingTop: 14 }]}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                testID="task-desc-input"
              />

              <Text style={styles.fieldLabel}>{t("tasks.dueField")}</Text>
              <View style={styles.dueRow}>
                <TouchableOpacity style={styles.dueBtn} onPress={() => openPicker("date")} testID="task-due-set-btn">
                  <Clock size={16} color="#0A0A0A" />
                  <Text style={styles.dueBtnText}>
                    {dueDate ? fmtDate(dueDate) : t("tasks.setDue")}
                  </Text>
                </TouchableOpacity>
                {dueDate ? (
                  <TouchableOpacity style={styles.dueClear} onPress={() => setDueDate(null)} testID="task-due-clear-btn">
                    <BellOff size={16} color="#EF4444" />
                    <Text style={styles.dueClearText}>{t("tasks.clearDue")}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {showPicker && Platform.OS !== "web" && (
                <DateTimePicker
                  value={dueDate || new Date(Date.now() + 60 * 60 * 1000)}
                  mode={pickerMode}
                  is24Hour
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  minimumDate={new Date()}
                  onChange={onPickerChange}
                />
              )}
              {showPicker && Platform.OS === "ios" && (
                <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.iosPickerDone}>
                  <Text style={styles.iosPickerDoneText}>OK</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.fieldLabel}>{t("tasks.priority")}</Text>
              <View style={styles.priorityPills}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pill, priority === p.id && { backgroundColor: p.color }]}
                    onPress={() => setPriority(p.id)}
                    testID={`task-priority-${p.id}`}
                  >
                    <Text style={[styles.pillText, priority === p.id && styles.pillTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.cta, saving && { opacity: 0.7 }]}
                onPress={submit}
                disabled={saving}
                testID="task-save-btn"
              >
                <Text style={styles.ctaText}>{saving ? t("common.loading") : t("tasks.save")}</Text>
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12,
  },
  title: { fontSize: 32, fontWeight: "800", color: "#0A0A0A", letterSpacing: -1 },
  addBtn: { width: 44, height: 44, backgroundColor: "#002FA7", borderRadius: 4, alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", paddingHorizontal: 24, gap: 8, marginBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#F4F4F5", borderRadius: 4 },
  filterChipActive: { backgroundColor: "#0A0A0A" },
  filterText: { fontSize: 13, fontWeight: "600", color: "#52525B" },
  filterTextActive: { color: "#FFFFFF" },
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E4E7", borderRadius: 8,
    padding: 14, marginBottom: 10,
  },
  checkOn: { width: 22, height: 22, borderRadius: 4, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  taskTitle: { fontSize: 15, fontWeight: "700", color: "#0A0A0A" },
  taskTitleDone: { textDecorationLine: "line-through", color: "#A1A1AA" },
  taskDesc: { fontSize: 13, color: "#52525B", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, flexWrap: "wrap" },
  metaSep: { width: 1, height: 10, backgroundColor: "#E4E4E7", marginHorizontal: 4 },
  priorityText: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  dueText: { fontSize: 11, color: "#52525B", fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0A0A0A" },
  emptyText: { fontSize: 14, color: "#52525B", marginTop: 4 },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#E4E4E7",
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#0A0A0A", letterSpacing: -0.5 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#52525B", marginBottom: 6, marginTop: 12, letterSpacing: 0.8 },
  fieldInput: { backgroundColor: "#F4F4F5", borderRadius: 4, paddingHorizontal: 16, height: 52, fontSize: 16, color: "#0A0A0A" },
  dueRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  dueBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#F4F4F5", paddingHorizontal: 16, height: 52, borderRadius: 4,
  },
  dueBtnText: { fontSize: 14, color: "#0A0A0A", fontWeight: "600" },
  dueClear: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: "#EF4444", borderRadius: 4,
  },
  dueClearText: { color: "#EF4444", fontSize: 13, fontWeight: "700" },
  iosPickerDone: { alignItems: "flex-end", paddingVertical: 8 },
  iosPickerDoneText: { color: "#002FA7", fontWeight: "700", fontSize: 16 },
  priorityPills: { flexDirection: "row", gap: 8, marginBottom: 16 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#F4F4F5", borderRadius: 4, flex: 1, alignItems: "center" },
  pillText: { fontSize: 13, color: "#52525B", fontWeight: "700" },
  pillTextActive: { color: "#FFFFFF" },
  cta: { backgroundColor: "#002FA7", paddingVertical: 16, borderRadius: 4, alignItems: "center", marginTop: 16 },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
