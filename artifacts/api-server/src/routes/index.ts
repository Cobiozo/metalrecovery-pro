import { Router, type IRouter } from "express";
import healthRouter from "./health";
import metalsRouter from "./metals";
import materialsRouter from "./materials";
import chemicalsRouter from "./chemicals";
import calculatorRouter from "./calculator";
import visionRouter from "./vision";

const router: IRouter = Router();

router.use(healthRouter);
router.use(metalsRouter);
router.use(materialsRouter);
router.use(chemicalsRouter);
router.use(calculatorRouter);
router.use("/vision", visionRouter);

async function bootstrapAdmin(): Promise<void> {
  const { db } = await import("@workspace/db");
  const { usersTable } = await import("@workspace/db/schema");
  const bcrypt = await import("bcrypt");

  const existing = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  if (existing.length > 0) return;

  const email = (process.env.ADMIN_EMAIL ?? "biuro@mobilne-it.pl").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD ?? "Admin1234!";
  const passwordHash = await bcrypt.hash(password, 12);

  await db.insert(usersTable).values({
    email,
    passwordHash,
    name: "Administrator",
    role: "admin",
    isActive: true,
    emailVerified: true,
  });

  console.log(`[bootstrap] Admin account created: ${email}`);
}

export async function registerDbRoutes(): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  const { ensureSchema } = await import("../lib/migrate");
  await ensureSchema().catch((err) => {
    console.error("[migrate] Schema error:", err);
  });

  await bootstrapAdmin().catch((err) => {
    console.error("[bootstrap] Failed to create admin:", err);
  });

  const [{ default: authRouter }, { default: adminRouter }] = await Promise.all([
    import("./auth"),
    import("./admin"),
  ]);
  router.use("/auth", authRouter);
  router.use("/admin", adminRouter);
}

export default router;
