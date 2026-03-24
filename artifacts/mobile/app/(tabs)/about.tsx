import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";

const FEATURES = [
  {
    icon: "droplet" as const,
    title: "Diabetes Prediction",
    description: "Analyzes 8 clinical biomarkers including glucose, BMI, insulin levels, and family history to estimate diabetes risk.",
    color: Colors.diabetesColor,
    accuracy: "87%",
  },
  {
    icon: "heart" as const,
    title: "Heart Disease Detection",
    description: "Evaluates 11 cardiovascular indicators such as cholesterol, blood pressure, ECG results, and exercise tolerance.",
    color: Colors.heartColor,
    accuracy: "85%",
  },
  {
    icon: "mic" as const,
    title: "Parkinson's Analysis",
    description: "Uses vocal biomarkers — frequency variation, amplitude changes, and noise ratios — to detect Parkinson's signs.",
    color: Colors.parkinsonsColor,
    accuracy: "89%",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Enter Parameters", desc: "Input your clinical measurements from lab reports or medical records." },
  { step: "2", title: "AI Analysis", desc: "Our ML model processes multiple biomarkers simultaneously using clinical scoring algorithms." },
  { step: "3", title: "Get Results", desc: "Receive a risk score with confidence level and personalized recommendations." },
];

const TEAM = [
  { role: "ML Model", detail: "Logistic Regression with clinical scoring weights" },
  { role: "Backend", detail: "Express + TypeScript + PostgreSQL" },
  { role: "Mobile", detail: "React Native + Expo Router" },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 12 }]}
      >
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.heroIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name="activity" size={32} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.heroTitle}>HealthPredict AI</Text>
          <Text style={styles.heroVersion}>Version 1.0.0</Text>
          <Text style={styles.heroDesc}>
            An AI-powered clinical decision support system for early disease detection using machine learning models trained on validated clinical datasets.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disease Modules</Text>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <LinearGradient
                colors={[f.color + "33", Colors.transparent]}
                style={styles.featureGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.featureHeader}>
                  <View style={[styles.featureIconWrap, { backgroundColor: f.color + "22" }]}>
                    <Feather name={f.icon} size={20} color={f.color} />
                  </View>
                  <View style={styles.featureHeaderText}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <View style={[styles.accuracyBadge, { backgroundColor: f.color + "22" }]}>
                      <Text style={[styles.accuracyText, { color: f.color }]}>
                        ~{f.accuracy} accuracy
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.featureDesc}>{f.description}</Text>
              </LinearGradient>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          {HOW_IT_WORKS.map((step, i) => (
            <View key={step.step} style={styles.stepRow}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.stepNumber}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.stepNumberText}>{step.step}</Text>
              </LinearGradient>
              <View style={[styles.stepConnector, i === HOW_IT_WORKS.length - 1 && styles.hidden]} />
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tech Stack</Text>
          <View style={styles.techGrid}>
            {TEAM.map((t) => (
              <View key={t.role} style={styles.techCard}>
                <Text style={styles.techRole}>{t.role}</Text>
                <Text style={styles.techDetail}>{t.detail}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.disclaimerSection}>
          <View style={styles.disclaimerIconRow}>
            <View style={styles.disclaimerIcon}>
              <Feather name="shield" size={20} color={Colors.warning} />
            </View>
            <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
          </View>
          <Text style={styles.disclaimerText}>
            HealthPredict AI is designed for educational and informational purposes only. The predictions made by this application are based on statistical models and should not be used as a substitute for professional medical diagnosis, advice, or treatment.{"\n\n"}
            Always consult a qualified healthcare professional before making any medical decisions. The accuracy of predictions depends on the quality and completeness of input data.
          </Text>
        </View>

        <Text style={styles.copyright}>
          © 2025 HealthPredict AI · All rights reserved
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: Colors.text,
    marginBottom: 4,
  },
  heroVersion: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  heroDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
    marginBottom: 14,
  },
  featureCard: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  featureGradient: {
    padding: 16,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  featureIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureHeaderText: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  accuracyBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  accuracyText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  featureDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  stepNumberText: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    color: Colors.white,
  },
  stepConnector: {
    position: "absolute",
    left: 15,
    top: 36,
    bottom: -12,
    width: 2,
    backgroundColor: Colors.border,
  },
  hidden: { opacity: 0 },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  techGrid: {
    gap: 10,
  },
  techCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  techRole: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.primary,
    marginBottom: 4,
  },
  techDetail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  disclaimerSection: {
    backgroundColor: Colors.warning + "11",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.warning + "33",
  },
  disclaimerIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  disclaimerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.warning + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  disclaimerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
  },
  disclaimerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  copyright: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 20,
  },
});
