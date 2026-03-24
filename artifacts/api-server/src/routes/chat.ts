import { Router } from "express";
import { db } from "@workspace/db";
import { chatSessionsTable, chatMessagesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const SYSTEM_PROMPT = `You are MedBot AI, an intelligent and empathetic healthcare assistant. You help users understand medical conditions, symptoms, risk factors, medications, and healthy lifestyle choices.

Guidelines:
- Provide accurate, evidence-based health information in a clear and accessible way
- Be empathetic and supportive, especially for sensitive health topics
- Always recommend consulting a qualified healthcare professional for personalized medical advice
- For our platform's AI predictors (Diabetes, Heart Disease, Parkinson's), guide users to use the HealthPredict AI mobile app
- Format responses with clear structure using bullet points or numbered lists when appropriate
- Keep responses concise but thorough — aim for 100-250 words unless the topic requires more detail
- Never diagnose — only educate and inform
- If asked about something outside your healthcare expertise, politely redirect to health topics`;

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

router.get("/sessions", async (req, res) => {
  try {
    const sessions = await db
      .select()
      .from(chatSessionsTable)
      .orderBy(desc(chatSessionsTable.updatedAt));

    res.json(
      sessions.map((s) => ({
        id: s.id,
        title: s.title,
        preview: s.preview,
        messageCount: s.messageCount,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error(err, "Failed to get chat sessions");
    res.status(500).json({ error: "Failed to get chat sessions" });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Title is required" });

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

    const [s] = await db
      .select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, id))
      .limit(1);

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

    const [session] = await db
      .select()
      .from(chatSessionsTable)
      .where(eq(chatSessionsTable.id, sessionId))
      .limit(1);

    if (!session) return res.status(404).json({ error: "Session not found" });

    const msgs = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.sessionId, sessionId))
      .orderBy(chatMessagesTable.createdAt);

    res.json({
      id: session.id,
      title: session.title,
      messages: msgs.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "Failed to get chat session");
    res.status(500).json({ error: "Failed to get chat session" });
  }
});

router.delete("/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    await db.delete(chatSessionsTable).where(eq(chatSessionsTable.id, sessionId));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "Failed to delete chat session");
    res.status(500).json({ error: "Failed to delete chat session" });
  }
});

// SSE streaming message endpoint
router.post("/sessions/:sessionId/messages", async (req, res) => {
  const { sessionId } = req.params;
  const { content } = req.body;

  if (!content) return res.status(400).json({ error: "Content is required" });

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId))
    .limit(1);

  if (!session) return res.status(404).json({ error: "Session not found" });

  // Save user message first
  const userMsgId = generateId();
  const userNow = new Date();
  await db.insert(chatMessagesTable).values({
    id: userMsgId,
    sessionId,
    role: "user",
    content,
    createdAt: userNow,
  });

  // Load conversation history for context
  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(chatMessagesTable.createdAt);

  const chatMessages = history.map((m) => ({
    role: m.role === "bot" ? ("assistant" as const) : ("user" as const),
    content: m.content,
  }));

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...chatMessages,
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }
  } catch (err) {
    req.log.error(err, "OpenAI streaming error");
    res.write(`data: ${JSON.stringify({ error: "AI response failed" })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return;
  }

  // Save bot message and update session
  const botMsgId = generateId();
  const botNow = new Date();

  await db.insert(chatMessagesTable).values({
    id: botMsgId,
    sessionId,
    role: "bot",
    content: fullResponse,
    createdAt: botNow,
  });

  const preview = content.length > 80 ? content.substring(0, 80) + "…" : content;
  await db
    .update(chatSessionsTable)
    .set({
      messageCount: session.messageCount + 2,
      preview,
      updatedAt: botNow,
    })
    .where(eq(chatSessionsTable.id, sessionId));

  // Send final message with full bot message details
  res.write(
    `data: ${JSON.stringify({
      done: true,
      message: {
        id: botMsgId,
        sessionId,
        role: "bot",
        content: fullResponse,
        createdAt: botNow.toISOString(),
      },
    })}\n\n`
  );
  res.end();
});

export default router;
