// Esegui con: node setup-gmail.js
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, 'app', 'api', 'gmail');

const files = {
  'tokens.ts': `import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const TOKEN_DIR = join(process.cwd(), ".gmail-tokens");
const TOKEN_FILE = join(TOKEN_DIR, "tokens.json");

export interface GmailTokens {
  access_token: string;
  refresh_token: string;
  expiry: number;
  email: string;
}

export function getTokens(): GmailTokens | null {
  if (!existsSync(TOKEN_FILE)) return null;
  try { return JSON.parse(readFileSync(TOKEN_FILE, "utf-8")); } catch { return null; }
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens) return null;
  if (tokens.expiry > Date.now() + 300000) return tokens.access_token;
  const clientId = process.env.GMAIL_CLIENT_ID!;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET!;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: tokens.refresh_token, grant_type: "refresh_token" }),
    });
    const data = await res.json();
    if (data.access_token) {
      tokens.access_token = data.access_token;
      tokens.expiry = Date.now() + (data.expires_in * 1000);
      writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
      return tokens.access_token;
    }
  } catch {}
  return null;
}
`,

  'auth/route.ts': `import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const redirectUri = process.env.GMAIL_REDIRECT_URI || "http://localhost:3000/api/gmail/callback";
  if (!clientId) return NextResponse.json({ error: "GMAIL_CLIENT_ID non configurato" }, { status: 500 });
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" ");
  const authUrl = \`https://accounts.google.com/o/oauth2/v2/auth?client_id=\${clientId}&redirect_uri=\${encodeURIComponent(redirectUri)}&response_type=code&scope=\${encodeURIComponent(scopes)}&access_type=offline&prompt=consent\`;
  return NextResponse.redirect(authUrl);
}
`,

  'callback/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const TOKEN_DIR = join(process.cwd(), ".gmail-tokens");
const TOKEN_FILE = join(TOKEN_DIR, "tokens.json");

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  if (error) return NextResponse.redirect(new URL("/dashboard?gmail=error&msg=" + error, req.url));
  if (!code) return NextResponse.redirect(new URL("/dashboard?gmail=error&msg=no_code", req.url));
  const clientId = process.env.GMAIL_CLIENT_ID!;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET!;
  const redirectUri = process.env.GMAIL_REDIRECT_URI || "http://localhost:3000/api/gmail/callback";
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const tokens = await tokenRes.json();
    if (tokens.error) return NextResponse.redirect(new URL("/dashboard?gmail=error&msg=" + tokens.error, req.url));
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: \`Bearer \${tokens.access_token}\` } });
    const user = await userRes.json();
    if (!existsSync(TOKEN_DIR)) mkdirSync(TOKEN_DIR, { recursive: true });
    writeFileSync(TOKEN_FILE, JSON.stringify({ access_token: tokens.access_token, refresh_token: tokens.refresh_token, expiry: Date.now() + (tokens.expires_in * 1000), email: user.email }, null, 2));
    return NextResponse.redirect(new URL(\`/dashboard?gmail=ok&email=\${user.email}\`, req.url));
  } catch (err: any) {
    return NextResponse.redirect(new URL("/dashboard?gmail=error&msg=" + err.message, req.url));
  }
}
`,

  'status/route.ts': `import { NextResponse } from "next/server";
import { getTokens, getValidAccessToken } from "../tokens";

export async function GET() {
  const tokens = getTokens();
  if (!tokens) return NextResponse.json({ connected: false });
  const accessToken = await getValidAccessToken();
  return NextResponse.json({ connected: !!accessToken, email: tokens.email });
}
`,

  'messages/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "../tokens";

const GMAIL_API = "https://www.googleapis.com/gmail/v1/users/me";

function decodeBase64Url(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  try { return Buffer.from(padded, "base64").toString("utf-8"); } catch { return ""; }
}

function extractBody(payload: any): string {
  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  if (payload.parts) {
    const plain = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (plain?.body?.data) return decodeBase64Url(plain.body.data);
    const html = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (html?.body?.data) {
      const raw = decodeBase64Url(html.body.data);
      return raw.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
    }
    for (const part of payload.parts) {
      if (part.parts) { const nested = extractBody(part); if (nested) return nested; }
    }
  }
  return "";
}

function getHeader(headers: any[], name: string): string {
  return headers?.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function extractAttachments(payload: any): any[] {
  const atts: any[] = [];
  function walk(parts: any[]) {
    if (!parts) return;
    for (const p of parts) {
      if (p.filename && p.body?.attachmentId) atts.push({ filename: p.filename, mimeType: p.mimeType, size: p.body.size || 0, attachmentId: p.body.attachmentId });
      if (p.parts) walk(p.parts);
    }
  }
  walk(payload.parts || []);
  return atts;
}

export async function GET(req: NextRequest) {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "Non connesso a Gmail" }, { status: 401 });
  const maxResults = req.nextUrl.searchParams.get("max") || "20";
  const pageToken = req.nextUrl.searchParams.get("page") || "";
  const query = req.nextUrl.searchParams.get("q") || "";
  try {
    let url = \`\${GMAIL_API}/messages?maxResults=\${maxResults}&labelIds=INBOX\`;
    if (pageToken) url += \`&pageToken=\${pageToken}\`;
    if (query) url += \`&q=\${encodeURIComponent(query)}\`;
    const listRes = await fetch(url, { headers: { Authorization: \`Bearer \${token}\` } });
    const listData = await listRes.json();
    if (!listData.messages) return NextResponse.json({ messages: [], nextPage: null });
    const messages = await Promise.all(
      listData.messages.slice(0, 20).map(async (m: any) => {
        const msgRes = await fetch(\`\${GMAIL_API}/messages/\${m.id}?format=full\`, { headers: { Authorization: \`Bearer \${token}\` } });
        const msg = await msgRes.json();
        const hdrs = msg.payload?.headers || [];
        return {
          id: msg.id, threadId: msg.threadId,
          from: getHeader(hdrs, "From"), to: getHeader(hdrs, "To"),
          subject: getHeader(hdrs, "Subject"), date: getHeader(hdrs, "Date"),
          timestamp: parseInt(msg.internalDate || "0"),
          snippet: msg.snippet || "", body: extractBody(msg.payload),
          labels: msg.labelIds || [], unread: (msg.labelIds || []).includes("UNREAD"),
          attachments: extractAttachments(msg.payload),
        };
      })
    );
    return NextResponse.json({ messages, nextPage: listData.nextPageToken || null, total: listData.resultSizeEstimate || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`,

  'send/route.ts': `import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken, getTokens } from "../tokens";

export async function POST(req: NextRequest) {
  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "Non connesso" }, { status: 401 });
  const { to, subject, body, replyTo, threadId } = await req.json();
  if (!to || !subject) return NextResponse.json({ error: "Destinatario e oggetto obbligatori" }, { status: 400 });
  const tokens = getTokens();
  const fromEmail = tokens?.email || "";
  const hdrs = [\`From: \${fromEmail}\`, \`To: \${to}\`, \`Subject: \${subject}\`, "MIME-Version: 1.0", 'Content-Type: text/plain; charset="UTF-8"'];
  if (replyTo) { hdrs.push(\`In-Reply-To: \${replyTo}\`); hdrs.push(\`References: \${replyTo}\`); }
  const rawMessage = hdrs.join("\\r\\n") + "\\r\\n\\r\\n" + body;
  const encoded = Buffer.from(rawMessage).toString("base64").replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
  try {
    const sendBody: any = { raw: encoded };
    if (threadId) sendBody.threadId = threadId;
    const res = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: \`Bearer \${token}\`, "Content-Type": "application/json" },
      body: JSON.stringify(sendBody),
    });
    const data = await res.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 });
    return NextResponse.json({ success: true, id: data.id, threadId: data.threadId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`,

  'disconnect/route.ts': `import { NextResponse } from "next/server";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";

export async function POST() {
  const tokenFile = join(process.cwd(), ".gmail-tokens", "tokens.json");
  if (existsSync(tokenFile)) unlinkSync(tokenFile);
  return NextResponse.json({ disconnected: true });
}
`,
};

// Create all files
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(BASE, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log('✅ ' + fullPath);
});

console.log('\n=== FATTO! Tutti i 7 file Gmail API creati ===');
console.log('Ora fai: rmdir /s /q .next && npm run dev');
