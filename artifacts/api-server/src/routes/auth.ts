import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  usersTable, sessionsTable, emailVerificationsTable, systemSettingsTable,
  SETTINGS_KEYS,
} from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { sendVerificationEmail } from "../lib/mailer";

const router = Router();
const SESSION_DURATION_DAYS = 30;

function generateToken(len = 48): string {
  return crypto.randomBytes(len).toString("hex");
}

function sessionExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DURATION_DAYS);
  return d;
}

async function getSetting(key: string): Promise<string | null> {
  const rows = await db
    .select({ value: systemSettingsTable.value })
    .from(systemSettingsTable)
    .where(eq(systemSettingsTable.key, key))
    .limit(1);
  return rows[0]?.value ?? null;
}

router.get("/register-status", async (_req, res) => {
  const val = await getSetting(SETTINGS_KEYS.REGISTRATION_ENABLED);
  res.json({ enabled: val === "true" });
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Podaj email i hasło." });
    return;
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, (email as string).toLowerCase().trim()))
    .limit(1);

  const user = users[0];
  if (!user) {
    res.status(401).json({ error: "Nieprawidłowy email lub hasło." });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ error: "Konto jest nieaktywne. Skontaktuj się z administratorem." });
    return;
  }

  if (!user.emailVerified) {
    res.status(401).json({ error: "Adres email nie został potwierdzony. Sprawdź swoją skrzynkę i kliknij link weryfikacyjny." });
    return;
  }

  const valid = await bcrypt.compare(password as string, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Nieprawidłowy email lub hasło." });
    return;
  }

  const token = generateToken();
  await db.insert(sessionsTable).values({
    userId: user.id,
    token,
    expiresAt: sessionExpiry(),
    ipAddress: (req.headers["x-forwarded-for"] as string) ?? req.ip ?? null,
    userAgent: req.headers["user-agent"] ?? null,
  });

  await db
    .update(usersTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(usersTable.id, user.id));

  const { passwordHash: _ph, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.post("/logout", requireAuth, async (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (token) {
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token));
  }
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const { passwordHash: _ph, ...safeUser } = req.user!;
  res.json(safeUser);
});

router.post("/register", async (req: Request, res: Response) => {
  const regEnabled = await getSetting(SETTINGS_KEYS.REGISTRATION_ENABLED);
  if (regEnabled !== "true") {
    res.status(403).json({ error: "Rejestracja jest aktualnie wyłączona." });
    return;
  }

  const { email, password, name } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Podaj email i hasło." });
    return;
  }
  if ((password as string).length < 8) {
    res.status(400).json({ error: "Hasło musi mieć co najmniej 8 znaków." });
    return;
  }

  const normalizedEmail = (email as string).toLowerCase().trim();
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail))
    .limit(1);

  if (existing.length) {
    res.status(409).json({ error: "Ten adres email jest już zarejestrowany." });
    return;
  }

  const passwordHash = await bcrypt.hash(password as string, 12);
  const [newUser] = await db
    .insert(usersTable)
    .values({ email: normalizedEmail, passwordHash, name: name ?? null, role: "user", emailVerified: false })
    .returning();

  const verToken = generateToken(32);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.insert(emailVerificationsTable).values({
    userId: newUser.id,
    token: verToken,
    expiresAt: expires,
  });

  const siteUrl = await getSetting(SETTINGS_KEYS.SITE_URL) ?? "https://metalrecovery.online";
  const verificationLink = `${siteUrl}/api/auth/verify-email/${verToken}`;

  let emailError: string | null = null;
  try {
    await sendVerificationEmail(normalizedEmail, name as string ?? normalizedEmail, verificationLink);
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err);
    console.error("[AUTH] sendVerificationEmail failed:", emailError);
  }

  if (emailError) {
    res.status(201).json({
      ok: true,
      emailSent: false,
      message: `Konto zostało utworzone, ale wysyłka emaila weryfikacyjnego nie powiodła się (${emailError}). Skontaktuj się z administratorem w celu ręcznego potwierdzenia konta.`,
    });
  } else {
    res.status(201).json({ ok: true, emailSent: true, message: "Konto utworzone. Sprawdź email i kliknij link weryfikacyjny, aby aktywować konto." });
  }
});

router.get("/verify-email/:token", async (req: Request, res: Response) => {
  const token = req.params.token as string;
  const now = new Date();

  const rows = await db
    .select()
    .from(emailVerificationsTable)
    .where(and(eq(emailVerificationsTable.token, token), gt(emailVerificationsTable.expiresAt, now)))
    .limit(1);

  if (!rows.length) {
    res.status(400).send("Link weryfikacyjny jest nieprawidłowy lub wygasł.");
    return;
  }

  const verification = rows[0];
  await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, verification.userId));
  await db.delete(emailVerificationsTable).where(eq(emailVerificationsTable.id, verification.id));

  res.redirect("/logowanie?verified=1");
});

export default router;
