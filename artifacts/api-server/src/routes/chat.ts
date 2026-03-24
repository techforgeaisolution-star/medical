import { Router } from "express";
import { db } from "@workspace/db";
import { chatSessionsTable, chatMessagesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";

const router = Router();

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function buildBotResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("diabetes") || msg.includes("blood sugar") || msg.includes("glucose")) {
    return "Diabetes is a chronic condition affecting how your body processes blood sugar (glucose). Key risk factors include obesity, family history, and sedentary lifestyle. Our AI Diabetes Predictor can assess your risk using 8 clinical parameters. Prevention strategies include regular exercise, maintaining a healthy weight, and eating a balanced diet. Would you like to know more about specific symptoms or risk factors?";
  }

  if (msg.includes("heart") || msg.includes("cardiac") || msg.includes("cholesterol") || msg.includes("blood pressure")) {
    return "Heart disease is the leading cause of death worldwide. Risk factors include high blood pressure, high cholesterol, smoking, obesity, and diabetes. Our Heart Disease Predictor analyzes 11 clinical parameters to estimate your risk. Regular cardiovascular exercise, a heart-healthy diet low in saturated fats, and avoiding smoking significantly reduce your risk. Would you like tips on monitoring your heart health?";
  }

  if (msg.includes("parkinson") || msg.includes("tremor") || msg.includes("neurological")) {
    return "Parkinson's disease is a progressive neurological disorder affecting movement. Early symptoms include tremors, stiffness, and slowed movement. Our Parkinson's Predictor uses 13 voice signal parameters to assess risk, as vocal changes are often early indicators. While there's no cure, treatments can significantly improve quality of life. Exercise and physical therapy are particularly beneficial. Would you like more information?";
  }

  if (msg.includes("symptom") || msg.includes("check") || msg.includes("assess")) {
    return "I can help you assess health-related symptoms and risks. Our platform currently supports three AI-powered predictors:\n\n• **Diabetes Risk** — Uses 8 parameters including glucose, BMI, and age\n• **Heart Disease Risk** — Analyzes 11 cardiac markers\n• **Parkinson's Disease Risk** — Evaluates 13 voice signal parameters\n\nFor a personalized assessment, I recommend using the HealthPredict AI mobile app. What symptoms or conditions would you like to learn more about?";
  }

  if (msg.includes("medication") || msg.includes("medicine") || msg.includes("drug") || msg.includes("treatment")) {
    return "I can provide general information about medications, but for specific medical advice, please consult a healthcare professional. For chronic conditions like diabetes, heart disease, and Parkinson's, treatments typically combine medication with lifestyle changes. Always follow your doctor's prescription and never stop taking medication without consulting them. Is there a specific condition or medication type you'd like to learn about?";
  }

  if (msg.includes("diet") || msg.includes("nutrition") || msg.includes("eat") || msg.includes("food")) {
    return "Nutrition plays a crucial role in managing and preventing chronic diseases:\n\n• **For Diabetes**: Low-glycemic foods, whole grains, lean proteins, and plenty of vegetables. Limit sugary drinks and refined carbs.\n• **For Heart Health**: Mediterranean diet — olive oil, fish, nuts, fruits, and vegetables. Limit sodium and saturated fats.\n• **For Brain Health**: Antioxidant-rich foods, omega-3 fatty acids (fatty fish, walnuts), and berries support neurological health.\n\nWould you like a more detailed dietary plan for a specific condition?";
  }

  if (msg.includes("exercise") || msg.includes("workout") || msg.includes("physical activity")) {
    return "Regular physical activity is one of the most powerful tools for preventing and managing chronic disease:\n\n• **Aerobic exercise** (150 min/week): Walking, swimming, cycling — improves heart health and insulin sensitivity\n• **Strength training** (2x/week): Maintains muscle mass and metabolism\n• **Balance exercises**: Especially important for neurological conditions like Parkinson's\n• **Flexibility**: Yoga and stretching reduce injury risk\n\nAlways consult your doctor before starting a new exercise program, especially if you have existing health conditions.";
  }

  if (msg.includes("help") || msg.includes("what can you") || msg.includes("how can you")) {
    return "I'm MedBot AI, your intelligent healthcare assistant! I can help you with:\n\n• **Health Education** — Learn about diabetes, heart disease, Parkinson's, and more\n• **Risk Assessment** — Understand your disease risk factors\n• **Lifestyle Guidance** — Diet, exercise, and prevention tips\n• **Medication Information** — General information about treatments\n• **Symptom Information** — Learn what symptoms to watch for\n\nFor actual AI-powered risk predictions, use our HealthPredict mobile app. What would you like to know?";
  }

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("greetings")) {
    return "Hello! I'm MedBot AI, your intelligent medical assistant powered by artificial intelligence. I'm here to provide health information, explain disease risks, and guide you toward better health decisions.\n\nI can discuss topics like diabetes, heart disease, Parkinson's disease, nutrition, exercise, and much more. Remember, I provide general health information — for personalized medical advice, always consult a qualified healthcare professional.\n\nHow can I assist you today?";
  }

  if (msg.includes("stress") || msg.includes("anxiety") || msg.includes("mental health") || msg.includes("sleep")) {
    return "Mental health and physical health are deeply interconnected. Chronic stress can increase your risk of heart disease, diabetes, and weaken your immune system. Key strategies for managing stress:\n\n• **Sleep hygiene**: Aim for 7-9 hours per night\n• **Mindfulness & meditation**: Reduces cortisol levels\n• **Regular exercise**: Natural mood booster\n• **Social connections**: Strong social ties improve longevity\n• **Professional support**: Therapists and counselors can provide personalized strategies\n\nWould you like to explore a specific aspect of mental wellness?";
  }

  const responses = [
    "That's an important health question. Based on medical research, maintaining a balanced lifestyle with regular exercise, a nutritious diet, adequate sleep, and stress management are the cornerstones of good health. Could you tell me more specifically what condition or symptom you're curious about?",
    "Thank you for your question. For the most accurate health guidance, I recommend consulting with a qualified healthcare professional. However, I can share that preventive care — regular check-ups, healthy habits, and awareness of risk factors — plays a critical role in long-term health. What specific health topic can I elaborate on?",
    "That's a great health topic to explore. Our AI-powered predictors can assess your risk for diabetes, heart disease, and Parkinson's disease. For broader health questions, I can provide evidence-based information about symptoms, risk factors, and preventive strategies. What would you like to know more about?",
    "I understand your health concern. The most important factors for maintaining good health are preventive care, early detection, and healthy lifestyle choices. Our platform uses clinical data and AI to help assess disease risks. Is there a specific condition or symptom you'd like to learn more about?",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

router.get("/sessions", async (req, res) => {
  try {
    const sessions = await db
      .select()
      .from(chatSessionsTable)
      .orderBy(desc(chatSessionsTable.updatedAt));

    const result = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      preview: s.preview,
      messageCount: s.messageCount,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err, "Failed to get chat sessions");
    res.status(500).json({ error: "Failed to get chat sessions" });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const id = generateId();
    const now = new Date();

    await db.insert(chatSessionsTable).values({
      id,
      title,
      preview: "",
      messageCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const session = await db
      .select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, id))
      .limit(1);

    const s = session[0];
    res.status(201).json({
      id: s.id,
      title: s.title,
      preview: s.preview,
      messageCount: s.messageCount,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to create chat session");
    res.status(500).json({ error: "Failed to create chat session" });
  }
});

router.get("/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessions = await db
      .select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, sessionId))
      .limit(1);

    if (!sessions.length) {
      return res.status(404).json({ error: "Session not found" });
    }

    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, sessionId))
      .orderBy(chatMessagesTable.createdAt);

    const s = sessions[0];
    res.json({
      id: s.id,
      title: s.title,
      messages: messages.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to get chat session");
    res.status(500).json({ error: "Failed to get chat session" });
  }
});

