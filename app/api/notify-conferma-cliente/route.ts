// app/api/notify-conferma-cliente/route.ts
// POST: invia email al titolare quando cliente risponde a un preventivo
//
// Usa il provider email che hai già configurato (Resend / SMTP / SendGrid)
// Se non c'è provider, fallisce silentemente (la notifica push/popup è comunque arrivata)

import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.MASTRO_FROM_EMAIL || "noreply@mastrosuite.it";

const TITOLI: Record<string, { titolo: string; emoji: string; bg: string; ink: string }> = {
  accettato: { titolo: "Preventivo accettato dal cliente", emoji: "✓", bg: "#DDF5E6", ink: "#0E5E33" },
  modifiche: { titolo: "Cliente chiede modifiche al preventivo", emoji: "⚠", bg: "#FFF1D6", ink: "#A36B12" },
  chiamare:  { titolo: "Cliente ti chiede di chiamarlo",       emoji: "📞", bg: "#E0F1EE", ink: "#0F5E55" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, cm_code, cliente, risposta, risposta_nota, link_titolare } = body;

    if (!email || !risposta) {
      return NextResponse.json({ error: "missing params" }, { status: 400 });
    }

    const meta = TITOLI[risposta as string] || TITOLI.accettato;
    const subject = `[MASTRO] ${meta.titolo} · ${cliente || "Cliente"} (${cm_code || ""})`;

    const html = `
<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #1A1A1A; background: #F8FAF9;">
  <div style="background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
    <div style="background: ${meta.bg}; padding: 20px 24px;">
      <div style="font-size: 32px; line-height: 1;">${meta.emoji}</div>
      <h1 style="margin: 8px 0 0; font-size: 18px; color: ${meta.ink};">${meta.titolo}</h1>
    </div>
    <div style="padding: 20px 24px;">
      <p style="margin: 0 0 14px; font-size: 14px; line-height: 1.5;">
        Il cliente <strong>${cliente || "—"}</strong> ha risposto al preventivo <strong>${cm_code || "—"}</strong>.
      </p>
      ${risposta_nota ? `
      <div style="background: #F5F5F0; padding: 12px 14px; border-radius: 8px; margin: 12px 0; font-size: 13px; color: #555; border-left: 3px solid ${meta.ink};">
        <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: ${meta.ink}; margin-bottom: 4px;">NOTA DEL CLIENTE</div>
        ${String(risposta_nota).replace(/[<>]/g, "")}
      </div>` : ""}
      ${link_titolare ? `
      <div style="margin-top: 18px;">
        <a href="${link_titolare}" style="display: inline-block; background: #28A0A0; color: white; text-decoration: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 14px;">Apri commessa in MASTRO →</a>
      </div>` : ""}
    </div>
    <div style="background: #F5F5F0; padding: 12px 24px; font-size: 11px; color: #888; text-align: center;">
      Questa email è stata inviata automaticamente da MASTRO Suite quando il tuo cliente ha risposto al preventivo.
    </div>
  </div>
</body></html>
    `.trim();

    // ── Resend ──
    if (RESEND_API_KEY) {
      try {
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [email],
            subject,
            html,
          }),
        });
        if (!r.ok) {
          const txt = await r.text();
          return NextResponse.json({ error: "resend failed", details: txt }, { status: 500 });
        }
        return NextResponse.json({ ok: true, provider: "resend" });
      } catch (e: any) {
        return NextResponse.json({ error: e?.message || "resend error" }, { status: 500 });
      }
    }

    // Nessun provider configurato → no-op
    return NextResponse.json({ ok: true, provider: "none", note: "No email provider configured (RESEND_API_KEY missing)" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
