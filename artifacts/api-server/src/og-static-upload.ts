import { Client } from "ssh2";

const SSH_HOST = process.env.CYBERFOLKS_SSH_HOST ?? "";
const SSH_USER = process.env.CYBERFOLKS_SSH_USER ?? "";
const SSH_PASS = process.env.CYBERFOLKS_SSH_PASS ?? "";
const SSH_PORT = 222;
const REMOTE_BASE = "/home/xlqsymddxy/domains/metalrecovery.online/public_html/analiza";

/**
 * Build the static OG HTML for a share (no meta-refresh — prevents bots
 * from making a 2nd request; JS redirect remains for human browsers).
 */
export function buildOgHtml(opts: {
  shareId: string;
  ogTitle: string;
  ogDesc: string;
  ogImage?: string;
}): string {
  const { shareId, ogTitle, ogDesc } = opts;
  const ogImage = opts.ogImage ?? "https://metalrecovery.online/og-preview-v2.jpg";
  const shareUrl = `https://metalrecovery.online/analiza/${shareId}`;
  const spaUrl = `${shareUrl}?view=1`;

  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8"/>
<title>${esc(ogTitle)}</title>
<meta name="description" content="${esc(ogDesc)}"/>
<meta property="og:type" content="website"/>
<meta property="og:url" content="${esc(shareUrl)}"/>
<meta property="og:site_name" content="MetalRecovery Pro"/>
<meta property="og:title" content="${esc(ogTitle)}"/>
<meta property="og:description" content="${esc(ogDesc)}"/>
<meta property="og:image" content="${esc(ogImage)}"/>
<meta property="og:image:type" content="image/jpeg"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="${esc(ogTitle)}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(ogTitle)}"/>
<meta name="twitter:description" content="${esc(ogDesc)}"/>
<meta name="twitter:image" content="${esc(ogImage)}"/>
<script>window.location.replace(${JSON.stringify(spaUrl)});</script>
</head>
<body><a href="${esc(spaUrl)}">${esc(ogTitle)}</a></body>
</html>`;
}

/**
 * Upload static OG HTML file to Cyberfolks via SSH/SFTP.
 * Creates ~/public_html/analiza/{shareId}  (extensionless file, exact URL path)
 *
 * WHY extensionless file instead of directory:
 * LiteSpeed's bot-blocking returns 403 with static file body ONLY for exact
 * file path matches. A directory at analiza/shareId/ triggers a 301 redirect
 * which blocked IPs never receive properly. An extensionless file at the exact
 * path analiza/shareId is served directly with 403 body → Facebook reads OG tags.
 */
export async function uploadOgStaticFile(shareId: string, html: string): Promise<void> {
  if (!SSH_HOST || !SSH_USER || !SSH_PASS) {
    console.warn("[og-upload] SSH credentials not configured, skipping static OG upload");
    return;
  }

  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on("ready", () => {
      conn.sftp((sftpErr, sftp) => {
        if (sftpErr) { conn.end(); return reject(sftpErr); }

        const remotePath = `${REMOTE_BASE}/${shareId}`;
        const writeStream = sftp.createWriteStream(remotePath);

        writeStream.on("close", () => {
          conn.end();
          resolve();
        });
        writeStream.on("error", (e: Error) => {
          conn.end();
          reject(e);
        });

        writeStream.write(html);
        writeStream.end();
      });
    });

    conn.on("error", reject);

    conn.connect({
      host: SSH_HOST,
      port: SSH_PORT,
      username: SSH_USER,
      password: SSH_PASS,
      readyTimeout: 10000,
    });
  });
}
