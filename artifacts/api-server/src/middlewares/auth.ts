import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { sessionsTable, usersTable } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { User, UserRole } from "@workspace/db/schema";

export interface AuthRequest extends Request {
  user?: User;
  sessionToken?: string;
}

export async function resolveUser(req: AuthRequest): Promise<User | null> {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  if (!token) return null;

  try {
    const now = new Date();
    const rows = await db
      .select({ user: usersTable, session: sessionsTable })
      .from(sessionsTable)
      .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
      .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, now)))
      .limit(1);

    if (!rows.length) return null;
    const { user } = rows[0];
    if (!user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const user = await resolveUser(req);
  if (!user) {
    res.status(401).json({ error: "Wymagane logowanie." });
    return;
  }
  req.user = user;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const user = await resolveUser(req);
    if (!user) {
      res.status(401).json({ error: "Wymagane logowanie." });
      return;
    }
    if (!roles.includes(user.role as UserRole)) {
      res.status(403).json({ error: "Brak uprawnień." });
      return;
    }
    req.user = user;
    next();
  };
}
