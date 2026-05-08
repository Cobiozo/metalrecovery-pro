import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const analysisSharesTable = pgTable("analysis_shares", {
  id: text("id").primaryKey(),
  resultJson: text("result_json").notNull(),
  photoDataUrl: text("photo_data_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export type AnalysisShare = typeof analysisSharesTable.$inferSelect;
