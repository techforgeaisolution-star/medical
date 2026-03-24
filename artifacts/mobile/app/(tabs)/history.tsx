import React from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { getPredictionHistory } from "@workspace/api-client-react";

type RiskLevel = "low" | "moderate" | "high";
type DiseaseType = "diabetes" | "heart" | "parkinsons";

const DISEASE_CONFIG: Record<DiseaseType, {
  label: string;
  icon: "droplet" | "heart" | "mic";
  gradient: [string, string];
  accentColor: string;
}> = {
  diabetes: {
    label: "Diabetes",
    icon: "droplet",
    gradient: ["#4338CA", "#6366F1"],
    accentColor: Colors.diabetesColor,
  },
  heart: {
    label: "Heart Disease",
    icon: "heart",
    gradient: ["#B91C1C", "#EF4444"],
    accentColor: Colors.heartColor,
  },
  parkinsons: {
    label: "Parkinson's",
    icon: "mic",
    gradient: ["#B45309", "#F59E0B"],
    accentColor: Colors.parkinsonsColor,
  },
};

const RISK_COLORS: Record<RiskLevel, string> = {
  low: Colors.success,
  moderate: Colors.warning,
  high: Colors.danger,
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low Risk",
  moderate: "Moderate",
  high: "High Risk",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface HistoryItem {
  id: string;
  diseaseType: DiseaseType;
  prediction: "positive" | "negative";
  probability: number;
  riskLevel: RiskLevel;
  message: string;
  createdAt: string;
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const config = DISEASE_CONFIG[item.diseaseType];
  const riskColor = RISK_COLORS[item.riskLevel];

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyCardLeft}>
        <LinearGradient
          colors={config.gradient}
          style={styles.historyIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name={config.icon} size={18} color={Colors.white} />
        </LinearGradient>
        <View style={styles.historyVertLine} />
      </View>

      <View style={styles.historyCardContent}>
        <View style={styles.historyCardHeader}>
          <Text style={styles.historyDisease}>{config.label}</Text>
          <View style={[styles.riskChip, { backgroundColor: riskColor + "22" }]}>
            <Text style={[styles.riskChipText, { color: riskColor }]}>
              {RISK_LABELS[item.riskLevel]}
            </Text>
          </View>
        </View>
        <View style={styles.probabilityRow}>
          <Text style={styles.probabilityValue}>
            {Math.round(item.probability * 100)}%
          </Text>
          <Text style={styles.probabilityLabel}>confidence</Text>
          <View style={[
            styles.predictionBadge,
            {
              backgroundColor: item.prediction === "positive"
                ? Colors.danger + "22"
                : Colors.success + "22",
            },
          ]}>
            <Feather
              name={item.prediction === "positive" ? "alert-circle" : "check-circle"}
              size={11}
              color={item.prediction === "positive" ? Colors.danger : Colors.success}
            />
            <Text style={[
              styles.predictionBadgeText,
              {
                color: item.prediction === "positive" ? Colors.danger : Colors.success,
              },
            ]}>
              {item.prediction === "positive" ? "Detected" : "Not Detected"}
            </Text>
          </View>
        </View>
        <Text style={styles.historyDate}>
          <Feather name="clock" size={11} color={Colors.textMuted} /> {formatDate(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["prediction-history"],
    queryFn: () => getPredictionHistory(),
  });

  const handleRefetch = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    refetch();
  };

  const typedData = (data as HistoryItem[] | undefined) ?? [];

  return (
    <View style={[styles.root, { paddingBottom: bottomPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.headerTitle}>History</Text>
        <Text style={styles.headerSub}>Your past predictions</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : isError ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="wifi-off" size={36} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Connection Error</Text>
          <Text style={styles.emptySubtitle}>Could not load prediction history.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRefetch}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : typedData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="clock" size={36} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Predictions Yet</Text>
          <Text style={styles.emptySubtitle}>
            Run your first health analysis to see results here.
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.push("/")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.startBtnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Feather name="activity" size={16} color={Colors.white} />
              <Text style={styles.startBtnText}>Start Analysis</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={typedData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryCard item={item} />}
          scrollEnabled={!!typedData.length}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={handleRefetch}
              tintColor={Colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{typedData.length} analyses</Text>
              </View>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  retryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
  startBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
  },
  startBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  startBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 8,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
    marginTop: 8,
  },
  countBadge: {
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  historyCard: {
    flexDirection: "row",
    marginBottom: 16,
  },
  historyCardLeft: {
    alignItems: "center",
    marginRight: 12,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  historyVertLine: {
    flex: 1,
    width: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
    marginBottom: -8,
  },
  historyCardContent: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  historyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDisease: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  riskChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  riskChipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  probabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  probabilityValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  probabilityLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  predictionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  predictionBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  historyDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
  },
});