router.delete("/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    await db
      .delete(chatSessionsTable)
      .where(eq(chatSessionsTable.id, sessionId));

    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "Failed to delete chat session");
    res.status(500).json({ error: "Failed to delete chat session" });
  }
});

router.post("/sessions/:sessionId/messages", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const sessions = await db
      .select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, sessionId))
      .limit(1);

    if (!sessions.length) {
      return res.status(404).json({ error: "Session not found" });
    }

    const userMsgId = generateId();
    const now = new Date();

    await db.insert(chatMessagesTable).values({
      id: userMsgId,
      sessionId,
      role: "user",
      content,
      createdAt: now,
    });

    const botContent = buildBotResponse(content);
    const botMsgId = generateId();
    const botNow = new Date(Date.now() + 1);

    await db.insert(chatMessagesTable).values({
      id: botMsgId,
      sessionId,
      role: "bot",
      content: botContent,
      createdAt: botNow,
    });

    const currentSession = sessions[0];
    const newCount = currentSession.messageCount + 2;
    const preview = content.length > 80 ? content.substring(0, 80) + "…" : content;

    await db
      .update(chatSessionsTable)
      .set({
        messageCount: newCount,
        preview,
        updatedAt: botNow,
      })
      .where(eq(chatSessionsTable.id, sessionId));

    res.json({
      id: botMsgId,
      sessionId,
      role: "bot",
      content: botContent,
      createdAt: botNow.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to send chat message");
    res.status(500).json({ error: "Failed to send chat message" });
  }
});

export default router;
