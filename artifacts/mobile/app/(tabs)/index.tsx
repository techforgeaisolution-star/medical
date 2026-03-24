import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";

import Colors from "@/constants/colors";
import DiseaseCard, { DiseaseType } from "@/components/DiseaseCard";

const STATS = [
  { label: "Accuracy", value: "~87%", icon: "target" as const },
  { label: "Diseases", value: "3", icon: "activity" as const },
  { label: "Parameters", value: "32", icon: "sliders" as const },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const handleDiseasePress = (disease: DiseaseType) => {
    router.push({
      pathname: "/predict/[disease]",
      params: { disease },
    });
  };

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.container,
          { paddingTop: topPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.logoRow}>
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              style={styles.logoIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="activity" size={22} color={Colors.white} />
            </LinearGradient>
            <Text style={styles.logoText}>HealthPredict</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>
            Your AI Health{"\n"}Risk Analyzer
          </Text>
          <Text style={styles.heroSubtitle}>
            Enter your clinical parameters and get instant ML-powered predictions for three major diseases.
          </Text>
        </View>

        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Feather name={stat.icon} size={16} color={Colors.primary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Disease Analysis</Text>
          <Text style={styles.sectionSubtitle}>Select a condition to analyze</Text>
        </View>

        <DiseaseCard disease="diabetes" onPress={() => handleDiseasePress("diabetes")} />
        <DiseaseCard disease="heart" onPress={() => handleDiseasePress("heart")} />
        <DiseaseCard disease="parkinsons" onPress={() => handleDiseasePress("parkinsons")} />

        <View style={styles.disclaimer}>
          <Feather name="alert-circle" size={14} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            For educational purposes only. Not a substitute for professional medical diagnosis.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingBottom: 120,
  },
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  aiBadge: {
    backgroundColor: Colors.primary + "33",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    color: Colors.primary,
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 32,
    color: Colors.text,
    lineHeight: 40,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 28,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
  },
  statLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    padding: 14,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disclaimerText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
});
