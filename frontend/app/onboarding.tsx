import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowRight } from "lucide-react-native";
import { useAuth } from "../src/auth";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    title: "Data & Analytics",
    subtitle: "Track every metric. Real-time clarity for every decision you make.",
    image: "https://static.prod-images.emergentagent.com/jobs/3472c0c2-7d28-4432-9ef9-f54b32b92706/images/662d4d16432741b375a88e8082c4ab97f203aa4f2b879bb9a063ceacf85317b3.png",
  },
  {
    title: "Workflow Pipeline",
    subtitle: "Visualize your sales. Move deals through stages with a single swipe.",
    image: "https://static.prod-images.emergentagent.com/jobs/3472c0c2-7d28-4432-9ef9-f54b32b92706/images/3b30471e10b35424694b7c0d620a2a586bd8c534ced8da8e45ddec9c33c5f1c7.png",
  },
  {
    title: "Contacts & CRM",
    subtitle: "Every relationship. Every conversation. All in one elegant place.",
    image: "https://static.prod-images.emergentagent.com/jobs/3472c0c2-7d28-4432-9ef9-f54b32b92706/images/dfc72d98341fc2518c72b1a8fd7f36f8876d922c046c377a243b1e2093701a77.png",
  },
];

export default function Onboarding() {
  const router = useRouter();
  const { setOnboarded } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = async () => {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
    } else {
      await setOnboarded();
      router.replace("/(auth)/login");
    }
  };

  const skip = async () => {
    await setOnboarded();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.brand} testID="brand-name">Driftask</Text>
        <TouchableOpacity onPress={skip} testID="onboarding-skip-btn">
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        testID="onboarding-scroll"
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={[styles.slide, { width }]} testID={`onboarding-slide-${i}`}>
            <View style={styles.imageWrap}>
              <Image source={{ uri: s.image }} style={styles.image} resizeMode="contain" />
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.subtitle}>{s.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
            testID={`onboarding-dot-${i}`}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={next} testID="onboarding-next-btn">
          <Text style={styles.ctaText}>
            {index === SLIDES.length - 1 ? "Get Started" : "Continue"}
          </Text>
          <ArrowRight size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  brand: { fontSize: 22, fontWeight: "800", color: "#0A0A0A", letterSpacing: -0.5 },
  skip: { fontSize: 14, color: "#52525B", fontWeight: "500" },
  slide: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  imageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F4F4F5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    overflow: "hidden",
  },
  image: { width: "85%", height: "85%" },
  title: { fontSize: 32, fontWeight: "800", color: "#0A0A0A", letterSpacing: -0.5, textAlign: "center" },
  subtitle: {
    fontSize: 16,
    color: "#52525B",
    marginTop: 12,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E4E4E7" },
  dotActive: { backgroundColor: "#002FA7", width: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#002FA7",
    paddingVertical: 16,
    borderRadius: 4,
    gap: 8,
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
