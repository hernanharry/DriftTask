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
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Plus, X, Mail, Phone, Building2, Trash2, Search } from "lucide-react-native";
import { apiFetch } from "../../src/auth";
import { useI18n } from "../../src/i18n";

type Contact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  avatar?: string;
};

const AVATARS = [
  "https://images.unsplash.com/photo-1581065178047-8ee15951ede6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwzfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3ODE2NzY2MHww&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3ODE2NzY2MHww&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1629507313712-f21468afdf2e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwyfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3ODE2NzY2MHww&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHw0fHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3ODE2NzY2MHww&ixlib=rb-4.1.0&q=85",
];

export default function Contacts() {
  const router = useRouter();
  const { t } = useI18n();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/contacts");
      setContacts(data);
    } catch (e) {
      console.warn("contacts", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const reset = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setPosition("");
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert(t("common.error"), t("contacts.errName"));
      return;
    }
    try {
      setSaving(true);
      const avatar = AVATARS[contacts.length % AVATARS.length];
      await apiFetch("/contacts", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          company: company.trim() || null,
          position: position.trim() || null,
          avatar,
        }),
      });
      reset();
      setShowModal(false);
      await load();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create contact");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await apiFetch(`/contacts/${id}`, { method: "DELETE" });
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to delete");
    }
  };

  const filtered = contacts.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("contacts.title")}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
          testID="contact-add-btn"
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap} testID="contact-search-wrap">
        <Search size={18} color="#52525B" />
        <TextInput
          style={styles.searchInput}
          placeholder={t("contacts.searchPh")}
          placeholderTextColor="#A1A1AA"
          value={search}
          onChangeText={setSearch}
          testID="contact-search-input"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.empty} testID="contacts-empty">
            <Text style={styles.emptyTitle}>{t("contacts.empty")}</Text>
            <Text style={styles.emptyText}>{t("contacts.emptySub")}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/contact/${item.id}`)}
            testID={`contact-card-${item.id}`}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: item.avatar || AVATARS[0] }}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              {(item.position || item.company) && (
                <Text style={styles.role}>
                  {[item.position, item.company].filter(Boolean).join(" · ")}
                </Text>
              )}
              <View style={styles.meta}>
                {item.email && (
                  <View style={styles.metaItem}>
                    <Mail size={12} color="#52525B" />
                    <Text style={styles.metaText} numberOfLines={1}>{item.email}</Text>
                  </View>
                )}
                {item.phone && (
                  <View style={styles.metaItem}>
                    <Phone size={12} color="#52525B" />
                    <Text style={styles.metaText}>{item.phone}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => remove(item.id)}
              style={styles.deleteBtn}
              testID={`contact-delete-${item.id}`}
            >
              <Trash2 size={16} color="#EF4444" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("contacts.new")}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} testID="contact-modal-close">
                <X size={24} color="#0A0A0A" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
              <Field label={t("contacts.name")} value={name} onChange={setName} testID="contact-name" />
              <Field label={t("auth.email")} value={email} onChange={setEmail} keyboardType="email-address" testID="contact-email" />
              <Field label={t("contacts.phone")} value={phone} onChange={setPhone} keyboardType="phone-pad" testID="contact-phone" />
              <Field label={t("contacts.company")} value={company} onChange={setCompany} icon={<Building2 size={16} color="#52525B" />} testID="contact-company" />
              <Field label={t("contacts.position")} value={position} onChange={setPosition} testID="contact-position" />

              <TouchableOpacity
                style={[styles.cta, saving && { opacity: 0.7 }]}
                onPress={submit}
                disabled={saving}
                testID="contact-save-btn"
              >
                <Text style={styles.ctaText}>{saving ? t("common.loading") : t("contacts.save")}</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboardType,
  testID,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  keyboardType?: any;
  icon?: React.ReactNode;
  testID?: string;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        testID={testID}
      />
    </View>
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
    paddingBottom: 16,
  },
  title: { fontSize: 32, fontWeight: "800", color: "#0A0A0A", letterSpacing: -1 },
  addBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#002FA7",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: "#F4F4F5",
    borderRadius: 4,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#0A0A0A" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#F4F4F5" },
  name: { fontSize: 16, fontWeight: "700", color: "#0A0A0A" },
  role: { fontSize: 13, color: "#52525B", marginTop: 2 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#52525B", maxWidth: 160 },
  deleteBtn: { padding: 8 },
  empty: { alignItems: "center", paddingVertical: 64 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0A0A0A" },
  emptyText: { fontSize: 14, color: "#52525B", marginTop: 4 },
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
  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#52525B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 },
  fieldInput: {
    backgroundColor: "#F4F4F5",
    borderRadius: 4,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: "#0A0A0A",
  },
  cta: {
    backgroundColor: "#002FA7",
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
