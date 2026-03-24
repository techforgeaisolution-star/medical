import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

export type DiseaseType = "diabetes" | "heart" | "parkinsons";

interface DiseaseCardProps {
  disease: DiseaseType;
  onPress: () => void;
}

const DISEASE_CONFIG = {
  diabetes: {
    title: "Diabetes",
    subtitle: "Blood glucose & insulin analysis",
    icon: "droplet" as const,
    gradient: ["#4338CA", "#6366F1"] as [string, string],
    accentColor: Colors.diabetesColor,
    description: "Predict diabetes risk using 8 clinical biomarkers including glucose levels, BMI, and insulin.",
    fields: "8 parameters",
  },
  heart: {
    title: "Heart Disease",
    subtitle: "Cardiac health assessment",
    icon: "heart" as const,
    gradient: ["#B91C1C", "#EF4444"] as [string, string],
    accentColor: Colors.heartColor,
    description: "Assess cardiovascular risk using 11 clinical indicators including ECG results and cholesterol.",
    fields: "11 parameters",
  },
  parkinsons: {
    title: "Parkinson's",
    subtitle: "Vocal biomarker analysis",
    icon: "mic" as const,
    gradient: ["#B45309", "#F59E0B"] as [string, string],
    accentColor: Colors.parkinsonsColor,
    description: "Detect Parkinson's signs through vocal frequency variations and harmonic measurements.",
    fields: "13 parameters",
  },
};

export default function DiseaseCard({ disease, onPress }: DiseaseCardProps) {
  const config = DISEASE_CONFIG[disease];

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={["#1C2540", "#161D2F"]}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <LinearGradient
            colors={config.gradient}
            style={styles.iconContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Feather name={config.icon} size={22} color={Colors.white} />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: config.accentColor + "22" }]}>
            <Text style={[styles.badgeText, { color: config.accentColor }]}>
              {config.fields}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{config.description}</Text>

        <View style={styles.footer}>
          <View style={[styles.startButton, { backgroundColor: config.accentColor + "22" }]}>
            <Text style={[styles.startText, { color: config.accentColor }]}>
              Start Analysis
            </Text>
            <Feather name="arrow-right" size={14} color={config.accentColor} />
          </View>
        </View>

        <View style={[styles.accentLine, { backgroundColor: config.accentColor }]} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    alignItems: "flex-start",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  accentLine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
});
