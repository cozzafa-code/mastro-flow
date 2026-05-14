"use client";
import React, { useRef } from "react";
import { useSdi, STATI_SDI_LABEL, STATI_SDI_COLOR } from "../../../hooks/useSdi";
import { useOcr } from "../../../hooks/useOcr";

const NAVY = "#1B3A5C";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const MUTED = "#5C6B7A";
const RED = "#C73E1D";
const GREEN = "#0F6E56";
const AMBER = "#E8B05C";
const BG_SOFT = "#F7F9FB";
const BORDER = "#E5EAF0";

interface Props { aziendaId: string; }

export default function VistaSdiOcr({ aziendaId }: Props) {
  const sdi = useSdi(aziendaId);
  const ocr = useOcr(aziendaId);
  const fileRef = useRef<HTMLInputElement>(null);

  if (sdi.loading || ocr.loading) {
    return <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 13 }}>Carico SDI/OCR…</div>;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await ocr.caricaFile(file);
    if (!res.ok) alert(`Errore upload: ${res.error}`);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div style={{ padding: 12 }}>

      {/* SDI STATUS */}
      <Sez tit="Sistema di Interscambio (SDI)" right={
        <span style={{
          fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 99,
          background: sdi.config?.provider && sdi.config.provider !== "none" ? GREEN : AMBER,
          color: "#fff",
        }}>
          {sdi.config?.provider && sdi.config.provider !== "none"
            ? `${sdi.config.provider.toUpperCase()} · ${sdi.config.ambiente}`
            : "NON CONFIGURATO"}
        </span>
      }>
        {(!sdi.config || sdi.config.provider === "none") ? (
          <div style={{
            background: "#FBF0DC", color: "#8B6926", padding: "11px 13px",
            borderRadius: 8, fontSize: 11.5, fontWeight: 600, lineHeight: 1.5,
            borderLeft: `3px solid ${AMBER}`,
          }}>
            <b>Provider SDI non configurato.</b><br />
            Le fatture vengono generate in XML conforme FatturaPA 1.2, ma serve un provider esterno per l'invio reale (Aruba, InfoCert, Fatture in Cloud).<br />
            <small style={{ display: "block", marginTop: 6 }}>
              Per ora: scarica l'XML e caricalo manualmente sul portale Agenzia Entrate.
            </small>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
            <KpiBox lbl="Inviate" val={sdi.stats.totali.toString()} c={NAVY} />
            <KpiBox lbl="Consegnate" val={sdi.stats.consegnate.toString()} c={GREEN} />
            <KpiBox lbl="Scartate" val={sdi.stats.scartate.toString()} c={RED} />
            <KpiBox lbl="In attesa" val={sdi.stats.in_attesa.toString()} c={AMBER} />
          </div>
        )}
      </Sez>

      {/* INVII RECENTI */}
      <Sez tit="Ultimi invii SDI" right={<span style={{ fontSize: 9.5, color: MUTED, fontWeight: 700 }}>{sdi.invii.length}</span>}>
        {sdi.invii.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 11.5, fontStyle: "italic" }}>
            Nessun invio. Crea una fattura e premi "Salva e invia SDI".
          </div>
        ) : (
          sdi.invii.slice(0, 8).map((inv, i) => (
            <div key={inv.id} style={{
              padding: "9px 0", borderBottom: i < 7 && i < sdi.invii.length - 1 ? `1px solid ${BORDER}` : "none",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY }}>
                  {inv.identificativo_sdi || `Invio #${inv.id.slice(0, 8)}`}
                </div>
                <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>
                  {new Date(inv.data_invio).toLocaleString("it-IT")} · {inv.provider}
                  {inv.motivo_scarto && <div style={{ color: RED, marginTop: 2 }}>⚠ {inv.motivo_scarto}</div>}
                </div>
              </div>
              <span style={{
                fontSize: 9.5, fontWeight: 800, padding: "3px 8px", borderRadius: 99,
                background: STATI_SDI_COLOR[inv.stato] || MUTED, color: "#fff",
                letterSpacing: 0.3, textTransform: "uppercase",
              }}>{STATI_SDI_LABEL[inv.stato] || inv.stato}</span>
            </div>
          ))
        )}
      </Sez>

      {/* OCR UPLOAD */}
      <Sez tit="OCR scontrini e fatture" right={
        <button onClick={() => fileRef.current?.click()} disabled={ocr.uploading} style={{
          padding: "5px 11px", borderRadius: 6, background: TEAL, color: "#fff",
          fontSize: 9.5, fontWeight: 800, border: "none", cursor: ocr.uploading ? "not-allowed" : "pointer",
          letterSpacing: 0.3, fontFamily: "inherit", opacity: ocr.uploading ? 0.5 : 1,
        }}>{ocr.uploading ? "..." : "+ CARICA"}</button>
      }>
        <input
          ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleUpload}
          style={{ display: "none" }} capture="environment"
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5, marginBottom: 9 }}>
          <KpiBox lbl="Totali" val={ocr.stats.totali.toString()} c={NAVY} />
          <KpiBox lbl="In coda" val={(ocr.stats.in_coda + ocr.stats.elaborazione).toString()} c={AMBER} />
          <KpiBox lbl="Completati" val={ocr.stats.completati.toString()} c={GREEN} />
          <KpiBox lbl="Errori" val={ocr.stats.errori.toString()} c={RED} />
        </div>

        {ocr.documenti.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 11.5, fontStyle: "italic" }}>
            Nessun documento. Tocca + CARICA per scattare/scegliere scontrino o fattura.
          </div>
        ) : (
          ocr.documenti.slice(0, 10).map((d) => (
            <div key={d.id} style={{
              padding: "10px 0", borderBottom: `1px solid ${BORDER}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
                    {d.fornitore_nome || (d.stato === "elaborazione" ? "Riconoscimento in corso..." : "Documento")}
                  </div>
                  <div style={{ fontSize: 9.5, color: MUTED, marginTop: 2 }}>
                    {d.data_documento && new Date(d.data_documento).toLocaleDateString("it-IT")}
                    {d.numero_documento && ` · ${d.numero_documento}`}
                    {d.categoria_suggerita && ` · ${d.categoria_suggerita}`}
                    {d.ocr_confidence && ` · conf. ${d.ocr_confidence}%`}
                  </div>
                  {d.errore && <div style={{ fontSize: 10, color: RED, marginTop: 3 }}>⚠ {d.errore}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {d.totale && (
                    <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>
                      €{Number(d.totale).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                    </div>
                  )}
                  <StatoBadge stato={d.stato} />
                </div>
              </div>

              {/* Azioni */}
              {d.stato === "completato" && !d.fattura_ricevuta_id && !d.spesa_id && (
                <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                  <button onClick={() => ocr.confermaCreaFatturaRicevuta(d.id)} style={btnSm(GREEN)}>+ Fattura</button>
                  <button onClick={() => ocr.confermaCreaSpesa(d.id)} style={btnSm(TEAL)}>+ Spesa</button>
                  <button onClick={() => ocr.rielabora(d.id)} style={btnSm(AMBER)}>Rielabora</button>
                  <button onClick={() => ocr.elimina(d.id)} style={btnSm(RED)}>×</button>
                </div>
              )}
              {d.stato === "errore" && (
                <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                  <button onClick={() => ocr.rielabora(d.id)} style={btnSm(AMBER)}>Riprova</button>
                  <button onClick={() => ocr.elimina(d.id)} style={btnSm(RED)}>×</button>
                </div>
              )}
            </div>
          ))
        )}
      </Sez>
    </div>
  );
}

function Sez({ tit, right, children }: any) {
  return (
    <div style={{ background: "#fff", borderRadius: 13, padding: "11px 12px", marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{tit}</span>{right}
      </div>
      {children}
    </div>
  );
}

function KpiBox({ lbl, val, c }: { lbl: string; val: string; c: string }) {
  return (
    <div style={{ background: BG_SOFT, padding: "7px 6px", borderRadius: 7, textAlign: "center", borderTop: `2px solid ${c}` }}>
      <div style={{ fontSize: 8.5, color: MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>{lbl}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: c, marginTop: 2 }}>{val}</div>
    </div>
  );
}

function StatoBadge({ stato }: { stato: string }) {
  const m: Record<string, { l: string; c: string }> = {
    in_coda:      { l: "in coda", c: MUTED },
    elaborazione: { l: "ocr...", c: AMBER },
    completato:   { l: "ok", c: GREEN },
    errore:       { l: "errore", c: RED },
    manuale:      { l: "manuale", c: TEAL },
  };
  const x = m[stato] || { l: stato, c: MUTED };
  return (
    <div style={{
      display: "inline-block", fontSize: 8.5, fontWeight: 800, padding: "2px 7px", borderRadius: 99,
      background: x.c, color: "#fff", letterSpacing: 0.3, textTransform: "uppercase", marginTop: 3,
    }}>{x.l}</div>
  );
}

function btnSm(c: string): React.CSSProperties {
  return {
    padding: "4px 9px", borderRadius: 5, background: c, color: "#fff",
    fontSize: 9.5, fontWeight: 800, border: "none", cursor: "pointer",
    letterSpacing: 0.3, fontFamily: "inherit",
  };
}
