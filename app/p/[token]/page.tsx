// app/p/[token]/page.tsx
// MASTRO v17 - Pagina pubblica preventivo INTERO (Opzione A)
// Mostra: header azienda + cliente + lista vani con tutti i dettagli
//         + totale + IVA + 3 bottoni Accetto/Modifiche/Contattami
// Le modifiche restano per vano + generali (form sotto ogni vano).
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";

type Data = {
  cm_code: string;
  snapshot: any;
  risposta: string | null;
  risposta_nota: string | null;
  risposta_at: string | null;
};

type RispostaTipo = "accettato" | "modifiche" | "chiamare";
type CanaleContatto = "telefono" | "whatsapp" | "email";

// ── BRAND TOKENS MASTRO (fliwoX) ─────────────────────────────
const T = {
  bg: "#F7FAFA",
  card: "#FFFFFF",
  bdr: "#C8E4E4",
  acc: "#28A0A0",
  accDark: "#0F5E55",
  accLight: "#E0F1EE",
  ink: "#0D1F1F",
  sub: "#5A6B6B",
  ok: "#10b981",
  warn: "#f59e0b",
  blue: "#3b82f6",
};

export default function PreventivoPubblicoPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<null | "accettato" | "modifiche" | "chiamare">(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const [modVani, setModVani] = useState<Record<number, string>>({});
  const [modGenerali, setModGenerali] = useState("");
  const [canale, setCanale] = useState<CanaleContatto | null>(null);
  const [oraPref, setOraPref] = useState("");
  const [notaContatto, setNotaContatto] = useState("");
  const [notaAccettazione, setNotaAccettazione] = useState("");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const r = await fetch(`/api/preventivo-link?token=${token}`);
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          setError(j.error || "Preventivo non trovato");
          setLoading(false);
          return;
        }
        const d = await r.json();
        setData(d);
        if (d.risposta) setDone(d.risposta);
      } catch {
        setError("Errore di connessione");
      }
      setLoading(false);
    })();
  }, [token]);

  const snap = data?.snapshot || {};
  const vani: any[] = snap.vani || [];
  const azienda = snap.azienda || {};
  const cliente_nome = snap.cliente || "Gentile cliente";
  const cliente_indirizzo = snap.cliente_indirizzo || "";
  const data_preventivo = snap.data_preventivo || "";

  const calc = useMemo(() => {
    const subtotali = vani.map((v: any) => {
      const pezzi = Number(v.pezzi) || 1;
      const prezzo = Number(v.prezzo) || 0;
      return prezzo;
    });
    const imponibile = subtotali.reduce((s, n) => s + n, 0) || (snap.totale || 0);
    const ivaPerc = Number(snap.iva_perc) || 10;
    const iva = (imponibile * ivaPerc) / 100;
    const totale = imponibile + iva;
    return { imponibile, ivaPerc, iva, totale };
  }, [vani, snap]);

  const fmtEur = (n: number) => "€ " + (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const submitRisposta = async (tipo: RispostaTipo, nota: string) => {
    setSubmitting(true);
    try {
      const r = await fetch("/api/preventivo-link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, risposta: tipo, nota }),
      });
      if (!r.ok) throw new Error("fail");
      setDone(tipo);
      setView(null);
    } catch {
      alert("Errore, riprova");
    }
    setSubmitting(false);
  };

  const handleAccetta = () => submitRisposta("accettato", notaAccettazione || "");

  const handleModifiche = () => {
    const vaniText = vani
      .map((v: any, i: number) => {
        const m = modVani[i];
        if (!m || !m.trim()) return null;
        const nomeVano = v.nome || v.tipo || `Vano ${i + 1}`;
        return `• ${nomeVano}: ${m.trim()}`;
      })
      .filter(Boolean)
      .join("\n");

    const parts: string[] = [];
    if (vaniText) parts.push("MODIFICHE PER VANO:\n" + vaniText);
    if (modGenerali.trim()) parts.push("MODIFICHE GENERALI:\n" + modGenerali.trim());

    if (parts.length === 0) {
      alert("Scrivi almeno una modifica");
      return;
    }
    submitRisposta("modifiche", parts.join("\n\n"));
  };

  const handleContatto = () => {
    if (!canale) {
      alert("Scegli come vuoi essere contattato");
      return;
    }
    const parts = [`Canale: ${canale}`];
    if (oraPref) parts.push(`Orario preferito: ${oraPref}`);
    if (notaContatto.trim()) parts.push(`Nota: ${notaContatto.trim()}`);
    submitRisposta("chiamare", parts.join("\n"));
  };

  // ─── Loading / Error ────────────────────────────────────────
  if (loading) {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={{ padding: 40, textAlign: "center", color: T.sub }}>Caricamento...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Preventivo non disponibile</div>
            <div style={{ fontSize: 14, color: T.sub }}>{error || "Link non valido o scaduto"}</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Done — risposta già inviata ────────────────────────────
  if (done) {
    const map: Record<string, { icon: string; titolo: string; sub: string; color: string }> = {
      accettato: { icon: "✓", titolo: "Preventivo accettato", sub: "Grazie! L'azienda ti contatterà a breve per i prossimi passi.", color: T.ok },
      modifiche: { icon: "✏", titolo: "Modifiche inviate", sub: "Le tue richieste sono state ricevute. L'azienda preparerà un nuovo preventivo aggiornato.", color: T.warn },
      chiamare: { icon: "📞", titolo: "Richiesta contatto inviata", sub: "Riceverai una chiamata o messaggio a breve.", color: T.blue },
    };
    const info = map[done] || map.accettato;
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 64, color: info.color, marginBottom: 16, lineHeight: 1 }}>{info.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, marginBottom: 12 }}>{info.titolo}</div>
            <div style={{ fontSize: 15, color: T.sub, lineHeight: 1.5, maxWidth: 320, margin: "0 auto" }}>{info.sub}</div>
          </div>
        </div>
      </div>
    );
  }

  // ─── VIEW: form modifiche ───────────────────────────────────
  if (view === "modifiche") {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.head}>
            <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>RICHIEDI MODIFICHE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginTop: 4 }}>Preventivo {data.cm_code}</div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 14, color: T.sub, marginBottom: 16, lineHeight: 1.5 }}>
              Indica le modifiche che vorresti per uno o più vani, oppure modifiche generali al preventivo.
            </div>

            {vani.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={S.sectionLabel}>Modifiche per singolo vano</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                  {vani.map((v: any, i: number) => {
                    const nome = v.nome || v.tipo || `Vano ${i + 1}`;
                    return (
                      <div key={i} style={S.modVanoBox}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 6 }}>
                          {nome}
                          {v.misure ? <span style={{ fontWeight: 500, color: T.sub }}> · {v.misure}</span> : null}
                          {v.prezzo ? <span style={{ fontWeight: 500, color: T.sub }}>{` · ${fmtEur(v.prezzo)}`}</span> : null}
                        </div>
                        <textarea
                          placeholder="Cosa vorresti cambiare per questo vano? (es: vetro acustico, colore diverso...)"
                          value={modVani[i] || ""}
                          onChange={(e) => setModVani((s) => ({ ...s, [i]: e.target.value }))}
                          style={S.textarea}
                          rows={2}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={S.sectionLabel}>Modifiche generali (prezzo, tempi, condizioni)</div>
            <textarea
              placeholder="Es: si può fare a settembre invece di luglio? Si può rateizzare il pagamento?"
              value={modGenerali}
              onChange={(e) => setModGenerali(e.target.value)}
              style={{ ...S.textarea, marginTop: 8 }}
              rows={3}
            />

            <button onClick={handleModifiche} disabled={submitting} style={S.btnPrimary}>
              {submitting ? "Invio..." : "INVIA RICHIESTA"}
            </button>
            <button onClick={() => setView(null)} disabled={submitting} style={S.btnSecondary}>
              Annulla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── VIEW: form contattami ──────────────────────────────────
  if (view === "chiamare") {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.head}>
            <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>RICHIEDI CONTATTO</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginTop: 4 }}>Preventivo {data.cm_code}</div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={S.sectionLabel}>Come preferisci essere contattato?</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
              {[
                { v: "telefono" as const, lbl: "Telefono", icon: "📞" },
                { v: "whatsapp" as const, lbl: "WhatsApp", icon: "💬" },
                { v: "email" as const, lbl: "Email", icon: "✉" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setCanale(opt.v)}
                  style={{
                    ...S.canaleBtn,
                    background: canale === opt.v ? T.acc : T.card,
                    color: canale === opt.v ? "#fff" : T.ink,
                    borderColor: canale === opt.v ? T.acc : T.bdr,
                  }}
                >
                  <div style={{ fontSize: 22 }}>{opt.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{opt.lbl}</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={S.sectionLabel}>Orario preferito (opzionale)</div>
              <input
                type="text"
                placeholder="Es: dopo le 18, in pausa pranzo..."
                value={oraPref}
                onChange={(e) => setOraPref(e.target.value)}
                style={S.input}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <div style={S.sectionLabel}>Nota (opzionale)</div>
              <textarea
                placeholder="Qualcosa che vuoi dire prima del contatto?"
                value={notaContatto}
                onChange={(e) => setNotaContatto(e.target.value)}
                style={S.textarea}
                rows={3}
              />
            </div>

            <button onClick={handleContatto} disabled={submitting} style={S.btnPrimary}>
              {submitting ? "Invio..." : "INVIA RICHIESTA"}
            </button>
            <button onClick={() => setView(null)} disabled={submitting} style={S.btnSecondary}>
              Annulla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── VIEW: form accettazione ────────────────────────────────
  if (view === "accettato") {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.head}>
            <div style={{ fontSize: 13, color: T.sub, fontWeight: 600 }}>CONFERMA ACCETTAZIONE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginTop: 4 }}>Preventivo {data.cm_code}</div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{
              background: T.accLight, border: `1px solid ${T.acc}33`, borderRadius: 12,
              padding: 16, textAlign: "center", marginBottom: 16,
            }}>
              <div style={{ fontSize: 12, color: T.accDark, fontWeight: 700, letterSpacing: 0.5 }}>TOTALE ACCETTATO</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.accDark, marginTop: 4 }}>{fmtEur(calc.totale)}</div>
              <div style={{ fontSize: 12, color: T.accDark, opacity: 0.7, marginTop: 2 }}>IVA inclusa</div>
            </div>

            <div style={S.sectionLabel}>Vuoi aggiungere una nota? (opzionale)</div>
            <textarea
              placeholder="Es: confermo i tempi di consegna, prepariamo l'acconto..."
              value={notaAccettazione}
              onChange={(e) => setNotaAccettazione(e.target.value)}
              style={{ ...S.textarea, marginTop: 8 }}
              rows={3}
            />

            <button onClick={handleAccetta} disabled={submitting} style={{ ...S.btnPrimary, background: T.ok }}>
              {submitting ? "Invio..." : "✓ CONFERMA ACCETTAZIONE"}
            </button>
            <button onClick={() => setView(null)} disabled={submitting} style={S.btnSecondary}>
              Annulla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── VIEW DEFAULT: preventivo intero ────────────────────────
  return (
    <div style={S.wrap}>
      <div style={S.card}>
        {/* HEADER azienda */}
        <div style={S.headerAzienda}>
          {azienda.logo && (
            <img src={azienda.logo} alt="" style={{ maxHeight: 56, marginBottom: 10 }} />
          )}
          <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, letterSpacing: 0.3 }}>
            {azienda.ragione || "Azienda"}
          </div>
          {azienda.indirizzo && <div style={{ fontSize: 12, color: T.sub, marginTop: 3 }}>{azienda.indirizzo}</div>}
          {(azienda.telefono || azienda.email) && (
            <div style={{ fontSize: 12, color: T.sub, marginTop: 3 }}>
              {azienda.telefono ? <>Tel. {azienda.telefono}</> : null}
              {azienda.telefono && azienda.email ? " · " : ""}
              {azienda.email}
            </div>
          )}
          {azienda.piva && <div style={{ fontSize: 11, color: T.sub, marginTop: 3, opacity: 0.7 }}>P.IVA {azienda.piva}</div>}
        </div>

        {/* BANDA TITOLO */}
        <div style={S.bandTitolo}>
          <div style={{ fontSize: 11, color: T.acc, fontWeight: 700, letterSpacing: 1.5 }}>PREVENTIVO</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>N. {data.cm_code}</div>
            {data_preventivo && <div style={{ fontSize: 12, color: T.sub }}>{data_preventivo}</div>}
          </div>
        </div>

        {/* CLIENTE */}
        <div style={S.boxCliente}>
          <div style={{ fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: 0.5 }}>SPETT.LE</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginTop: 4 }}>{cliente_nome}</div>
          {cliente_indirizzo && <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>{cliente_indirizzo}</div>}
        </div>

        {/* DETTAGLIO LAVORI */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={S.sectionTitle}>📋 Dettaglio lavori</div>
        </div>

        {vani.length === 0 ? (
          <div style={{ padding: 20, color: T.sub, fontStyle: "italic", textAlign: "center" }}>
            Nessun vano nel preventivo
          </div>
        ) : (
          <div style={{ padding: "8px 20px 20px" }}>
            {vani.map((v: any, i: number) => {
              const nome = v.nome || v.tipo || `Vano ${i + 1}`;
              const pezzi = Number(v.pezzi) || 1;
              const subtotale = Number(v.prezzo) || 0;
              const prezzoUnit = pezzi > 1 ? subtotale / pezzi : subtotale;
              const righe: { label: string; valore: string }[] = Array.isArray(v.righe) ? v.righe : [];

              return (
                <div key={i} style={S.vanoCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: T.acc, fontWeight: 700, letterSpacing: 0.5 }}>VANO {i + 1}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, marginTop: 2 }}>
                        {nome}
                        {v.tipo && nome !== v.tipo && <span style={{ fontWeight: 500, color: T.sub, fontSize: 13 }}> · {v.tipo}</span>}
                      </div>
                      {v.misure && <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>Misure: {v.misure} mm</div>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{fmtEur(subtotale)}</div>
                      {pezzi > 1 && (
                        <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
                          {pezzi} × {fmtEur(prezzoUnit)}
                        </div>
                      )}
                    </div>
                  </div>

                  {righe.length > 0 && (
                    <div style={S.righeBox}>
                      {righe.map((r, j) => (
                        <div key={j} style={S.rigaRow}>
                          <span style={S.rigaLabel}>{r.label}</span>
                          <span style={S.rigaValore}>{r.valore}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TOTALE */}
        <div style={S.totBox}>
          <div style={S.totRiga}>
            <span style={{ fontSize: 13, color: T.sub }}>Imponibile</span>
            <span style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>{fmtEur(calc.imponibile)}</span>
          </div>
          <div style={S.totRiga}>
            <span style={{ fontSize: 13, color: T.sub }}>IVA {calc.ivaPerc}%</span>
            <span style={{ fontSize: 14, color: T.ink, fontWeight: 600 }}>{fmtEur(calc.iva)}</span>
          </div>
          <div style={{ height: 1, background: T.bdr, margin: "8px 0" }} />
          <div style={S.totRiga}>
            <span style={{ fontSize: 14, color: T.ink, fontWeight: 800 }}>TOTALE</span>
            <span style={{ fontSize: 22, color: T.acc, fontWeight: 800 }}>{fmtEur(calc.totale)}</span>
          </div>
        </div>

        {/* CTA bottoni */}
        <div style={{ padding: "16px 20px 24px", borderTop: `1px solid ${T.bdr}` }}>
          <div style={{ fontSize: 13, color: T.sub, textAlign: "center", marginBottom: 14, fontWeight: 600 }}>
            Cosa vuoi fare?
          </div>
          <button onClick={() => setView("accettato")} style={{ ...S.ctaBtn, background: T.ok }}>
            ✓ Accetta preventivo
          </button>
          <button onClick={() => setView("modifiche")} style={{ ...S.ctaBtn, background: T.warn }}>
            ✏ Richiedi modifiche
          </button>
          <button onClick={() => setView("chiamare")} style={{ ...S.ctaBtn, background: T.blue }}>
            📞 Contattami
          </button>
        </div>

        {/* footer brand */}
        <div style={S.footer}>
          Generato con MASTRO · ERP per serramentisti
        </div>
      </div>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh", background: T.bg,
    padding: "16px",
    display: "flex", justifyContent: "center", alignItems: "flex-start",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxSizing: "border-box",
  },
  card: {
    width: "100%", maxWidth: 520, background: T.card, borderRadius: 16,
    overflow: "hidden", boxShadow: "0 10px 40px rgba(13,31,31,0.08)",
  },
  headerAzienda: {
    padding: "24px 20px 16px",
    background: `linear-gradient(180deg, ${T.accLight} 0%, ${T.card} 100%)`,
    borderBottom: `1px solid ${T.bdr}`,
    textAlign: "center" as const,
  },
  bandTitolo: {
    padding: "16px 20px",
    background: T.card,
  },
  boxCliente: {
    margin: "0 20px",
    padding: "12px 14px",
    background: T.accLight,
    borderRadius: 10,
    border: `1px solid ${T.bdr}`,
  },
  head: {
    padding: "20px 20px 16px",
    borderBottom: `1px solid ${T.bdr}`,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: T.sub, letterSpacing: 1,
    paddingBottom: 8, borderBottom: `1px solid ${T.bdr}`,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: 700, color: T.sub, letterSpacing: 0.8,
    textTransform: "uppercase" as const, marginTop: 8,
  },
  vanoCard: {
    background: T.card, border: `1px solid ${T.bdr}`,
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  righeBox: {
    background: T.bg, borderRadius: 8, padding: "10px 12px",
    marginTop: 8,
  },
  rigaRow: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline",
    gap: 12, padding: "3px 0", fontSize: 12,
  },
  rigaLabel: { color: T.sub, flexShrink: 0 },
  rigaValore: { color: T.ink, fontWeight: 600, textAlign: "right" as const, wordBreak: "break-word" as const },
  totBox: {
    margin: "0 20px 0", padding: "16px 18px",
    background: T.accLight, border: `1px solid ${T.acc}33`,
    borderRadius: 12,
  },
  totRiga: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline",
    padding: "4px 0",
  },
  ctaBtn: {
    width: "100%", padding: 16, borderRadius: 12, border: "none",
    color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
    fontFamily: "inherit", marginBottom: 10,
    boxShadow: "0 4px 12px rgba(13,31,31,0.12)",
  },
  modVanoBox: {
    border: `1px solid ${T.bdr}`, borderRadius: 10, padding: 12, background: T.bg,
  },
  textarea: {
    width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`,
    background: T.card, color: T.ink, fontSize: 14, fontFamily: "inherit",
    boxSizing: "border-box" as const, resize: "vertical" as const,
  },
  input: {
    width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`,
    background: T.card, color: T.ink, fontSize: 14, fontFamily: "inherit",
    boxSizing: "border-box" as const, marginTop: 6,
  },
  canaleBtn: {
    padding: "12px 6px", borderRadius: 10, border: `2px solid ${T.bdr}`,
    cursor: "pointer", fontFamily: "inherit",
    display: "flex", flexDirection: "column" as const, alignItems: "center",
    transition: "all 0.15s",
  },
  btnPrimary: {
    width: "100%", padding: 14, borderRadius: 10, border: "none",
    background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800,
    cursor: "pointer", marginTop: 16, fontFamily: "inherit",
  },
  btnSecondary: {
    width: "100%", padding: 12, borderRadius: 10, border: `1px solid ${T.bdr}`,
    background: T.card, color: T.sub, fontSize: 13, fontWeight: 600,
    cursor: "pointer", marginTop: 8, fontFamily: "inherit",
  },
  footer: {
    padding: "12px 20px 18px",
    fontSize: 10, color: T.sub, textAlign: "center" as const,
    opacity: 0.6, letterSpacing: 0.5,
  },
};
