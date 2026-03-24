import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLayoutEffect } from "react";
import { useMutation } from "@tanstack/react-query";

import Colors from "@/constants/colors";
import FormField from "@/components/FormField";
import SegmentedControl from "@/components/SegmentedControl";
import {
  predictDiabetes,
  predictHeart,
  predictParkinsons,
} from "@workspace/api-client-react";
import type {
  DiabetesInput,
  HeartInput,
  ParkinsonsInput,
} from "@workspace/api-client-react";

type DiseaseType = "diabetes" | "heart" | "parkinsons";

const DISEASE_COLORS: Record<DiseaseType, [string, string]> = {
  diabetes: ["#4338CA", "#6366F1"],
  heart: ["#B91C1C", "#EF4444"],
  parkinsons: ["#B45309", "#F59E0B"],
};

const DISEASE_ACCENT: Record<DiseaseType, string> = {
  diabetes: Colors.diabetesColor,
  heart: Colors.heartColor,
  parkinsons: Colors.parkinsonsColor,
};

const DISEASE_ICONS: Record<DiseaseType, "droplet" | "heart" | "mic"> = {
  diabetes: "droplet",
  heart: "heart",
  parkinsons: "mic",
};

const DISEASE_TITLES: Record<DiseaseType, string> = {
  diabetes: "Diabetes",
  heart: "Heart Disease",
  parkinsons: "Parkinson's",
};

function DiabetesForm({ onSubmit, isLoading, accentColor }: {
  onSubmit: (data: DiabetesInput) => void;
  isLoading: boolean;
  accentColor: string;
}) {
  const [form, setForm] = useState({
    pregnancies: "", glucose: "", bloodPressure: "", skinThickness: "",
    insulin: "", bmi: "", diabetesPedigreeFunction: "", age: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    const fields = Object.keys(form) as (keyof typeof form)[];
    for (const f of fields) {
      const v = parseFloat(form[f]);
      if (isNaN(v) || form[f].trim() === "") {
        e[f] = "Required";
      }
    }
    if (parseFloat(form.glucose) < 0 || parseFloat(form.glucose) > 500)
      e.glucose = "Enter a valid glucose level (0-500)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      pregnancies: parseFloat(form.pregnancies),
      glucose: parseFloat(form.glucose),
      bloodPressure: parseFloat(form.bloodPressure),
      skinThickness: parseFloat(form.skinThickness),
      insulin: parseFloat(form.insulin),
      bmi: parseFloat(form.bmi),
      diabetesPedigreeFunction: parseFloat(form.diabetesPedigreeFunction),
      age: parseFloat(form.age),
    });
  };

  return (
    <>
      <FormField label="Pregnancies" value={form.pregnancies} onChangeText={update("pregnancies")} error={errors.pregnancies} info="Number of times pregnant (0 if male or never pregnant)" placeholder="e.g. 2" />
      <FormField label="Glucose" value={form.glucose} onChangeText={update("glucose")} unit="mg/dL" error={errors.glucose} info="Plasma glucose concentration from a 2-hour oral glucose tolerance test" placeholder="e.g. 120" />
      <FormField label="Blood Pressure" value={form.bloodPressure} onChangeText={update("bloodPressure")} unit="mm Hg" error={errors.bloodPressure} info="Diastolic blood pressure" placeholder="e.g. 80" />
      <FormField label="Skin Thickness" value={form.skinThickness} onChangeText={update("skinThickness")} unit="mm" error={errors.skinThickness} info="Triceps skin fold thickness" placeholder="e.g. 20" />
      <FormField label="Insulin" value={form.insulin} onChangeText={update("insulin")} unit="μU/ml" error={errors.insulin} info="2-Hour serum insulin level" placeholder="e.g. 80" />
      <FormField label="BMI" value={form.bmi} onChangeText={update("bmi")} unit="kg/m²" error={errors.bmi} info="Body mass index (weight in kg / height in m²)" placeholder="e.g. 25.5" />
      <FormField label="Diabetes Pedigree" value={form.diabetesPedigreeFunction} onChangeText={update("diabetesPedigreeFunction")} error={errors.diabetesPedigreeFunction} info="Diabetes pedigree function - scores likelihood based on family history (0.08 to 2.42)" placeholder="e.g. 0.52" />
      <FormField label="Age" value={form.age} onChangeText={update("age")} unit="years" error={errors.age} placeholder="e.g. 35" />
      <SubmitButton onPress={handleSubmit} isLoading={isLoading} accentColor={accentColor} />
    </>
  );
}

