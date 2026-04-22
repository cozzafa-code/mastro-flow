// app/p/[token]/page.tsx
// Pagina pubblica preventivo - il cliente risponde con 1 click
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Data = {
  cm_code: string;
  snapshot: any;
  risposta: string | null;
  risposta_nota: string | null;
  risposta_at: string | null;
};

export default function PreventivoPubblicoPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalType, setModalType] = useState<null | "accettato" | "modifiche" | "chiamare">(null);
  const [nota, setNota] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

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

  const submitRisposta = async () => {
    if (!modalType) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/preventivo-link", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, risposta: modalType, nota }),
      });
      if (!r.ok) throw new Error("fail");
      setDone(modalType);
      setModalType(null);
    } catch {
      alert("Errore, riprova");
    }
    setSubmitting(false);
  };

  if (loading) return <div style={S.wrap}><div style={S.card}>Caricamento...</div></div>;
  if (error) return <div style={S.wrap}><div style={S.card}>{error}</div></div>;
  if (!data) return null;

  const snap = data.snapshot || {};
  const vani = snap.vani || [];
  const totale = snap.totale || 0;
  const azienda = snap.azienda || {};
  const cliente = snap.cliente || "";

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.header}>
          <div style={S.brand}>MASTRO</div>
          <div style={S.subBrand}>{azienda.ragione || azienda.nome || "La tua azienda"}</div>
        </div>

        <div style={S.body}>
          <div style={S.titolo}>Preventivo {data.cm_code}</div>
          <div style={S.subTitolo}>Gentile {cliente},<br/>ecco il preventivo che hai richiesto.</div>

          <div style={S.totCard}>
            <div style={S.totLabel}>Totale preventivo</div>
            <div style={S.totValore}>€ {Number(totale).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={S.totSub}>{vani.length} {vani.length === 1 ? "serramento" : "serramenti"}</div>
          </div>

          {vani.length > 0 && (
            <div style={S.vaniList}>
              {vani.map((v: any, i: number) => (
                <div key={i} style={S.vanoRow}>
                  <span>{v.nome || v.tipo || `Vano ${i+1}`} {v.misure ? `· ${v.misure}` : ""}</span>
                  <span style={S.vanoPrezzo}>€ {Number(v.prezzo || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          )}

          {done ? (
            <div style={S.doneBox}>
              {done === "accettato" && <><div style={S.doneIcon}>✓</div><div style={S.doneTxt}>Grazie, hai accettato il preventivo!<br/>Ti contatteremo presto per i prossimi passi.</div></>}
              {done === "modifiche" && <><div style={S.doneIcon}>↻</div><div style={S.doneTxt}>Abbiamo ricevuto la richiesta di modifica.<br/>Ti ricontatteremo al più presto.</div></>}
              {done === "chiamare" && <><div style={S.doneIcon}>📞</div><div style={S.doneTxt}>Ti richiameremo il prima possibile!</div></>}
            </div>
          ) : (
            <>
              <div style={S.sectionLabel}>La tua risposta</div>
              <button style={{ ...S.btn, ...S.btnOk }} onClick={() => setModalType("accettato")}>
                ✓ Accetto il preventivo
              </button>
              <button style={{ ...S.btn, ...S.btnMod }} onClick={() => setModalType("modifiche")}>
                ↻ Chiedo modifiche
              </button>
              <button style={{ ...S.btn, ...S.btnCall }} onClick={() => setModalType("chiamare")}>
                📞 Chiamami
              </button>
            </>
          )}

          {azienda.telefono && (
            <div style={S.contatti}>
              Per qualsiasi domanda: <a href={`tel:${azienda.telefono}`}>{azienda.telefono}</a>
            </div>
          )}
        </div>
      </div>

      {modalType && (
        <div style={S.modalOv} onClick={() => !submitting && setModalType(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTit}>
              {modalType === "accettato" && "Accetti il preventivo?"}
              {modalType === "modifiche" && "Cosa vorresti modificare?"}
              {modalType === "chiamare" && "Vuoi essere ricontattato?"}
            </div>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder={
                modalType === "modifiche" ? "Descrivi cosa vorresti modificare..." :
                modalType === "chiamare" ? "Orario preferito (opzionale)..." :
                "Eventuali note (opzionale)..."
              }
              style={S.textarea}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={() => setModalType(null)} style={{ ...S.modalBtn, ...S.modalBtnCancel }} disabled={submitting}>
                Annulla
              </button>
              <button onClick={submitRisposta} style={{ ...S.modalBtn, ...S.modalBtnOk }} disabled={submitting}>
                {submitting ? "Invio..." : "Conferma"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const S: any = {
  wrap: { minHeight: "100vh", background: "#F7FAFA", padding: 16, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  card: { width: "100%", maxWidth: 480, background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(13,31,31,0.08)" },
  header: { padding: "20px 24px", background: "#0D1F1F", color: "#fff" },
  brand: { fontSize: 20, fontWeight: 900, letterSpacing: -0.5 },
  subBrand: { fontSize: 12, opacity: 0.7, marginTop: 2 },
  body: { padding: "24px" },
  titolo: { fontSize: 22, fontWeight: 800, color: "#0D1F1F", marginBottom: 4 },
  subTitolo: { fontSize: 13, color: "#6A8484", lineHeight: 1.5, marginBottom: 20 },
  totCard: { background: "#EEF8F8", borderRadius: 12, padding: 20, textAlign: "center", marginBottom: 18, border: "1px solid #C8E4E4" },
  totLabel: { fontSize: 11, color: "#6A8484", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  totValore: { fontSize: 32, fontWeight: 900, color: "#28A0A0", margin: "4px 0", letterSpacing: -1 },
  totSub: { fontSize: 12, color: "#6A8484" },
  vaniList: { background: "#fff", border: "1px solid #E5F0F0", borderRadius: 10, padding: 10, marginBottom: 18 },
  vanoRow: { display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 4px", color: "#0D1F1F" },
  vanoPrezzo: { fontWeight: 700, color: "#28A0A0" },
  sectionLabel: { fontSize: 11, fontWeight: 800, color: "#28A0A0", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  btn: { width: "100%", padding: "16px 20px", borderRadius: 12, border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 8, textAlign: "left" as const },
  btnOk: { background: "#28A0A0", color: "#fff" },
  btnMod: { background: "#fff", color: "#F5A623", border: "1.5px solid #F5A623" },
  btnCall: { background: "#fff", color: "#3B7FE0", border: "1.5px solid #3B7FE0" },
  contatti: { textAlign: "center" as const, fontSize: 12, color: "#6A8484", marginTop: 18 },
  doneBox: { textAlign: "center" as const, padding: "30px 20px", background: "#F0FDF9", borderRadius: 12, border: "1px solid #28A0A0" },
  doneIcon: { fontSize: 48, marginBottom: 8 },
  doneTxt: { fontSize: 14, color: "#0D1F1F", fontWeight: 600, lineHeight: 1.5 },
  modalOv: { position: "fixed" as const, inset: 0, background: "rgba(13,31,31,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
  modal: { background: "#fff", borderRadius: 14, padding: 20, maxWidth: 400, width: "100%" },
  modalTit: { fontSize: 16, fontWeight: 800, color: "#0D1F1F", marginBottom: 14 },
  textarea: { width: "100%", minHeight: 80, padding: 12, borderRadius: 8, border: "1px solid #C8E4E4", fontSize: 13, fontFamily: "inherit", resize: "vertical" as const, boxSizing: "border-box" as const },
  modalBtn: { flex: 1, padding: 12, borderRadius: 10, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  modalBtnCancel: { background: "#fff", color: "#6A8484", border: "1px solid #C8E4E4" },
  modalBtnOk: { background: "#28A0A0", color: "#fff" },
};
