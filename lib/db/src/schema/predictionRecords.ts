import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const predictionRecordsTable = pgTable("prediction_records", {
  id: text("id").primaryKey(),
  diseaseType: text("disease_type").notNull(),
  prediction: text("prediction").notNull(),
  probability: real("probability").notNull(),
  riskLevel: text("risk_level").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPredictionRecordSchema = createInsertSchema(predictionRecordsTable).omit({ createdAt: true });
export type InsertPredictionRecord = z.infer<typeof insertPredictionRecordSchema>;
export type PredictionRecord = typeof predictionRecordsTable.$inferSelect;