function HeartForm({ onSubmit, isLoading, accentColor }: {
  onSubmit: (data: HeartInput) => void;
  isLoading: boolean;
  accentColor: string;
}) {
  const [form, setForm] = useState({
    age: "", restingBP: "", cholesterol: "", maxHR: "", oldpeak: "",
  });
  const [sex, setSex] = useState<number | null>(null);
  const [chestPainType, setChestPainType] = useState<number | null>(null);
  const [fastingBS, setFastingBS] = useState<number | null>(null);
  const [restingECG, setRestingECG] = useState<number | null>(null);
  const [exerciseAngina, setExerciseAngina] = useState<number | null>(null);
  const [stSlope, setStSlope] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    ["age", "restingBP", "cholesterol", "maxHR", "oldpeak"].forEach((k) => {
      if (form[k as keyof typeof form].trim() === "" || isNaN(parseFloat(form[k as keyof typeof form]))) {
        e[k] = "Required";
      }
    });
    if (sex === null) e.sex = "Required";
    if (chestPainType === null) e.chestPainType = "Required";
    if (fastingBS === null) e.fastingBS = "Required";
    if (restingECG === null) e.restingECG = "Required";
    if (exerciseAngina === null) e.exerciseAngina = "Required";
    if (stSlope === null) e.stSlope = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      age: parseFloat(form.age),
      sex: sex!,
      chestPainType: chestPainType!,
      restingBP: parseFloat(form.restingBP),
      cholesterol: parseFloat(form.cholesterol),
      fastingBS: fastingBS!,
      restingECG: restingECG!,
      maxHR: parseFloat(form.maxHR),
      exerciseAngina: exerciseAngina!,
      oldpeak: parseFloat(form.oldpeak),
      stSlope: stSlope!,
    });
  };

  return (
    <>
      <FormField label="Age" value={form.age} onChangeText={update("age")} unit="years" error={errors.age} placeholder="e.g. 55" />
      <SegmentedControl label="Sex" options={[{ label: "Female", value: 0 }, { label: "Male", value: 1 }]} value={sex} onChange={setSex} accentColor={accentColor} />
      {errors.sex && <Text style={styles.segError}>{errors.sex}</Text>}

      <SegmentedControl label="Chest Pain Type" options={[{ label: "Typical Angina", value: 0 }, { label: "Atypical Angina", value: 1 }, { label: "Non-anginal", value: 2 }, { label: "Asymptomatic", value: 3 }]} value={chestPainType} onChange={setChestPainType} accentColor={accentColor} />
      {errors.chestPainType && <Text style={styles.segError}>{errors.chestPainType}</Text>}

      <FormField label="Resting Blood Pressure" value={form.restingBP} onChangeText={update("restingBP")} unit="mm Hg" error={errors.restingBP} placeholder="e.g. 120" />
      <FormField label="Cholesterol" value={form.cholesterol} onChangeText={update("cholesterol")} unit="mg/dL" error={errors.cholesterol} info="Serum cholesterol level" placeholder="e.g. 200" />

      <SegmentedControl label="Fasting Blood Sugar > 120 mg/dL" options={[{ label: "No", value: 0 }, { label: "Yes", value: 1 }]} value={fastingBS} onChange={setFastingBS} accentColor={accentColor} />
      {errors.fastingBS && <Text style={styles.segError}>{errors.fastingBS}</Text>}

      <SegmentedControl label="Resting ECG" options={[{ label: "Normal", value: 0 }, { label: "ST-T Wave", value: 1 }, { label: "LV Hypertrophy", value: 2 }]} value={restingECG} onChange={setRestingECG} accentColor={accentColor} />
      {errors.restingECG && <Text style={styles.segError}>{errors.restingECG}</Text>}

      <FormField label="Max Heart Rate" value={form.maxHR} onChangeText={update("maxHR")} unit="bpm" error={errors.maxHR} placeholder="e.g. 150" />

      <SegmentedControl label="Exercise-Induced Angina" options={[{ label: "No", value: 0 }, { label: "Yes", value: 1 }]} value={exerciseAngina} onChange={setExerciseAngina} accentColor={accentColor} />
      {errors.exerciseAngina && <Text style={styles.segError}>{errors.exerciseAngina}</Text>}

      <FormField label="Oldpeak (ST Depression)" value={form.oldpeak} onChangeText={update("oldpeak")} info="ST depression induced by exercise relative to rest" error={errors.oldpeak} placeholder="e.g. 1.0" />

      <SegmentedControl label="ST Slope" options={[{ label: "Up", value: 0 }, { label: "Flat", value: 1 }, { label: "Down", value: 2 }]} value={stSlope} onChange={setStSlope} accentColor={accentColor} />
      {errors.stSlope && <Text style={styles.segError}>{errors.stSlope}</Text>}

      <SubmitButton onPress={handleSubmit} isLoading={isLoading} accentColor={accentColor} />
    </>
  );
}

