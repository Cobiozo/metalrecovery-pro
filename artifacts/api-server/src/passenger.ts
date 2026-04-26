import express from "express";
import compression from "compression";
import path from "node:path";
import { exec } from "node:child_process";
import fs from "node:fs";

import router from "./routes/index.js";

const SOCIAL_BOT_RE =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot/i;

const app = express();

app.disable("x-powered-by");

app.use(function (req, res, next) {
  const ua = req.headers["user-agent"] || "";
  if (SOCIAL_BOT_RE.test(ua)) {
    res.setHeader("X-LiteSpeed-Cache-Control", "public,max-age=3600");
    res.setHeader("X-LiteSpeed-Vary", "");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.setHeader("Vary", "Accept-Encoding");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

app.use(compression({ threshold: 1024 }));

app.use("/api", function (_req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

app.use("/api", router);

app.use("/api", function (req, res) {
  res
    .status(404)
    .json({ error: "Endpoint not found: " + req.method + " /api" + req.path });
});

app.post("/deploy", function (req, res) {
  const secret = process.env.DEPLOY_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Deploy endpoint not configured (brak DEPLOY_SECRET)" });
    return;
  }
  const auth = req.headers["authorization"];
  if (!auth || auth !== "Bearer " + secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const repoRoot = path.join(__dirname, "..");
  const cmd = [
    "git fetch origin",
    "git checkout origin/main -- deploy/",
  ].join(" && ");
  exec(cmd, { cwd: repoRoot }, function (err, stdout, stderr) {
    if (err) {
      console.error("[deploy] git error:", err.message, stderr);
      res.status(500).json({ error: err.message, stderr });
      return;
    }
    try {
      const tmpDir = path.join(__dirname, "tmp");
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, "restart.txt"), new Date().toISOString() + "\n");
    } catch (e) {
      console.warn("[deploy] restart.txt warning:", e);
    }
    console.log("[deploy] OK:", stdout.trim());
    res.json({ ok: true, stdout: stdout.trim(), stderr: stderr.trim() });
  });
});

const publicDir = path.join(__dirname, "public");

app.use(
  express.static(publicDir, {
    maxAge: "7d",
    etag: true,
    lastModified: true,
    index: false,
  }),
);

app.use(function (_req, res) {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use(function (
  err: { status?: number; statusCode?: number; message?: string },
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction,
) {
  console.error("[error]", err.message || err);
  if (res.headersSent) return;
  const status = err.status || err.statusCode || 500;
  res
    .status(status)
    .json({ error: status === 500 ? "Internal server error" : err.message });
});

process.on("uncaughtException", function (err) {
  console.error("[uncaughtException]", err);
  process.exit(1);
});

process.on("unhandledRejection", function (reason) {
  console.error("[unhandledRejection]", reason);
});

let httpServer: ReturnType<typeof app.listen> | null = null;

function shutdown(signal: string) {
  console.log("[shutdown] " + signal + " received, closing gracefully...");
  if (httpServer) {
    httpServer.close(function () {
      console.log("[shutdown] HTTP server closed. Exiting.");
      process.exit(0);
    });
    setTimeout(function () {
      console.error("[shutdown] Forced exit after timeout.");
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on("SIGTERM", function () {
  shutdown("SIGTERM");
});
process.on("SIGINT", function () {
  shutdown("SIGINT");
});

const port = parseInt(process.env.PORT || "3000", 10);
httpServer = app.listen(port, function () {
  console.log("[start] MetalRecovery Pro listening on port " + port);
});
httpServer.keepAliveTimeout = 65000;
httpServer.headersTimeout = 66000;
