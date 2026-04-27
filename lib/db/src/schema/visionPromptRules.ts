import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const visionPromptRulesTable = pgTable("vision_prompt_rules", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  title: text("title").notNull(),
  ruleText: text("rule_text").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type VisionPromptRule = typeof visionPromptRulesTable.$inferSelect;
