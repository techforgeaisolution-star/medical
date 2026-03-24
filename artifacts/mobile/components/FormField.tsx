import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface FormFieldProps {
  label: string;
  description?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  unit?: string;
  error?: string;
  info?: string;
  keyboardType?: "numeric" | "default";
}

export default function FormField({
  label,
  description,
  value,
  onChangeText,
  placeholder = "0",
  unit,
  error,
  info,
  keyboardType = "numeric",
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.labelRight}>
          {unit && (
            <View style={styles.unitBadge}>
              <Text style={styles.unitText}>{unit}</Text>
            </View>
          )}
          {info && (
            <TouchableOpacity
              onPress={() => setShowInfo(!showInfo)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather
                name="info"
                size={14}
                color={showInfo ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {description && (
        <Text style={styles.description}>{description}</Text>
      )}

      {showInfo && info && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{info}</Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="done"
        />
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={12} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  labelRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  unitBadge: {
    backgroundColor: Colors.primary + "22",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.primary,
  },
  infoBox: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  infoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  inputContainer: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.text,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.danger,
  },
});
