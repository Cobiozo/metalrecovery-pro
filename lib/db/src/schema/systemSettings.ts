import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const systemSettingsTable = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type SystemSetting = typeof systemSettingsTable.$inferSelect;

export const SETTINGS_KEYS = {
  REGISTRATION_ENABLED: "registration_enabled",
  SMTP_HOST: "smtp_host",
  SMTP_PORT: "smtp_port",
  SMTP_USER: "smtp_user",
  SMTP_PASS: "smtp_pass",
  SMTP_FROM: "smtp_from",
  SMTP_SECURE: "smtp_secure",
  SITE_URL: "site_url",
  API_URL: "api_url",
} as const;
