import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcrypt";
import * as schema from "../lib/db/src/schema/index.js";
import { eq } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL nie jest ustawiony.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const email = process.argv[2] ?? "biuro@mobilne-it.pl";
const password = process.argv[3] ?? "Admin1234!";
const name = process.argv[4] ?? "Administrator";

async function main() {
  const existing = await db
    .select({ id: schema.usersTable.id })
    .from(schema.usersTable)
    .where(eq(schema.usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing.length) {
    console.log(`Użytkownik ${email} już istnieje. Aktualizuję rolę na admin...`);
    await db.update(schema.usersTable)
      .set({ role: "admin", isActive: true, emailVerified: true })
      .where(eq(schema.usersTable.email, email.toLowerCase()));
    console.log("Zaktualizowano.");
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(schema.usersTable)
    .values({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: "admin",
      isActive: true,
      emailVerified: true,
    })
    .returning({ id: schema.usersTable.id, email: schema.usersTable.email });

  console.log(`\n✓ Konto administratora utworzone:`);
  console.log(`  Email:  ${user.email}`);
  console.log(`  Hasło:  ${password}`);
  console.log(`  ID:     ${user.id}`);
  console.log(`\nZaloguj się na ${email} z podanym hasłem.`);
  console.log("ZMIEŃ HASŁO PO PIERWSZYM LOGOWANIU!\n");

  await pool.end();
}

main().catch((err) => {
  console.error("Błąd:", err);
  pool.end();
  process.exit(1);
});
