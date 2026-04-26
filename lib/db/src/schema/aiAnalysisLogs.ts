import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const aiAnalysisLogsTable = pgTable("ai_analysis_logs", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  ip: text("ip").notNull(),
  userId: integer("user_id"),
  userEmail: text("user_email"),
  materialsDetected: text("materials_detected"),
  itemCount: integer("item_count").notNull().default(0),
});

export type AiAnalysisLog = typeof aiAnalysisLogsTable.$inferSelect;
