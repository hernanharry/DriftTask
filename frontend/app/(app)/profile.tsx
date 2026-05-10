import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { useI18n } from "../../src/i18n";
import * as AuthSession from "expo-auth-session";
import {
  LogOut,
  Mail,
  Cloud,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Globe,
  Check,
  Download,
  Upload,
  X,
  Trash,
} from "lucide-react-native";
import {
  GOOGLE_CLIENT_ID,
  DRIVE_DISCOVERY,
  DRIVE_SCOPES,
  buildDriveRedirectUri,
  exchangeDriveCode,
  driveApi,
} from "../../src/drive";

type DriveStatus = { connected: boolean; email?: string | null };
type Backup = { id: string; name: string; createdTime: string; size?: string };

export default function Profile() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const router = useRouter();

  const [drive, setDrive] = useState<DriveStatus>({ connected: false });
  const [busy, setBusy] = useState<null | "connect" | "backup" | "list" | "restore">(null);
  const [showBackups, setShowBackups] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [showLang, setShowLang] = useState(false);

  const redirectUri = buildDriveRedirectUri();

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: DRIVE_SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: { access_type: "offline", prompt: "consent" },
    },
    DRIVE_DISCOVERY
  );

  const loadStatus = useCallback(async () => {
    try {
      const s = await driveApi.status();
      setDrive(s);
    } catch (e) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus])
  );

  useEffect(() => {
    (async () => {
      if (response?.type === "success") {
        try {
          setBusy("connect");
          await exchangeDriveCode({
            code: response.params.code,
            redirectUri,
            codeVerifier: request?.codeVerifier,
          });
          await loadStatus();
          Alert.alert(t("common.success"), t("profile.driveTitle") + " ✓");
        } catch (e: any) {
          Alert.alert(t("common.error"), e.message || "Connect failed");
        } finally {
          setBusy(null);
        }
      } else if (response?.type === "error") {
        Alert.alert(t("common.error"), response.error?.message || "OAuth error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const connect = async () => {
    if (!request) return;
    await promptAsync();
  };

  const disconnect = async () => {
    try {
      await driveApi.disconnect();
      setDrive({ connected: false });
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message || "Failed");
    }
  };

  const backupNow = async () => {
    try {
      setBusy("backup");
      const r = await driveApi.backup();
      Alert.alert(
        t("common.success"),
        `${t("profile.driveBackupOk")}\n${r.counts.contacts} contacts · ${r.counts.deals} deals · ${r.counts.tasks} tasks · ${r.counts.notes} notes`
      );
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message || "Failed");
    } finally {
      setBusy(null);
    }
  };

  const openBackups = async () => {
    try {
      setBusy("list");
      const list = await driveApi.list();
      setBackups(list);
      setShowBackups(true);
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message || "Failed");
    } finally {
      setBusy(null);
    }
  };

  const restore = async (fileId: string) => {
    Alert.alert(t("common.confirm"), t("profile.driveRestoreConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.confirm"),
        style: "destructive",
        onPress: async () => {
          try {
            setBusy("restore");
            const r = await driveApi.restore(fileId);
            setShowBackups(false);
            Alert.alert(
              t("common.success"),
              `${t("profile.driveRestoreOk")}\n${r.restored.contacts} contacts · ${r.restored.deals} deals · ${r.restored.tasks} tasks · ${r.restored.notes} notes`
            );
          } catch (e: any) {
            Alert.alert(t("common.error"), e.message || "Failed");
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const onLogout = () => {
    Alert.alert(t("profile.logout"), t("profile.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.logout"),
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

  const fmt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString(lang === "es" ? "es-ES" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.title}>{t("profile.title")}</Text>
        </View>

        <View style={styles.userCard} testID="profile-user-card">
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.full_name || "User"}</Text>
            <View style={styles.userRow}>
              <Mail size={12} color="#A1A1AA" />
              <Text style={styles.userMail}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.section}>{t("profile.cloud")}</Text>
        <View style={styles.driveCard} testID="drive-card">
          <View style={styles.driveTop}>
            <View style={styles.driveIcon}>
              <Cloud size={20} color="#0A0A0A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driveTitle}>{t("profile.driveTitle")}</Text>
              <Text style={styles.driveSub}>
                {drive.connected
                  ? t("profile.driveConnected", { email: drive.email || "" })
                  : t("profile.driveNotConnected")}
              </Text>
            </View>
            {drive.connected ? <View style={styles.dotOk} /> : null}
          </View>
          {drive.connected ? (
            <View style={styles.driveActions}>
              <TouchableOpacity
                style={[styles.driveBtn, styles.drivePrimary]}
                onPress={backupNow}
                disabled={!!busy}
                testID="drive-backup-btn"
              >
                {busy === "backup" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Upload size={16} color="#FFFFFF" />
                    <Text style={styles.drivePrimaryText}>{t("profile.driveBackup")}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.driveBtn, styles.driveSecondary]}
                onPress={openBackups}
                disabled={!!busy}
                testID="drive-list-btn"
              >
                {busy === "list" ? (
                  <ActivityIndicator size="small" color="#0A0A0A" />
                ) : (
                  <>
                    <Download size={16} color="#0A0A0A" />
                    <Text style={styles.driveSecondaryText}>{t("profile.driveRestore")}</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={disconnect} style={styles.driveDisconnect} testID="drive-disconnect-btn">
                <Trash size={14} color="#EF4444" />
                <Text style={styles.driveDisconnectText}>{t("profile.driveDisconnect")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.driveBtn, styles.drivePrimary, { marginTop: 14 }]}
              onPress={connect}
              disabled={!request || busy === "connect"}
              testID="drive-connect-btn"
            >
              {busy === "connect" ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Cloud size={16} color="#FFFFFF" />
                  <Text style={styles.drivePrimaryText}>{t("profile.driveConnect")}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.section}>{t("profile.prefs")}</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.row} onPress={() => setShowLang(true)} testID="profile-language-btn">
            <View style={styles.rowIcon}>
              <Globe size={18} color="#0A0A0A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t("profile.language")}</Text>
            </View>
            <Text style={styles.rowValue}>{lang === "es" ? "Español" : "English"}</Text>
            <ChevronRight size={18} color="#A1A1AA" />
          </TouchableOpacity>
          <Row icon={<Bell size={18} color="#0A0A0A" />} title={t("profile.notifications")} testID="profile-notifications" />
          <Row icon={<Shield size={18} color="#0A0A0A" />} title={t("profile.privacy")} testID="profile-privacy" />
          <Row icon={<HelpCircle size={18} color="#0A0A0A" />} title={t("profile.help")} testID="profile-help" />
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <TouchableOpacity style={styles.logout} onPress={onLogout} testID="profile-logout-btn">
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutText}>{t("profile.logout")}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>{t("version")}</Text>
      </ScrollView>

      {/* Language picker */}
      <Modal visible={showLang} transparent animationType="fade" onRequestClose={() => setShowLang(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowLang(false)}>
          <View style={styles.sheet} testID="language-sheet">
            <Text style={styles.sheetTitle}>{t("profile.language")}</Text>
            {(["en", "es"] as const).map((l) => (
              <TouchableOpacity
                key={l}
                style={styles.langRow}
                onPress={async () => {
                  await setLang(l);
                  setShowLang(false);
                }}
                testID={`lang-${l}`}
              >
                <Text style={styles.langText}>{l === "en" ? "English" : "Español"}</Text>
                {lang === l && <Check size={18} color="#002FA7" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Backups list */}
      <Modal visible={showBackups} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("profile.driveBackups")}</Text>
            <TouchableOpacity onPress={() => setShowBackups(false)} testID="drive-backups-close">
              <X size={24} color="#0A0A0A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            {backups.length === 0 ? (
              <Text style={styles.empty}>{t("profile.driveNoBackups")}</Text>
            ) : (
              backups.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.backupCard}
                  onPress={() => restore(b.id)}
                  testID={`backup-${b.id}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.backupName}>{b.name}</Text>
                    <Text style={styles.backupDate}>{fmt(b.createdTime)}</Text>
                  </View>
                  {busy === "restore" ? (
                    <ActivityIndicator size="small" color="#002FA7" />
                  ) : (
                    <ChevronRight size={18} color="#A1A1AA" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Row({
  icon,
  title,
  testID,
}: {
  icon: React.ReactNode;
  title: string;
  testID?: string;
}) {
  return (
    <TouchableOpacity style={styles.row} testID={testID}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
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
  driveCard: {
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 8,
    padding: 16,
  },
  driveTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  driveIcon: { width: 40, height: 40, borderRadius: 4, backgroundColor: "#F4F4F5", alignItems: "center", justifyContent: "center" },
  driveTitle: { fontSize: 15, fontWeight: "700", color: "#0A0A0A" },
  driveSub: { fontSize: 12, color: "#52525B", marginTop: 2 },
  dotOk: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#10B981" },
  driveActions: { gap: 8, marginTop: 14 },
  driveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 4 },
  drivePrimary: { backgroundColor: "#002FA7" },
  drivePrimaryText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  driveSecondary: { backgroundColor: "#F4F4F5" },
  driveSecondaryText: { color: "#0A0A0A", fontWeight: "700", fontSize: 14 },
  driveDisconnect: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 },
  driveDisconnectText: { color: "#EF4444", fontSize: 12, fontWeight: "700" },
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
  rowValue: { fontSize: 13, color: "#52525B", marginRight: 4 },
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
  sheetOverlay: { flex: 1, backgroundColor: "rgba(10,10,10,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 8, paddingBottom: Platform.OS === "ios" ? 32 : 16, paddingTop: 16 },
  sheetTitle: { fontSize: 14, fontWeight: "700", color: "#52525B", paddingHorizontal: 16, marginBottom: 8, letterSpacing: 0.4 },
  langRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16 },
  langText: { fontSize: 16, color: "#0A0A0A", fontWeight: "600" },
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
  empty: { fontSize: 14, color: "#A1A1AA", textAlign: "center", paddingVertical: 32 },
  backupCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    borderRadius: 8,
    marginBottom: 10,
  },
  backupName: { fontSize: 14, fontWeight: "700", color: "#0A0A0A" },
  backupDate: { fontSize: 12, color: "#52525B", marginTop: 4 },
});
