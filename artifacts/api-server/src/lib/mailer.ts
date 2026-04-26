import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { systemSettingsTable, SETTINGS_KEYS } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(systemSettingsTable);
  return Object.fromEntries(rows.map((r) => [r.key, r.value ?? ""]));
}

export async function createTransporter() {
  const s = await getSettings();

  const host = s[SETTINGS_KEYS.SMTP_HOST];
  const user = s[SETTINGS_KEYS.SMTP_USER];
  const pass = s[SETTINGS_KEYS.SMTP_PASS];

  if (!host || !user || !pass) {
    throw new Error("SMTP nie jest skonfigurowany. Skonfiguruj go w panelu administratora.");
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(s[SETTINGS_KEYS.SMTP_PORT] ?? "587", 10),
    secure: s[SETTINGS_KEYS.SMTP_SECURE] === "true",
    auth: { user, pass },
  });
}

export async function sendVerificationEmail(to: string, name: string, link: string) {
  const s = await getSettings();
  const from = s[SETTINGS_KEYS.SMTP_FROM] ?? s[SETTINGS_KEYS.SMTP_USER];
  const transport = await createTransporter();

  await transport.sendMail({
    from: `"MetalRecovery Pro" <${from}>`,
    to,
    subject: "Potwierdź rejestrację — MetalRecovery Pro",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#0f172a;color:#e2e8f0;border-radius:8px">
        <h1 style="color:#f59e0b;margin:0 0 24px">MetalRecovery Pro</h1>
        <p>Cześć <strong>${name}</strong>,</p>
        <p>Dziękujemy za rejestrację. Kliknij przycisk poniżej, aby potwierdzić swój adres email:</p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#f59e0b;color:#0f172a;border-radius:6px;text-decoration:none;font-weight:700">
          Potwierdź email
        </a>
        <p style="color:#94a3b8;font-size:13px">Link wygasa po 24 godzinach. Jeśli nie zakładałeś konta, zignoruj tę wiadomość.</p>
      </div>
    `,
    text: `Potwierdź rejestrację w MetalRecovery Pro: ${link}`,
  });
}

export async function testSmtpConnection(config: {
  host: string; port: number; secure: boolean; user: string; pass: string;
}) {
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
  });
  await transport.verify();
}
