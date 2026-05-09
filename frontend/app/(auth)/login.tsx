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
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Link } from "expo-router";
import { useAuth } from "../../src/auth";
import { Mail, Lock, ArrowRight } from "lucide-react-native";

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password");
      return;
    }
    try {
      setLoading(true);
      await login(email.trim().toLowerCase(), password);
      router.replace("/(app)/dashboard");
    } catch (e: any) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandWrap}>
            <View style={styles.brandMark} />
            <Text style={styles.brand}>Driftask</Text>
          </View>

          <Text style={styles.title}>Welcome back.</Text>
          <Text style={styles.subtitle}>Sign in to keep your pipeline moving.</Text>

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
              testID="login-email-input"
            />
          </View>

          <View style={styles.field}>
            <Lock size={18} color="#52525B" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A1A1AA"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              testID="login-password-input"
            />
          </View>

          {error && (
            <Text style={styles.error} testID="login-error">{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.cta, loading && styles.ctaDisabled]}
            onPress={submit}
            disabled={loading}
            testID="login-submit-btn"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.ctaText}>Sign In</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.line} />
          </View>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.secondary} testID="login-go-register-btn">
              <Text style={styles.secondaryText}>Create an account</Text>
            </TouchableOpacity>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { padding: 24, paddingTop: 32, flexGrow: 1 },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 48 },
  brandMark: { width: 14, height: 14, backgroundColor: "#002FA7" },
  brand: { fontSize: 18, fontWeight: "800", color: "#0A0A0A", letterSpacing: -0.4 },
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
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 24 },
  line: { flex: 1, height: 1, backgroundColor: "#E4E4E7" },
  dividerText: { color: "#52525B", fontSize: 12, textTransform: "uppercase", letterSpacing: 1 },
  secondary: {
    paddingVertical: 16,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0A0A0A",
  },
  secondaryText: { color: "#0A0A0A", fontWeight: "700", fontSize: 16 },
});
