import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";

type RiskLevel = "low" | "moderate" | "high";
type Prediction = "positive" | "negative";
type DiseaseType = "diabetes" | "heart" | "parkinsons";

const RISK_CONFIG: Record<RiskLevel, {
  color: string;
  gradient: [string, string];
  icon: "check-circle" | "alert-triangle" | "alert-circle";
  label: string;
}> = {
  low: {
    color: Colors.success,
    gradient: ["#065F46", "#10B981"],
    icon: "check-circle",
    label: "Low Risk",
  },
  moderate: {
    color: Colors.warning,
    gradient: ["#92400E", "#F59E0B"],
    icon: "alert-triangle",
    label: "Moderate Risk",
  },
  high: {
    color: Colors.danger,
    gradient: ["#7F1D1D", "#EF4444"],
    icon: "alert-circle",
    label: "High Risk",
  },
};

const DISEASE_TITLES: Record<DiseaseType, string> = {
  diabetes: "Diabetes",
  heart: "Heart Disease",
  parkinsons: "Parkinson's Disease",
};

export default function ResultScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    disease: string;
    prediction: string;
    probability: string;
    riskLevel: string;
    message: string;
    details: string;
  }>();

  const disease = (params.disease as DiseaseType) || "diabetes";
  const prediction = (params.prediction as Prediction) || "negative";
  const probability = parseFloat(params.probability || "0");
  const riskLevel = (params.riskLevel as RiskLevel) || "low";
  const message = params.message || "";
  const details = params.details || "";

  const riskConfig = RISK_CONFIG[riskLevel];
  const percentage = Math.round(probability * 100);

  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 400 });
    progressWidth.value = withDelay(300, withTiming(probability, { duration: 1000 }));
    if (Platform.OS !== "web") {
      setTimeout(() => {
        Haptics.notificationAsync(
          riskLevel === "low"
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
      }, 200);
    }
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as `${number}%`,
  }));

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analysis Result</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.resultCard, cardStyle]}>
          <LinearGradient
            colors={riskConfig.gradient}
            style={styles.resultGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name={riskConfig.icon} size={48} color={Colors.white} />
            <Text style={styles.riskLabel}>{riskConfig.label}</Text>
            <Text style={styles.diseaseTitle}>{DISEASE_TITLES[disease]}</Text>
            <Text style={styles.probabilityText}>{percentage}%</Text>
            <Text style={styles.probabilityLabel}>
              {prediction === "positive" ? "Probability of Disease" : "Risk Probability"}
            </Text>
          </LinearGradient>
        </Animated.View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Confidence Score</Text>
            <Text style={[styles.progressValue, { color: riskConfig.color }]}>
              {percentage}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                { backgroundColor: riskConfig.color },
                progressStyle,
              ]}
            />
          </View>
          <View style={styles.progressScale}>
            <Text style={styles.progressScaleText}>0%</Text>
            <Text style={[styles.progressScaleText, { color: Colors.warning }]}>50%</Text>
            <Text style={styles.progressScaleText}>100%</Text>
          </View>
        </View>

        <View style={styles.messageCard}>
          <Feather name="message-circle" size={18} color={Colors.primary} />
          <View style={styles.messageContent}>
            <Text style={styles.messageTitle}>Assessment</Text>
            <Text style={styles.messageText}>{message}</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Analysis Details</Text>
          <Text style={styles.detailsText}>{details}</Text>
        </View>

        <View style={styles.recommendCard}>
          <Text style={styles.recommendTitle}>
            <Feather name="activity" size={15} color={Colors.text} /> Recommendations
          </Text>
          {riskLevel === "low" && (
            <>
              <RecommendItem icon="check" text="Continue your current healthy lifestyle" />
              <RecommendItem icon="calendar" text="Schedule regular annual check-ups" />
              <RecommendItem icon="heart" text="Maintain a balanced diet and exercise routine" />
            </>
          )}
          {riskLevel === "moderate" && (
            <>
              <RecommendItem icon="user" text="Consult with a healthcare provider soon" />
              <RecommendItem icon="trending-down" text="Consider lifestyle modifications" />
              <RecommendItem icon="calendar" text="Schedule a detailed medical evaluation" />
              <RecommendItem icon="activity" text="Monitor your key health indicators regularly" />
            </>
          )}
          {riskLevel === "high" && (
            <>
              <RecommendItem icon="alert-circle" text="Seek immediate medical consultation" />
              <RecommendItem icon="user" text="Consult a specialist without delay" />
              <RecommendItem icon="clipboard" text="Request comprehensive diagnostic tests" />
              <RecommendItem icon="heart" text="Begin monitoring vital signs daily" />
            </>
          )}
        </View>

        <View style={styles.disclaimer}>
          <Feather name="shield" size={14} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            This AI prediction is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional for diagnosis and treatment.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.analyzeAgainBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Feather name="refresh-cw" size={16} color={Colors.primary} />
            <Text style={styles.analyzeAgainText}>Analyze Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.push("/")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.homeBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="home" size={16} color={Colors.white} />
              <Text style={styles.homeBtnText}>Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function RecommendItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.recommendItem}>
      <View style={styles.recommendDot}>
        <Feather name={icon as any} size={12} color={Colors.primary} />
      </View>
      <Text style={styles.recommendText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.backgroundCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  resultCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  resultGradient: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 8,
  },
  riskLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },
  diseaseTitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  probabilityText: {
    fontFamily: "Inter_700Bold",
    fontSize: 56,
    color: Colors.white,
    marginTop: 8,
  },
  probabilityLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  progressSection: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  progressValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressBar: {
    height: "100%",
    borderRadius: 5,
  },
  progressScale: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressScaleText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textMuted,
  },
  messageCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  messageContent: {
    flex: 1,
  },
  messageTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
    marginBottom: 6,
  },
  messageText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  detailsCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  detailsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  recommendCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recommendTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
    gap: 6,
  },
  recommendItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  recommendDot: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.primary + "22",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  recommendText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 14,
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 12,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  analyzeAgainBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "18",
  },
  analyzeAgainText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
  homeBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  homeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  homeBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.white,
  },
});
