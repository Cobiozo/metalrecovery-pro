import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm, copyFile, mkdir, cp } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildAll() {
  const deployDir = path.resolve(__dirname, "deploy");
  const apiOut = path.resolve(deployDir, "api-bundle.cjs");

  console.log("Building API routes (CJS)...");
  await esbuild({
    entryPoints: [path.resolve(__dirname, "artifacts/api-server/src/routes/index.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: apiOut,
    logLevel: "info",
    external: ["*.node", "sharp", "better-sqlite3", "sqlite3", "canvas", "bcrypt", "argon2"],
    sourcemap: false,
    tsconfig: path.resolve(__dirname, "artifacts/api-server/tsconfig.json"),
  });

  console.log("Building frontend (Vite)...");
  const { execSync } = await import("node:child_process");
  execSync(
    "BASE_PATH=/ pnpm --filter @workspace/metals-calculator run build",
    { stdio: "inherit", env: { ...process.env, BASE_PATH: "/" } }
  );

  console.log("Copying frontend to deploy/public/...");
  const frontendDist = path.resolve(__dirname, "artifacts/metals-calculator/dist/public");
  const publicOut = path.resolve(deployDir, "public");
  await rm(publicOut, { recursive: true, force: true });
  await cp(frontendDist, publicOut, { recursive: true });

  console.log("\nDeploy folder ready: ./deploy/");
  console.log("  server.js       -> Passenger entry point");
  console.log("  api-bundle.cjs  -> compiled API routes");
  console.log("  public/         -> built frontend (SPA)");
  console.log("  package.json    -> production deps\n");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
