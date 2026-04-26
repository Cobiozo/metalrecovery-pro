import { Router, Response } from "express";
import bcrypt from "bcrypt";
import { db } from "@workspace/db";
import {
  usersTable, sessionsTable, systemSettingsTable, SETTINGS_KEYS,
  systemStatsTable, STAT_METRICS, aiAnalysisLogsTable, visitLogsTable,
} from "@workspace/db/schema";
import { eq, desc, ne, sql } from "drizzle-orm";
import { requireRole, type AuthRequest } from "../middlewares/auth";
import { getStatsLastDays } from "../lib/stats";
import { testSmtpConnection } from "../lib/mailer";

const router = Router();

const adminOnly = requireRole("admin");

router.get("/users", adminOnly, async (_req: AuthRequest, res: Response) => {
  const users = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      isActive: usersTable.isActive,
      emailVerified: usersTable.emailVerified,
      aiUsageCount: usersTable.aiUsageCount,
      createdAt: usersTable.createdAt,
      lastLoginAt: usersTable.lastLoginAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));
  res.json(users);
});

router.post("/users", adminOnly, async (req: AuthRequest, res: Response) => {
  const { email, password, name, role, isActive, emailVerified } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: "Podaj email i hasło." });
    return;
  }
  const normalizedEmail = (email as string).toLowerCase().trim();
  const existing = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, normalizedEmail))
    .limit(1);
  if (existing.length) {
    res.status(409).json({ error: "Użytkownik z tym emailem już istnieje." });
    return;
  }
  const passwordHash = await bcrypt.hash(password as string, 12);
  const [user] = await db
    .insert(usersTable)
    .values({
      email: normalizedEmail,
      passwordHash,
      name: name ?? null,
      role: role ?? "user",
      isActive: isActive !== false,
      emailVerified: emailVerified === true,
    })
    .returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      isActive: usersTable.isActive,
      emailVerified: usersTable.emailVerified,
      createdAt: usersTable.createdAt,
    });
  res.status(201).json(user);
});

router.put("/users/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Nieprawidłowe ID." }); return; }

  const { name, role, isActive, emailVerified, password } = req.body ?? {};

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;
  if (emailVerified !== undefined) updates.emailVerified = emailVerified;
  if (password) updates.passwordHash = await bcrypt.hash(password as string, 12);

  if (!Object.keys(updates).length) {
    res.status(400).json({ error: "Brak danych do aktualizacji." });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning({
      id: usersTable.id, email: usersTable.email, name: usersTable.name,
      role: usersTable.role, isActive: usersTable.isActive, emailVerified: usersTable.emailVerified,
    });

  if (!updated) { res.status(404).json({ error: "Użytkownik nie znaleziony." }); return; }
  res.json(updated);
});

router.delete("/users/:id", adminOnly, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const callerId = req.user!.id;
  if (id === callerId) { res.status(400).json({ error: "Nie możesz usunąć własnego konta." }); return; }
  await db.delete(sessionsTable).where(eq(sessionsTable.userId, id));
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
  if (!deleted) { res.status(404).json({ error: "Użytkownik nie znaleziony." }); return; }
  res.json({ ok: true });
});

router.get("/stats", adminOnly, async (_req: AuthRequest, res: Response) => {
  const [
    dailyStats,
    totalUsers,
    totalAiRows,
  ] = await Promise.all([
    getStatsLastDays(30),
    db.select({ id: usersTable.id, role: usersTable.role }).from(usersTable),
    db
      .select({ total: sql<number>`coalesce(sum(${systemStatsTable.value}), 0)` })
      .from(systemStatsTable)
      .where(eq(systemStatsTable.metric, STAT_METRICS.AI_ANALYSES)),
  ]);

  const userCounts = { admin: 0, user: 0, vip: 0, total: totalUsers.length };
  for (const u of totalUsers) {
    if (u.role === "admin") userCounts.admin++;
    else if (u.role === "vip") userCounts.vip++;
    else userCounts.user++;
  }

  const totalAI = Number(totalAiRows[0]?.total ?? 0);

  res.json({ daily: dailyStats, users: userCounts, totalAiAnalyses: totalAI });
});

router.get("/ai-logs", adminOnly, async (_req: AuthRequest, res: Response) => {
  const logs = await db
    .select()
    .from(aiAnalysisLogsTable)
    .orderBy(desc(aiAnalysisLogsTable.createdAt))
    .limit(100);
  res.json(logs);
});

router.get("/visit-logs", adminOnly, async (_req: AuthRequest, res: Response) => {
  const logs = await db
    .select()
    .from(visitLogsTable)
    .orderBy(desc(visitLogsTable.createdAt))
    .limit(200);
  res.json(logs);
});

router.get("/settings", adminOnly, async (_req: AuthRequest, res: Response) => {
  const rows = await db.select().from(systemSettingsTable);
  const settings: Record<string, string | null> = {};
  for (const r of rows) settings[r.key] = r.value;
  res.json(settings);
});

router.put("/settings", adminOnly, async (req: AuthRequest, res: Response) => {
  const updates = req.body as Record<string, string>;
  if (!updates || typeof updates !== "object") {
    res.status(400).json({ error: "Nieprawidłowe dane." });
    return;
  }

  for (const [key, value] of Object.entries(updates)) {
    await db
      .insert(systemSettingsTable)
      .values({ key, value: String(value), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [systemSettingsTable.key],
        set: { value: String(value), updatedAt: new Date() },
      });
  }
  res.json({ ok: true });
});

router.post("/settings/smtp-test", adminOnly, async (req: AuthRequest, res: Response) => {
  const { host, port, secure, user, pass } = req.body ?? {};
  if (!host || !user || !pass) {
    res.status(400).json({ error: "Podaj host, użytkownika i hasło SMTP." });
    return;
  }
  try {
    await testSmtpConnection({
      host: host as string,
      port: parseInt(port ?? "587", 10),
      secure: secure === true || secure === "true",
      user: user as string,
      pass: pass as string,
    });
    res.json({ ok: true, message: "Połączenie SMTP działa poprawnie." });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Nieznany błąd";
    res.status(400).json({ error: `Błąd połączenia SMTP: ${msg}` });
  }
});

export default router;
