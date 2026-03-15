"use client";
// @ts-nocheck
// MASTRO — Rilievo Rapido
// 4 tap: foto → misure → tipologia → conferma
import React, { useState, useRef, useCallback } from "react";
import { useMastro } from "./MastroContext";

const AMB = "#D08008", GRN = "#1A9E73", RED = "#DC4444";

const TIPOLOGIE = [
  { id:"F1A_DX", l:"1 anta →" },
  { id:"F1A_SX", l:"← 1 anta" },
  { id:"F2A",    l:"2 ante" },
  { id:"F3A",    l:"3 ante" },
  { id:"F_FISSO",l:"Fisso" },
  { id:"SOPRALUCE", l:"Sopraluce" },
  { id:"PF1_DX", l:"PF →" },
  { id:"PF2",    l:"PF 2 ante" },
  { id:"SC2",    l:"Scorrevole" },
  { id:"ALZ",    l:"Alzante" },
  { id:"PORTA",  l:"Porta" },
  { id:"VETRINA",l:"Vetrina" },
];

interface Props {
  vano: any;
  onSalva: (patch: any) => void;
  onChiudi: () => void;
  T: any;
}

export default function RilievoRapido({ vano, onSalva, onChiudi, T }: Props) {
  const [step, setStep] = useState<"misure"|"tipologia">("misure");
  const [foto, setFoto] = useState<string | null>(vano.foto || null);
  const [campo, setCampo] = useState<"L"|"H">("L");
  const [L, setL] = useState<string>(vano.misure?.lCentro > 0 ? String(vano.misure.lCentro) : "");
  const [H, setH] = useState<string>(vano.misure?.hCentro > 0 ? String(vano.misure.hCentro) : "");
  const [tipologia, setTipologia] = useState<string>(vano.tipo || "F2A");
  const [pezzi, setPezzi] = useState<number>(vano.pezzi || 1);
  const fileRef = useRef<HTMLInputElement>(null);

  const isTec = T.bg !== "#1A1A1C";
  const bg = T.bg, card = T.card, text = T.text, sub = T.sub, bdr = T.bdr, acc = T.acc;

  // Numpad
  function npTap(k: string) {
    const set = campo === "L" ? setL : setH;
    const val = campo === "L" ? L : H;
    if (k === "⌫") { set(val.slice(0, -1)); return; }
    if (k === "L") { setCampo("L"); return; }
    if (k === "H") { setCampo("H"); return; }
    if (val.length >= 5) return;
    set(val + k);
  }

  function salva() {
    onSalva({
      foto,
      tipo: tipologia,
      pezzi,
      misure: {
        ...(vano.misure || {}),
        lCentro: parseInt(L) || 0,
        hCentro: parseInt(H) || 0,
        lMuro: parseInt(L) || 0,
        hMuro: parseInt(H) || 0,
      },
    });
  }

  const lNum = parseInt(L) || 0;
  const hNum = parseInt(H) || 0;
  const pronto = lNum > 0 && hNum > 0;

  // Stili
  const npBtn = (active = false, col = "#fff") => ({
    borderRadius: 12, border: `1px solid ${bdr}`,
    background: active ? AMB : card,
    color: active ? "#fff" : text,
    fontSize: 28, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", fontFamily: "inherit",
    minHeight: 68, touchAction: "manipulation" as const,
    WebkitTapHighlightColor: "transparent",
  });

  const quickBtn = (v: string) => ({
    padding: "10px 4px", borderRadius: 10,
    border: `1px solid ${AMB}40`, background: AMB + "12",
    color: AMB, fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit", textAlign: "center" as const,
    touchAction: "manipulation" as const,
  });

  const tipBtn = (id: string) => ({
    padding: "12px 8px", borderRadius: 12,
    border: `2px solid ${tipologia === id ? AMB : bdr}`,
    background: tipologia === id ? AMB + "15" : card,
    color: tipologia === id ? AMB : sub,
    fontSize: 12, fontWeight: tipologia === id ? 700 : 500,
    cursor: "pointer", fontFamily: "inherit", textAlign: "center" as const,
    touchAction: "manipulation" as const,
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 600,
      background: bg, display: "flex", flexDirection: "column",
      fontFamily: "system-ui", overflowY: "auto",
    }}>

      {/* HEADER */}
      <div style={{
        background: "#1A1A1C", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 10,
        flexShrink: 0, position: "sticky", top: 0, zIndex: 10,
      }}>
        <button onClick={onChiudi} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{vano.nome || "Vano"}</div>
          <div style={{ color: "#888", fontSize: 11, marginTop: 1 }}>
            {step === "misure" ? "Inserisci le misure" : "Scegli la tipologia"}
          </div>
        </div>
        {pronto && (
          <button onClick={() => step === "misure" ? setStep("tipologia") : salva()} style={{
            padding: "10px 20px", borderRadius: 12, border: "none",
            background: step === "misure" ? AMB : GRN,
            color: "#fff", fontSize: 14, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {step === "misure" ? "Avanti →" : "✓ Salva"}
          </button>
        )}
      </div>

      {/* STEP INDICATOR */}
      <div style={{ display: "flex", background: "#111", flexShrink: 0 }}>
        {[["misure", "1. Misure"], ["tipologia", "2. Tipologia"]].map(([s, l]) => (
          <div key={s} onClick={() => pronto && setStep(s as any)} style={{
            flex: 1, padding: "10px", textAlign: "center",
            fontSize: 12, fontWeight: step === s ? 700 : 500,
            color: step === s ? AMB : step === "tipologia" && s === "misure" ? GRN : "#555",
            borderBottom: `2.5px solid ${step === s ? AMB : "transparent"}`,
            cursor: pronto ? "pointer" : "default",
          }}>
            {step === "tipologia" && s === "misure" ? "✓ " : ""}{l}
          </div>
        ))}
      </div>

      {/* ══ STEP 1 — MISURE ══ */}
      {step === "misure" && (
        <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* FOTO */}
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              borderRadius: 14, overflow: "hidden", border: `2px dashed ${foto ? GRN : bdr}`,
              background: foto ? "transparent" : card,
              minHeight: foto ? "auto" : 100,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
            }}
          >
            {foto ? (
              <>
                <img src={foto} style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", bottom: 8, right: 8, background: GRN, color: "#fff", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
                  ✓ Foto — tocca per cambiare
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: 20 }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: sub }}>Scatta o carica foto del vano</div>
                <div style={{ fontSize: 11, color: sub, marginTop: 4, opacity: 0.7 }}>opzionale</div>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (!f) return;
              const reader = new FileReader();
              reader.onload = ev => setFoto(ev.target?.result as string);
              reader.readAsDataURL(f);
            }}
          />

          {/* DISPLAY MISURE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { k: "L" as const, label: "LARGHEZZA", val: L, unit: "mm" },
              { k: "H" as const, label: "ALTEZZA", val: H, unit: "mm" },
            ].map(({ k, label, val }) => (
              <div key={k} onClick={() => setCampo(k)} style={{
                background: campo === k ? AMB + "12" : card,
                border: `2.5px solid ${campo === k ? AMB : bdr}`,
                borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                textAlign: "center" as const,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: campo === k ? AMB : sub, textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "monospace", color: val ? text : bdr, lineHeight: 1 }}>
                  {val || "—"}
                </div>
                <div style={{ fontSize: 11, color: sub, marginTop: 4 }}>mm</div>
              </div>
            ))}
          </div>

          {/* TASTI RAPIDI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {["600","700","800","900","1000","1100","1200","1500","2000","2100","2200","2400"].map(v => (
              <button key={v} onClick={() => campo === "L" ? setL(v) : setH(v)} style={quickBtn(v)}>
                {v}
              </button>
            ))}
          </div>

          {/* NUMPAD */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {["7","8","9","4","5","6","1","2","3"].map(k => (
              <button key={k} onPointerDown={e => { e.preventDefault(); npTap(k); }} style={npBtn()}>
                {k}
              </button>
            ))}
            <button onPointerDown={e => { e.preventDefault(); npTap("0"); }} style={npBtn()}>0</button>
            <button onPointerDown={e => { e.preventDefault(); npTap("⌫"); }} style={{ ...npBtn(), background: RED + "18", color: RED, border: `1px solid ${RED}40`, fontSize: 22 }}>⌫</button>
            <button onPointerDown={e => { e.preventDefault(); setCampo(campo === "L" ? "H" : "L"); }} style={{ ...npBtn(), background: AMB + "15", color: AMB, border: `1px solid ${AMB}40`, fontSize: 13, fontWeight: 700 }}>
              {campo === "L" ? "→ H" : "→ L"}
            </button>
          </div>

          {/* PEZZI */}
          <div style={{ background: card, borderRadius: 14, border: `1px solid ${bdr}`, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: sub, textTransform: "uppercase" as const, letterSpacing: 0.7, marginBottom: 8 }}>Numero pezzi</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setPezzi(p => Math.max(1, p - 1))} style={{ width: 48, height: 48, borderRadius: 12, border: `1px solid ${bdr}`, background: card, color: text, fontSize: 24, fontWeight: 700, cursor: "pointer" }}>−</button>
              <div style={{ flex: 1, textAlign: "center", fontSize: 32, fontWeight: 800, fontFamily: "monospace", color: text }}>{pezzi}</div>
              <button onClick={() => setPezzi(p => p + 1)} style={{ width: 48, height: 48, borderRadius: 12, border: `1px solid ${GRN}`, background: GRN + "15", color: GRN, fontSize: 24, fontWeight: 700, cursor: "pointer" }}>+</button>
            </div>
          </div>

          {/* AVANTI */}
          {pronto && (
            <button onClick={() => setStep("tipologia")} style={{
              padding: 18, borderRadius: 14, border: "none",
              background: `linear-gradient(135deg, ${AMB}, ${AMB}cc)`,
              color: "#fff", fontSize: 16, fontWeight: 800,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: `0 4px 20px ${AMB}40`,
            }}>
              {lNum} × {hNum} mm — Scegli tipologia →
            </button>
          )}
        </div>
      )}

      {/* ══ STEP 2 — TIPOLOGIA ══ */}
      {step === "tipologia" && (
        <div style={{ padding: "16px 14px" }}>

          {/* Riepilogo misure */}
          <div style={{
            background: GRN + "12", border: `1px solid ${GRN}30`,
            borderRadius: 14, padding: "12px 16px", marginBottom: 14,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div style={{ fontSize: 12, color: sub }}>Misure vano</div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "monospace", color: GRN }}>
              {lNum} × {hNum} mm
            </div>
            <button onClick={() => setStep("misure")} style={{ fontSize: 11, color: AMB, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Modifica</button>
          </div>

          {/* Griglia tipologie */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {TIPOLOGIE.map(t => (
              <button key={t.id} onClick={() => setTipologia(t.id)} style={tipBtn(t.id)}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{tipoIco(t.id)}</div>
                {t.l}
              </button>
            ))}
          </div>

          {/* SALVA */}
          <button onClick={salva} style={{
            width: "100%", padding: 18, borderRadius: 14, border: "none",
            background: `linear-gradient(135deg, ${GRN}, ${GRN}cc)`,
            color: "#fff", fontSize: 16, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: `0 4px 20px ${GRN}40`,
          }}>
            ✓ Salva vano — {lNum}×{hNum}mm {TIPOLOGIE.find(t => t.id === tipologia)?.l}
          </button>
        </div>
      )}
    </div>
  );
}

function tipoIco(id: string): string {
  const map: any = {
    F1A_DX:"▷", F1A_SX:"◁", F2A:"⊠", F3A:"⊞",
    F_FISSO:"□", SOPRALUCE:"⊟", PF1_DX:"▶", PF2:"◀▶",
    SC2:"⇄", ALZ:"⇅", PORTA:"🚪", VETRINA:"▣",
  };
  return map[id] || "□";
}
