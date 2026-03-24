import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "@/constants/colors";

interface SegmentedControlProps {
  label: string;
  options: { label: string; value: number }[];
  value: number | null;
  onChange: (value: number) => void;
  accentColor?: string;
}

export default function SegmentedControl({
  label,
  options,
  value,
  onChange,
  accentColor = Colors.primary,
}: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segmentRow}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.segment,
                isSelected && [
                  styles.segmentSelected,
                  { backgroundColor: accentColor + "33", borderColor: accentColor },
                ],
              ]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentText,
                  isSelected && { color: accentColor },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
  segmentSelected: {},
  segmentText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
