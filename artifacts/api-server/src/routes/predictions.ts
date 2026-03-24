import { Router, type IRouter } from "express";
import {
  PredictDiabetesBody,
  PredictHeartBody,
  PredictParkinsonsBody,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { predictionRecordsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getRiskLevel(probability: number): "low" | "moderate" | "high" {
  if (probability < 0.35) return "low";
  if (probability < 0.65) return "moderate";
  return "high";
}

function predictDiabetesLogic(input: {
  pregnancies: number;
  glucose: number;
  bloodPressure: number;
  skinThickness: number;
  insulin: number;
  bmi: number;
  diabetesPedigreeFunction: number;
  age: number;
}): number {
  let score = 0;

  if (input.glucose >= 126) score += 0.35;
  else if (input.glucose >= 100) score += 0.18;
  else score -= 0.05;

  if (input.bmi >= 30) score += 0.2;
  else if (input.bmi >= 25) score += 0.08;

  if (input.age >= 45) score += 0.12;
  else if (input.age >= 35) score += 0.06;

  if (input.diabetesPedigreeFunction > 0.5) score += 0.1;
  if (input.pregnancies >= 5) score += 0.07;
  if (input.bloodPressure > 90) score += 0.06;
  if (input.insulin > 200) score += 0.05;

  const baseProbability = 0.08;
  const probability = Math.min(0.97, Math.max(0.03, baseProbability + score));
  return probability;
}

function predictHeartLogic(input: {
  age: number;
  sex: number;
  chestPainType: number;
  restingBP: number;
  cholesterol: number;
  fastingBS: number;
  restingECG: number;
  maxHR: number;
  exerciseAngina: number;
  oldpeak: number;
  stSlope: number;
}): number {
  let score = 0;

  if (input.age >= 65) score += 0.2;
  else if (input.age >= 55) score += 0.12;
  else if (input.age >= 45) score += 0.06;

  if (input.sex === 1) score += 0.08;

  if (input.chestPainType === 0) score += 0.2;
  else if (input.chestPainType === 1) score += 0.1;

  if (input.cholesterol >= 240) score += 0.12;
  else if (input.cholesterol >= 200) score += 0.05;

  if (input.restingBP >= 140) score += 0.1;
  else if (input.restingBP >= 130) score += 0.05;

  if (input.fastingBS === 1) score += 0.08;
  if (input.exerciseAngina === 1) score += 0.12;
  if (input.oldpeak >= 2) score += 0.1;
  else if (input.oldpeak >= 1) score += 0.05;

  const maxHRExpected = 220 - input.age;
  const hrRatio = input.maxHR / maxHRExpected;
  if (hrRatio < 0.6) score += 0.1;
  else if (hrRatio < 0.75) score += 0.05;

  if (input.stSlope === 2) score += 0.06;

  const baseProbability = 0.05;
  return Math.min(0.97, Math.max(0.03, baseProbability + score));
}

function predictParkinsonsLogic(input: {
  mdvpFo: number;
  mdvpFhi: number;
  mdvpFlo: number;
  mdvpJitter: number;
  mdvpShimmer: number;
  nhr: number;
  hnr: number;
  rpde: number;
  dfa: number;
  spread1: number;
  spread2: number;
  d2: number;
  ppe: number;
}): number {
  let score = 0;

  if (input.mdvpJitter > 0.006) score += 0.2;
  else if (input.mdvpJitter > 0.003) score += 0.1;

  if (input.mdvpShimmer > 0.04) score += 0.2;
  else if (input.mdvpShimmer > 0.02) score += 0.1;

  if (input.nhr > 0.2) score += 0.15;
  else if (input.nhr > 0.1) score += 0.08;

  if (input.hnr < 20) score += 0.12;
  else if (input.hnr < 25) score += 0.06;

  if (input.rpde > 0.6) score += 0.1;
  if (input.ppe > 0.2) score += 0.1;

  const freqRange = input.mdvpFhi - input.mdvpFlo;
  if (freqRange > 200) score -= 0.05;
  if (freqRange < 50) score += 0.08;

  const baseProbability = 0.1;
  return Math.min(0.97, Math.max(0.03, baseProbability + score));
}

router.post("/diabetes", async (req, res) => {
  const parsed = PredictDiabetesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.errors });
    return;
  }

  const probability = predictDiabetesLogic(parsed.data);
  const riskLevel = getRiskLevel(probability);
  const isPositive = probability >= 0.5;

  const result = {
    prediction: isPositive ? "positive" : "negative",
    probability: Math.round(probability * 1000) / 1000,
    riskLevel,
    message: isPositive
      ? "High likelihood of diabetes detected. Please consult a healthcare provider."
      : "Low likelihood of diabetes. Maintain a healthy lifestyle.",
    details: `Based on glucose level (${parsed.data.glucose} mg/dL), BMI (${parsed.data.bmi}), and other clinical markers, the model estimates a ${Math.round(probability * 100)}% probability of diabetes.`,
  };

  try {
    await db.insert(predictionRecordsTable).values({
      id: generateId(),
      diseaseType: "diabetes",
      prediction: result.prediction,
      probability: result.probability,
      riskLevel: result.riskLevel,
      message: result.message,
    });
  } catch {
    req.log.warn("Failed to save prediction to DB");
  }

  res.json(result);
});

