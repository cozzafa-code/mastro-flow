export const dynamic="force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken, getTokens } from "../tokens";
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { logAudit, getIpFromRequest } from "@/lib/audit-log";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const rl = rateLimit(ip, RATE_LIMITS.email);
  if (!rl.success) return rateLimitResponse(rl);

  const token = await getValidAccessToken();
  if (!token) return NextResponse.json({ error: "Non connesso" }, { status: 401 });
  const { to, subject, body, replyTo, threadId } = await req.json();
  if (!to || !subject) return NextResponse.json({ error: "Destinatario e oggetto obbligatori" }, { status: 400 });
  const tokens = getTokens();
  const fromEmail = tokens?.email || "";
  const hdrs = [`From: ${fromEmail}`, `To: ${to}`, `Subject: ${subject}`, "MIME-Version: 1.0", 'Content-Type: text/plain; charset="UTF-8"'];
  if (replyTo) { hdrs.push(`In-Reply-To: ${replyTo}`); hdrs.push(`References: ${replyTo}`); }
  const rawMessage = hdrs.join("\r\n") + "\r\n\r\n" + body;
  const encoded = Buffer.from(rawMessage).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  try {
    const sendBody: any = { raw: encoded };
    if (threadId) sendBody.threadId = threadId;
    const res = await fetch("https://www.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(sendBody),
    });
    const data = await res.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 });
    await logAudit({ azienda_id: 'gmail', action: 'email_send', entity: 'gmail', details: { to, subject }, ip: getIpFromRequest(req) });
    return NextResponse.json({ success: true, id: data.id, threadId: data.threadId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
