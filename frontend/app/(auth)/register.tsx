import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/auth";
import { Mail, Lock, User as UserIcon, ArrowRight, ChevronLeft } from "lucide-react-native";

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!fullName.trim()) return setError("Enter your full name");
    if (!email.includes("@")) return setError("Enter a valid email");
    if (password.length < 6) return setError("Password must be at least 6 characters");
    try {
      setLoading(true);
      await register(email.trim().toLowerCase(), password, fullName.trim());
      router.replace("/(app)/dashboard");
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back} testID="register-back-btn">
            <ChevronLeft size={24} color="#0A0A0A" />
          </TouchableOpacity>

          <Text style={styles.title}>Create account.</Text>
          <Text style={styles.subtitle}>Start managing leads in under a minute.</Text>

          <View style={styles.field}>
            <UserIcon size={18} color="#52525B" />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor="#A1A1AA"
              value={fullName}
              onChangeText={setFullName}
              testID="register-name-input"
            />
          </View>

          <View style={styles.field}>
            <Mail size={18} color="#52525B" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A1A1AA"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              testID="register-email-input"
            />
          </View>

          <View style={styles.field}>
            <Lock size={18} color="#52525B" />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 chars)"
              placeholderTextColor="#A1A1AA"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              testID="register-password-input"
            />
          </View>

          {error && <Text style={styles.error} testID="register-error">{error}</Text>}

          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={submit}
            disabled={loading}
            testID="register-submit-btn"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.ctaText}>Create Account</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/(auth)/login")} style={styles.bottomLink} testID="register-go-login-btn">
            <Text style={styles.bottomLinkText}>
              Already have an account? <Text style={{ fontWeight: "700", color: "#002FA7" }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { padding: 24, flexGrow: 1 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8, marginBottom: 16 },
  title: { fontSize: 36, fontWeight: "800", color: "#0A0A0A", letterSpacing: -1 },
  subtitle: { fontSize: 16, color: "#52525B", marginTop: 8, marginBottom: 32 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F4F4F5",
    borderRadius: 4,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
  },
  input: { flex: 1, fontSize: 16, color: "#0A0A0A" },
  error: { color: "#EF4444", fontSize: 14, marginTop: 4, marginBottom: 8 },
  cta: {
    backgroundColor: "#002FA7",
    paddingVertical: 16,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
  bottomLink: { marginTop: 24, alignItems: "center" },
  bottomLinkText: { color: "#52525B", fontSize: 14 },
});
