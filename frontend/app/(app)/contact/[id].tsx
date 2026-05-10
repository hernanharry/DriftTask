import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Mail, Phone, Building2, Briefcase, Send, Trash2 } from "lucide-react-native";
import { apiFetch } from "../../../src/auth";
import { useI18n } from "../../../src/i18n";

type Contact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  avatar?: string;
};

type Note = {
  id: string;
  content: string;
  created_at: string;
};

export default function ContactDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();
  const [contact, setContact] = useState<Contact | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [c, n] = await Promise.all([
        apiFetch(`/contacts/${id}`),
        apiFetch(`/notes?contact_id=${id}`),
      ]);
      setContact(c);
      setNotes(n);
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message || "Failed to load");
    }
  }, [id, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const post = async () => {
    if (!text.trim() || !id) return;
    try {
      setPosting(true);
      const note = await apiFetch("/notes", {
        method: "POST",
        body: JSON.stringify({ content: text.trim(), contact_id: id }),
      });
      setNotes((prev) => [note, ...prev]);
      setText("");
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message || "Failed");
    } finally {
      setPosting(false);
    }
  };

  const fmt = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString(lang === "es" ? "es-ES" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (!contact) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ActivityIndicator style={{ marginTop: 64 }} color="#002FA7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="contact-detail-back">
            <ChevronLeft size={24} color="#0A0A0A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("contact.detail")}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={styles.profileCard}>
            <Image source={{ uri: contact.avatar }} style={styles.avatar} />
            <Text style={styles.name}>{contact.name}</Text>
            {(contact.position || contact.company) && (
              <Text style={styles.role}>
                {[contact.position, contact.company].filter(Boolean).join(" · ")}
              </Text>
            )}
          </View>

          <View style={styles.infoList}>
            {contact.email && (
              <View style={styles.infoRow} testID="contact-info-email">
                <View style={styles.infoIcon}><Mail size={16} color="#0A0A0A" /></View>
                <Text style={styles.infoText}>{contact.email}</Text>
              </View>
            )}
            {contact.phone && (
              <View style={styles.infoRow} testID="contact-info-phone">
                <View style={styles.infoIcon}><Phone size={16} color="#0A0A0A" /></View>
                <Text style={styles.infoText}>{contact.phone}</Text>
              </View>
            )}
            {contact.company && (
              <View style={styles.infoRow} testID="contact-info-company">
                <View style={styles.infoIcon}><Building2 size={16} color="#0A0A0A" /></View>
                <Text style={styles.infoText}>{contact.company}</Text>
              </View>
            )}
            {contact.position && (
              <View style={styles.infoRow} testID="contact-info-position">
                <View style={styles.infoIcon}><Briefcase size={16} color="#0A0A0A" /></View>
                <Text style={styles.infoText}>{contact.position}</Text>
              </View>
            )}
          </View>

          <Text style={styles.section}>{t("contact.notes")}</Text>
          <View style={{ paddingHorizontal: 24 }}>
            {notes.length === 0 ? (
              <Text style={styles.empty} testID="notes-empty">{t("contact.notesEmpty")}</Text>
            ) : (
              notes.map((n, i) => (
                <View key={n.id} style={styles.noteWrap} testID={`note-${n.id}`}>
                  <View style={styles.timeline}>
                    <View style={styles.dot} />
                    {i < notes.length - 1 && <View style={styles.line} />}
                  </View>
                  <View style={styles.noteCard}>
                    <Text style={styles.noteContent}>{n.content}</Text>
                    <Text style={styles.noteDate}>{fmt(n.created_at)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder={t("contact.addNote")}
            placeholderTextColor="#A1A1AA"
            value={text}
            onChangeText={setText}
            multiline
            testID="note-input"
          />
          <TouchableOpacity
            onPress={post}
            disabled={!text.trim() || posting}
            style={[styles.send, (!text.trim() || posting) && { opacity: 0.5 }]}
            testID="note-send-btn"
          >
            {posting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Send size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
  },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#0A0A0A" },
  profileCard: { alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#F4F4F5" },
  name: { fontSize: 24, fontWeight: "800", color: "#0A0A0A", marginTop: 12, letterSpacing: -0.5 },
  role: { fontSize: 14, color: "#52525B", marginTop: 4 },
  infoList: {
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F5",
  },
  infoIcon: { width: 32, height: 32, borderRadius: 4, backgroundColor: "#F4F4F5", alignItems: "center", justifyContent: "center" },
  infoText: { fontSize: 14, color: "#0A0A0A", flex: 1 },
  section: { fontSize: 11, fontWeight: "700", color: "#A1A1AA", letterSpacing: 1.5, paddingHorizontal: 24, marginBottom: 12, marginTop: 8 },
  empty: { fontSize: 14, color: "#A1A1AA", paddingVertical: 24, textAlign: "center" },
  noteWrap: { flexDirection: "row", marginBottom: 4 },
  timeline: { width: 24, alignItems: "center" },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#002FA7", marginTop: 18 },
  line: { width: 1, flex: 1, backgroundColor: "#E4E4E7", marginTop: 4 },
  noteCard: {
    flex: 1,
    backgroundColor: "#F4F4F5",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  noteContent: { fontSize: 14, color: "#0A0A0A", lineHeight: 20 },
  noteDate: { fontSize: 11, color: "#A1A1AA", marginTop: 6, letterSpacing: 0.3 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E4E4E7",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: "#F4F4F5",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0A0A0A",
  },
  send: { width: 44, height: 44, borderRadius: 4, backgroundColor: "#002FA7", alignItems: "center", justifyContent: "center" },
});
