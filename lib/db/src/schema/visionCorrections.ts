import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const visionCorrectionsTable = pgTable("vision_corrections", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  aiMaterialType: text("ai_material_type").notNull(),
  correctMaterialType: text("correct_material_type").notNull(),
  correctionNote: text("correction_note"),
  imageDescription: text("image_description"),
  userId: integer("user_id"),
  userEmail: text("user_email"),
  status: text("status").notNull().default("pending"),
  promotedRuleId: integer("promoted_rule_id"),
});

export type VisionCorrection = typeof visionCorrectionsTable.$inferSelect;