router.post("/heart", async (req, res) => {
  const parsed = PredictHeartBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.errors });
    return;
  }

  const probability = predictHeartLogic(parsed.data);
  const riskLevel = getRiskLevel(probability);
  const isPositive = probability >= 0.5;

  const result = {
    prediction: isPositive ? "positive" : "negative",
    probability: Math.round(probability * 1000) / 1000,
    riskLevel,
    message: isPositive
      ? "Elevated risk of heart disease detected. Immediate medical consultation advised."
      : "No significant heart disease risk found. Continue healthy habits.",
    details: `Based on cholesterol (${parsed.data.cholesterol} mg/dl), blood pressure (${parsed.data.restingBP} mm Hg), and cardiac indicators, the model estimates a ${Math.round(probability * 100)}% probability of heart disease.`,
  };

  try {
    await db.insert(predictionRecordsTable).values({
      id: generateId(),
      diseaseType: "heart",
      prediction: result.prediction,
      probability: result.probability,
      riskLevel: result.riskLevel,
      message: result.message,
    });
  } catch {
    req.log.warn("Failed to save prediction to DB");
  }

  res.json(result);
});

router.post("/parkinsons", async (req, res) => {
  const parsed = PredictParkinsonsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.errors });
    return;
  }

  const probability = predictParkinsonsLogic(parsed.data);
  const riskLevel = getRiskLevel(probability);
  const isPositive = probability >= 0.5;

  const result = {
    prediction: isPositive ? "positive" : "negative",
    probability: Math.round(probability * 1000) / 1000,
    riskLevel,
    message: isPositive
      ? "Vocal biomarkers suggest possible Parkinson's signs. Consult a neurologist."
      : "Vocal biomarkers do not indicate Parkinson's signs at this time.",
    details: `Based on voice frequency variation (Jitter: ${parsed.data.mdvpJitter}), amplitude variation (Shimmer: ${parsed.data.mdvpShimmer}), and noise-to-harmonics ratio (${parsed.data.nhr}), the model estimates a ${Math.round(probability * 100)}% probability of Parkinson's disease.`,
  };

  try {
    await db.insert(predictionRecordsTable).values({
      id: generateId(),
      diseaseType: "parkinsons",
      prediction: result.prediction,
      probability: result.probability,
      riskLevel: result.riskLevel,
      message: result.message,
    });
  } catch {
    req.log.warn("Failed to save prediction to DB");
  }

  res.json(result);
});

router.get("/history", async (req, res) => {
  try {
    const records = await db
      .select()
      .from(predictionRecordsTable)
      .orderBy(desc(predictionRecordsTable.createdAt))
      .limit(50);

    res.json(records.map((r) => ({
      id: r.id,
      diseaseType: r.diseaseType,
      prediction: r.prediction,
      probability: r.probability,
      riskLevel: r.riskLevel,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    })));
  } catch {
    req.log.error("Failed to fetch prediction history");
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default router;