function ParkinsonsForm({ onSubmit, isLoading, accentColor }: {
  onSubmit: (data: ParkinsonsInput) => void;
  isLoading: boolean;
  accentColor: string;
}) {
  const [form, setForm] = useState({
    mdvpFo: "", mdvpFhi: "", mdvpFlo: "", mdvpJitter: "", mdvpShimmer: "",
    nhr: "", hnr: "", rpde: "", dfa: "", spread1: "", spread2: "", d2: "", ppe: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    const keys = Object.keys(form) as (keyof typeof form)[];
    for (const k of keys) {
      if (form[k].trim() === "" || isNaN(parseFloat(form[k]))) {
        e[k] = "Required";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      mdvpFo: parseFloat(form.mdvpFo),
      mdvpFhi: parseFloat(form.mdvpFhi),
      mdvpFlo: parseFloat(form.mdvpFlo),
      mdvpJitter: parseFloat(form.mdvpJitter),
      mdvpShimmer: parseFloat(form.mdvpShimmer),
      nhr: parseFloat(form.nhr),
      hnr: parseFloat(form.hnr),
      rpde: parseFloat(form.rpde),
      dfa: parseFloat(form.dfa),
      spread1: parseFloat(form.spread1),
      spread2: parseFloat(form.spread2),
      d2: parseFloat(form.d2),
      ppe: parseFloat(form.ppe),
    });
  };

  return (
    <>
      <View style={styles.voiceNote}>
        <Feather name="info" size={14} color={Colors.primary} />
        <Text style={styles.voiceNoteText}>
          These are vocal frequency measurements from clinical voice recordings. Consult a specialist for proper measurement.
        </Text>
      </View>
      <FormField label="MDVP:Fo (Hz)" description="Average vocal fundamental frequency" value={form.mdvpFo} onChangeText={update("mdvpFo")} error={errors.mdvpFo} placeholder="e.g. 154.2" />
      <FormField label="MDVP:Fhi (Hz)" description="Maximum vocal fundamental frequency" value={form.mdvpFhi} onChangeText={update("mdvpFhi")} error={errors.mdvpFhi} placeholder="e.g. 197.1" />
      <FormField label="MDVP:Flo (Hz)" description="Minimum vocal fundamental frequency" value={form.mdvpFlo} onChangeText={update("mdvpFlo")} error={errors.mdvpFlo} placeholder="e.g. 116.3" />
      <FormField label="MDVP:Jitter (%)" description="Variation in fundamental frequency" value={form.mdvpJitter} onChangeText={update("mdvpJitter")} error={errors.mdvpJitter} placeholder="e.g. 0.00784" />
      <FormField label="MDVP:Shimmer" description="Variation in amplitude" value={form.mdvpShimmer} onChangeText={update("mdvpShimmer")} error={errors.mdvpShimmer} placeholder="e.g. 0.04374" />
      <FormField label="NHR" description="Noise-to-Harmonics Ratio" value={form.nhr} onChangeText={update("nhr")} error={errors.nhr} placeholder="e.g. 0.02211" />
      <FormField label="HNR" description="Harmonics-to-Noise Ratio" value={form.hnr} onChangeText={update("hnr")} error={errors.hnr} placeholder="e.g. 21.03" />
      <FormField label="RPDE" description="Recurrence period density entropy" value={form.rpde} onChangeText={update("rpde")} error={errors.rpde} placeholder="e.g. 0.4146" />
      <FormField label="DFA" description="Signal fractal scaling exponent" value={form.dfa} onChangeText={update("dfa")} error={errors.dfa} placeholder="e.g. 0.8153" />
      <FormField label="Spread1" description="Nonlinear measure of frequency variation" value={form.spread1} onChangeText={update("spread1")} error={errors.spread1} placeholder="e.g. -5.684" />
      <FormField label="Spread2" description="Nonlinear measure of frequency variation" value={form.spread2} onChangeText={update("spread2")} error={errors.spread2} placeholder="e.g. 0.2264" />
      <FormField label="D2" description="Correlation dimension" value={form.d2} onChangeText={update("d2")} error={errors.d2} placeholder="e.g. 2.302" />
      <FormField label="PPE" description="Pitch period entropy" value={form.ppe} onChangeText={update("ppe")} error={errors.ppe} placeholder="e.g. 0.2842" />
      <SubmitButton onPress={handleSubmit} isLoading={isLoading} accentColor={accentColor} />
    </>
  );
}

function SubmitButton({ onPress, isLoading, accentColor }: {
  onPress: () => void;
  isLoading: boolean;
  accentColor: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.submitBtn, { backgroundColor: accentColor }]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.85}
    >
      {isLoading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <>
          <Feather name="cpu" size={18} color={Colors.white} />
          <Text style={styles.submitText}>Analyze Now</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export default function PredictScreen() {
  const { disease } = useLocalSearchParams<{ disease: DiseaseType }>();
  const navigation = useNavigation();
  const safeDisease: DiseaseType = (disease as DiseaseType) || "diabetes";
  const accentColor = DISEASE_ACCENT[safeDisease];
  const gradient = DISEASE_COLORS[safeDisease];
  const title = DISEASE_TITLES[safeDisease];

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  const mutation = useMutation({
    mutationFn: async (data: DiabetesInput | HeartInput | ParkinsonsInput) => {
      if (safeDisease === "diabetes") return predictDiabetes(data as DiabetesInput);
      if (safeDisease === "heart") return predictHeart(data as HeartInput);
      return predictParkinsons(data as ParkinsonsInput);
    },
    onSuccess: (result) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.push({
        pathname: "/result",
        params: {
          disease: safeDisease,
          prediction: result.prediction,
          probability: result.probability.toString(),
          riskLevel: result.riskLevel,
          message: result.message,
          details: result.details,
        },
      });
    },
    onError: () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert("Analysis Failed", "Unable to connect to the prediction server. Please try again.");
    },
  });

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[gradient[0] + "33", Colors.transparent]}
          style={styles.gradientBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.bannerContent}>
            <LinearGradient
              colors={gradient}
              style={styles.bannerIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name={DISEASE_ICONS[safeDisease]} size={24} color={Colors.white} />
            </LinearGradient>
            <View>
              <Text style={styles.bannerTitle}>{title} Predictor</Text>
              <Text style={styles.bannerSub}>Fill in your clinical parameters</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.form}>
          {safeDisease === "diabetes" && (
            <DiabetesForm
              onSubmit={mutation.mutate}
              isLoading={mutation.isPending}
              accentColor={accentColor}
            />
          )}
          {safeDisease === "heart" && (
            <HeartForm
              onSubmit={mutation.mutate}
              isLoading={mutation.isPending}
              accentColor={accentColor}
            />
          )}
          {safeDisease === "parkinsons" && (
            <ParkinsonsForm
              onSubmit={mutation.mutate}
              isLoading={mutation.isPending}
              accentColor={accentColor}
            />
          )}
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
  content: {
    paddingBottom: 40,
  },
  gradientBanner: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 8,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  bannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
    marginBottom: 4,
  },
  bannerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  form: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.white,
  },
  voiceNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.primary + "18",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + "44",
  },
  voiceNoteText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  segError: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.danger,
    marginTop: -10,
    marginBottom: 12,
  },
});
