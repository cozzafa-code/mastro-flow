// app/p/[token]/page.tsx
// Pagina pubblica preventivo - flusso completo cliente
// v2: ACCETTO / MODIFICHE per-vano e generali / CONTATTAMI multi-canale
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

export default function PreventivoPubblicoPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<null | "accettato" | "modifiche" | "chiamare">(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  // Form state per modifiche
  const [modVani, setModVani] = useState<Record<number, string>>({});
  const [modGenerali, setModGenerali] = useState("");

  // Form state per contatto
  const [canale, setCanale] = useState<CanaleContatto | null>(null);
  const [oraPref, setOraPref] = useState("");
  const [notaContatto, setNotaContatto] = useState("");

  // Form state per accettazione
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

  // Calcolo totale dai vani (più affidabile dello snapshot.totale che a volte è 0)
  const totaleCalcolato = useMemo(() => {
    if (!data?.snapshot?.vani) return data?.snapshot?.totale || 0;
    const sumVani = data.snapshot.vani.reduce(
      (sum: number, v: any) => sum + (Number(v.prezzo) || 0),
      0
    );
    return sumVani > 0 ? sumVani : data.snapshot.totale || 0;
  }, [data]);

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

  const handleAccetta = () => {
    submitRisposta("accettato", notaAccettazione || "");
  };

  const handleModifiche = () => {
    const vaniText = data?.snapshot?.vani
      ?.map((v: any, i: number) => {
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
      alert("Scrivi almeno una modifica (su un vano specifico o generale)");
      return;
    }

    submitRisposta("modifiche", parts.join("\n\n"));
  };

  const handleContatto = () => {
    if (!canale) {
      alert("Scegli come vuoi essere contattato");
      return;
    }
    const labels: Record<CanaleContatto, string> = {
      telefono: "📞 Chiamata telefonica",
      whatsapp: "💬 Messaggio WhatsApp",
      email: "📧 Email",
    };
    const parts: string[] = [labels[canale]];
    if (oraPref.trim()) parts.push("Orario preferito: " + oraPref.trim());
    if (notaContatto.trim()) parts.push("Nota: " + notaContatto.trim());

    submitRisposta("chiamare", parts.join("\n"));
  };

  if (loading) return <div style={S.wrap}><div style={S.card}><div style={S.body}>Caricamento...</div></div></div>;
  if (error) return <div style={S.wrap}><div style={S.card}><div style={S.body}>{error}</div></div></div>;
  if (!data) return null;

  const snap = data.snapshot || {};
  const vani = snap.vani || [];
  const azienda = snap.azienda || {};
  const cliente = (snap.cliente || "").trim();

  // Stato "fatto" → schermata di conferma
  if (done) {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.header}>
            <div style={S.brand}>MASTRO</div>
            <div style={S.subBrand}>{azienda.ragione || azienda.nome || ""}</div>
          </div>
          <div style={S.body}>
            <div style={S.doneBox}>
              {done === "accettato" && (
                <>
                  <div style={S.doneIcon}>✓</div>
                  <div style={S.doneTit}>Grazie {cliente.split(" ")[0]}!</div>
                  <div style={S.doneTxt}>
                    Hai accettato il preventivo.
                    <br />
                    <strong>{azienda.ragione || "Verremo"}</strong> ti contatterà presto per la conferma d'ordine e i prossimi passi.
                  </div>
                </>
              )}
              {done === "modifiche" && (
                <>
                  <div style={S.doneIcon}>↻</div>
                  <div style={S.doneTit}>Richiesta ricevuta</div>
                  <div style={S.doneTxt}>
                    Abbiamo ricevuto la tua richiesta di modifica.
                    <br />
                    Ti invieremo un preventivo aggiornato il prima possibile.
                  </div>
                </>
              )}
              {done === "chiamare" && (
                <>
                  <div style={S.doneIcon}>📞</div>
                  <div style={S.doneTit}>Ti contatteremo presto</div>
                  <div style={S.doneTxt}>Abbiamo ricevuto la tua richiesta. A presto!</div>
                </>
              )}
            </div>
            {azienda.telefono && (
              <div style={S.contatti}>
                Per qualsiasi domanda: <a href={`tel:${azienda.telefono}`} style={S.link}>{azienda.telefono}</a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW: ACCETTAZIONE ──
  if (view === "accettato") {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.header}>
            <div style={S.brand}>MASTRO</div>
            <div style={S.subBrand}>{azienda.ragione || azienda.nome || ""}</div>
          </div>
          <div style={S.body}>
            <button onClick={() => setView(null)} style={S.btnBack}>← Torna al preventivo</button>
            <div style={S.titolo}>Conferma accettazione</div>
            <div style={S.subTitolo}>
              Stai per accettare il preventivo <strong>{data.cm_code}</strong> per <strong>€ {totaleCalcolato.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
            </div>

            <div style={S.totCard}>
              <div style={S.totLabel}>Importo</div>
              <div style={S.totValore}>€ {totaleCalcolato.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div style={S.totSub}>{vani.length} {vani.length === 1 ? "serramento" : "serramenti"}</div>
            </div>

            <label style={S.label}>Vuoi aggiungere una nota? (opzionale)</label>
            <textarea
              value={notaAccettazione}
              onChange={(e) => setNotaAccettazione(e.target.value)}
              placeholder="Es. preferenze posa, tempistica, ecc."
              style={S.textarea}
            />

            <button
              onClick={handleAccetta}
              disabled={submitting}
              style={{ ...S.btn, ...S.btnOk, marginTop: 16, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Invio..." : "✓ Confermo l'accettazione"}
            </button>

            <button
              onClick={() => setView(null)}
              disabled={submitting}
              style={{ ...S.btn, ...S.btnCancel, marginTop: 8 }}
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW: MODIFICHE ──
  if (view === "modifiche") {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.header}>
            <div style={S.brand}>MASTRO</div>
            <div style={S.subBrand}>{azienda.ragione || azienda.nome || ""}</div>
          </div>
          <div style={S.body}>
            <button onClick={() => setView(null)} style={S.btnBack}>← Torna al preventivo</button>
            <div style={S.titolo}>Richiesta modifiche</div>
            <div style={S.subTitolo}>
              Indica le modifiche che vorresti per uno o più vani, oppure modifiche generali al preventivo.
            </div>

            {vani.length > 0 && (
              <>
                <div style={S.sectionLabel}>Modifiche per singolo vano</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
                  {vani.map((v: any, i: number) => {
                    const nomeVano = v.nome || v.tipo || `Vano ${i + 1}`;
                    return (
                      <div key={i} style={S.vanoModRow}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                          <div style={S.vanoModNome}>{nomeVano}</div>
                          <div style={S.vanoModInfo}>
                            {v.misure ? `${v.misure} mm` : ""}
                            {v.prezzo ? ` · € ${Number(v.prezzo).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                          </div>
                        </div>
                        <textarea
                          value={modVani[i] || ""}
                          onChange={(e) => setModVani((m) => ({ ...m, [i]: e.target.value }))}
                          placeholder={`Es. cambiare colore, aggiungere zanzariera, ridurre dimensione...`}
                          style={{ ...S.textarea, minHeight: 56 }}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={S.sectionLabel}>Modifiche generali (prezzo, tempi, condizioni)</div>
            <textarea
              value={modGenerali}
              onChange={(e) => setModGenerali(e.target.value)}
              placeholder="Es. vorrei uno sconto, posso pagare a rate, posa anticipata..."
              style={S.textarea}
            />

            <button
              onClick={handleModifiche}
              disabled={submitting}
              style={{ ...S.btn, ...S.btnMod, marginTop: 16, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Invio..." : "Invia richiesta modifiche"}
            </button>

            <button
              onClick={() => setView(null)}
              disabled={submitting}
              style={{ ...S.btn, ...S.btnCancel, marginTop: 8 }}
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW: CONTATTAMI ──
  if (view === "chiamare") {
    return (
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.header}>
            <div style={S.brand}>MASTRO</div>
            <div style={S.subBrand}>{azienda.ragione || azienda.nome || ""}</div>
          </div>
          <div style={S.body}>
            <button onClick={() => setView(null)} style={S.btnBack}>← Torna al preventivo</button>
            <div style={S.titolo}>Come preferisci essere contattato?</div>
            <div style={S.subTitolo}>Ti ricontatteremo nel modo che preferisci.</div>

            <div style={S.sectionLabel}>Canale preferito</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
              <button
                onClick={() => setCanale("telefono")}
                style={{ ...S.canaleBtn, ...(canale === "telefono" ? S.canaleSel : {}) }}
              >
                <span style={S.canaleIcon}>📞</span>
                <div>
                  <div style={S.canaleTit}>Chiamata telefonica</div>
                  <div style={S.canaleSub}>Ti chiamiamo nel tuo orario preferito</div>
                </div>
              </button>
              <button
                onClick={() => setCanale("whatsapp")}
                style={{ ...S.canaleBtn, ...(canale === "whatsapp" ? S.canaleSel : {}) }}
              >
                <span style={S.canaleIcon}>💬</span>
                <div>
                  <div style={S.canaleTit}>Messaggio WhatsApp</div>
                  <div style={S.canaleSub}>Ti scriviamo su WhatsApp</div>
                </div>
              </button>
              <button
                onClick={() => setCanale("email")}
                style={{ ...S.canaleBtn, ...(canale === "email" ? S.canaleSel : {}) }}
              >
                <span style={S.canaleIcon}>📧</span>
                <div>
                  <div style={S.canaleTit}>Email</div>
                  <div style={S.canaleSub}>Ti rispondiamo via email</div>
                </div>
              </button>
            </div>

            <label style={S.label}>Quando preferisci essere contattato? (opzionale)</label>
            <input
              type="text"
              value={oraPref}
              onChange={(e) => setOraPref(e.target.value)}
              placeholder="Es. lun-ven 18-20, sabato mattina..."
              style={S.input}
            />

            <label style={{ ...S.label, marginTop: 12 }}>Argomento o domande (opzionale)</label>
            <textarea
              value={notaContatto}
              onChange={(e) => setNotaContatto(e.target.value)}
              placeholder="Es. vorrei spiegazioni sui materiali, parlare delle tempistiche..."
              style={S.textarea}
            />

            <button
              onClick={handleContatto}
              disabled={submitting || !canale}
              style={{ ...S.btn, ...S.btnCall, marginTop: 16, opacity: submitting || !canale ? 0.5 : 1 }}
            >
              {submitting ? "Invio..." : "Conferma richiesta di contatto"}
            </button>

            <button
              onClick={() => setView(null)}
              disabled={submitting}
              style={{ ...S.btn, ...S.btnCancel, marginTop: 8 }}
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW DEFAULT: PREVENTIVO ──
  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.header}>
          <div style={S.brand}>MASTRO</div>
          <div style={S.subBrand}>{azienda.ragione || azienda.nome || "La tua azienda"}</div>
        </div>

        <div style={S.body}>
          <div style={S.titolo}>Preventivo {data.cm_code}</div>
          <div style={S.subTitolo}>
            Gentile {cliente},
            <br />
            ecco il preventivo che hai richiesto.
          </div>

          <div style={S.totCard}>
            <div style={S.totLabel}>Totale preventivo</div>
            <div style={S.totValore}>€ {totaleCalcolato.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={S.totSub}>{vani.length} {vani.length === 1 ? "serramento" : "serramenti"}</div>
          </div>

          {vani.length > 0 && (
            <div style={S.vaniList}>
              {vani.map((v: any, i: number) => {
                const nomeVano = v.nome || v.tipo || `Vano ${i + 1}`;
                return (
                  <div key={i} style={S.vanoRow}>
                    <span style={S.vanoNome}>
                      {nomeVano}
                      {v.misure ? <span style={S.vanoMisure}> · {v.misure}</span> : null}
                    </span>
                    <span style={S.vanoPrezzo}>
                      € {Number(v.prezzo || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={S.sectionLabel}>Cosa vuoi fare?</div>

          <button onClick={() => setView("accettato")} style={{ ...S.btn, ...S.btnOk }}>
            <span style={S.btnIcon}>✓</span>
            <div style={S.btnContent}>
              <div style={S.btnTit}>Accetto il preventivo</div>
              <div style={S.btnSub}>Procedi alla conferma d'ordine</div>
            </div>
          </button>

          <button onClick={() => setView("modifiche")} style={{ ...S.btn, ...S.btnMod }}>
            <span style={S.btnIcon}>↻</span>
            <div style={S.btnContent}>
              <div style={S.btnTit}>Chiedo modifiche</div>
              <div style={S.btnSub}>Modifiche per singoli vani o generali</div>
            </div>
          </button>

          <button onClick={() => setView("chiamare")} style={{ ...S.btn, ...S.btnCall }}>
            <span style={S.btnIcon}>📞</span>
            <div style={S.btnContent}>
              <div style={S.btnTit}>Contattami</div>
              <div style={S.btnSub}>Chiamata, WhatsApp o email</div>
            </div>
          </button>

          {azienda.telefono && (
            <div style={S.contatti}>
              Per qualsiasi domanda: <a href={`tel:${azienda.telefono}`} style={S.link}>{azienda.telefono}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ───
const S: any = {
  wrap: {
    minHeight: "100vh",
    background: "#F7FAFA",
    padding: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 10px 40px rgba(13,31,31,0.08)",
  },
  header: { padding: "20px 24px", background: "#0D1F1F", color: "#fff" },
  brand: { fontSize: 20, fontWeight: 900, letterSpacing: -0.5 },
  subBrand: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  body: { padding: "24px" },

  btnBack: {
    background: "transparent",
    color: "#28A0A0",
    border: "none",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    padding: "0 0 12px 0",
    marginLeft: -2,
  },

  titolo: { fontSize: 22, fontWeight: 800, color: "#0D1F1F", marginBottom: 4 },
  subTitolo: { fontSize: 13, color: "#6A8484", lineHeight: 1.5, marginBottom: 20 },

  totCard: {
    background: "#EEF8F8",
    borderRadius: 12,
    padding: 20,
    textAlign: "center",
    marginBottom: 18,
    border: "1px solid #C8E4E4",
  },
  totLabel: { fontSize: 11, color: "#6A8484", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  totValore: { fontSize: 32, fontWeight: 900, color: "#28A0A0", margin: "4px 0", letterSpacing: -1 },
  totSub: { fontSize: 12, color: "#6A8484" },

  vaniList: {
    background: "#fff",
    border: "1px solid #E5F0F0",
    borderRadius: 10,
    padding: 6,
    marginBottom: 18,
  },
  vanoRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    padding: "10px 12px",
    color: "#0D1F1F",
    alignItems: "center",
    gap: 8,
  },
  vanoNome: { flex: 1, minWidth: 0 },
  vanoMisure: { color: "#6A8484", fontSize: 12 },
  vanoPrezzo: { fontWeight: 700, color: "#28A0A0", whiteSpace: "nowrap" },

  vanoModRow: {
    background: "#F7FAFA",
    borderRadius: 10,
    padding: 12,
    border: "1px solid #E5F0F0",
  },
  vanoModNome: { fontSize: 14, fontWeight: 700, color: "#0D1F1F" },
  vanoModInfo: { fontSize: 11, color: "#6A8484" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "#28A0A0",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },

  btn: {
    width: "100%",
    padding: "16px 18px",
    borderRadius: 12,
    border: "none",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    marginBottom: 8,
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxSizing: "border-box",
  },
  btnIcon: { fontSize: 22, flexShrink: 0, lineHeight: 1 },
  btnContent: { flex: 1, minWidth: 0 },
  btnTit: { fontSize: 14, fontWeight: 800, lineHeight: 1.2 },
  btnSub: { fontSize: 11, fontWeight: 500, opacity: 0.85, marginTop: 2 },

  btnOk: { background: "#28A0A0", color: "#fff" },
  btnMod: { background: "#fff", color: "#F5A623", border: "1.5px solid #F5A623" },
  btnCall: { background: "#fff", color: "#3B7FE0", border: "1.5px solid #3B7FE0" },
  btnCancel: {
    background: "#fff",
    color: "#6A8484",
    border: "1px solid #C8E4E4",
    fontSize: 13,
    justifyContent: "center",
  },

  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "#0D1F1F",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #C8E4E4",
    fontSize: 13,
    fontFamily: "inherit",
    boxSizing: "border-box",
    color: "#0D1F1F",
  },
  textarea: {
    width: "100%",
    minHeight: 80,
    padding: 12,
    borderRadius: 8,
    border: "1px solid #C8E4E4",
    fontSize: 13,
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
    color: "#0D1F1F",
  },

  canaleBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "12px 14px",
    background: "#fff",
    border: "1.5px solid #C8E4E4",
    borderRadius: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
    color: "#0D1F1F",
    boxSizing: "border-box",
  },
  canaleSel: {
    background: "#EEF8F8",
    border: "1.5px solid #28A0A0",
    boxShadow: "0 0 0 3px rgba(40,160,160,0.12)",
  },
  canaleIcon: { fontSize: 22, flexShrink: 0 },
  canaleTit: { fontSize: 14, fontWeight: 700 },
  canaleSub: { fontSize: 11, color: "#6A8484", marginTop: 2 },

  contatti: { textAlign: "center", fontSize: 12, color: "#6A8484", marginTop: 18, lineHeight: 1.6 },
  link: { color: "#28A0A0", textDecoration: "none", fontWeight: 700 },

  doneBox: { textAlign: "center", padding: "30px 20px", background: "#F0FDF9", borderRadius: 12, border: "1px solid #28A0A0" },
  doneIcon: { fontSize: 56, marginBottom: 8, lineHeight: 1 },
  doneTit: { fontSize: 18, color: "#0D1F1F", fontWeight: 800, marginBottom: 8 },
  doneTxt: { fontSize: 13, color: "#0D1F1F", lineHeight: 1.5 },
};
