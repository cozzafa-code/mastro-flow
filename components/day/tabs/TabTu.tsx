"use client";

import { useState, useMemo } from "react";
import { useTu } from "@/hooks/useTu";

type EditTarget = null | "profilo" | "azienda";

const PIANI = [
  { code: "BASE",  prezzo: 9,  features: ["Day + Backlog", "Lista commesse", "Catalogo base"] },
  { code: "START", prezzo: 29, features: ["Tutto BASE", "Preventivi PDF", "Workflow completo", "TROVA CLIENTI 5/mese"], best: true },
  { code: "PRO",   prezzo: 59, features: ["Tutto START", "TROVA CLIENTI 20/mese", "Stats avanzate", "MASTRO MEMORIA"] },
  { code: "TITAN", prezzo: 89, features: ["Tutto PRO", "TROVA CLIENTI 50/mese", "AI Agent autonomo", "Squad real-time"] },
];

function iniziali(nome?: string | null, cognome?: string | null, email?: string): string {
  const n = (nome ?? "").trim();
  const c = (cognome ?? "").trim();
  if (n || c) return ((n[0] ?? "") + (c[0] ?? "")).toUpperCase();
  return (email ?? "??").slice(0, 2).toUpperCase();
}

function fmtData(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

function giorniA(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  return Math.round((d.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));
}

export function TabTu() {
  const { loading, dati, preferenze, integrazioni, aggiornaProfilo, aggiornaAzienda, signOut, togglePreferenza, toggleIntegrazione, cambiaPassword, esportaGDPR, richiediCancellazione } = useTu();
  const [edit, setEdit] = useState<EditTarget>(null);
  const [showPiani, setShowPiani] = useState(false);

  const op = dati?.operatore ?? {};
  const az = dati?.azienda ?? {};
  const abb = dati?.abbonamento ?? { piano: "BASE", stato: "trial" };

  const giorniTrial = useMemo(() => giorniA(abb.trial_fine), [abb.trial_fine]);
  const giorniProssimo = useMemo(() => giorniA(abb.prossimo_addebito), [abb.prossimo_addebito]);

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      display: "flex", flexDirection: "column",
      background: "#F4F6F5",
    }}>
      {/* HEADER teal scuro */}
      <div style={{
        position: "relative",
        padding: "20px 18px 22px",
        color: "#fff",
        background: "linear-gradient(135deg, #1E8080 0%, #155555 50%, #0F4040 100%)",
        boxShadow: "0 4px 14px rgba(15,64,64,0.3)",
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 65%)",
          pointerEvents: "none",
        }}/>

        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
          {/* U1 · Iniziali grandi */}
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(145deg, #28A0A0, #1E8080)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.5,
            boxShadow: "0 6px 18px rgba(0,0,0,0.25), inset 0 -3px 0 rgba(0,0,0,0.15)",
          }}>
            {iniziali(op.nome, op.cognome, dati?.email)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* U2 · Nome + ruolo */}
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.4, textShadow: "0 2px 5px rgba(0,0,0,0.18)",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {(op.nome || op.cognome) ? `${op.nome ?? ""} ${op.cognome ?? ""}`.trim() : "Imposta il tuo profilo"}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.85, letterSpacing: 0.3, textTransform: "uppercase", marginTop: 2 }}>
              {op.ruolo ?? "Operatore"}
            </div>
            {/* U3 · Email + telefono */}
            <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.78, marginTop: 5,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {dati?.email ?? "..."}
            </div>
            {op.telefono && (
              <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.78, marginTop: 1 }}>
                {op.telefono}
              </div>
            )}
          </div>
        </div>

        {/* U4 · Modifica profilo */}
        <button type="button" onClick={() => setEdit("profilo")}
          style={{
            position: "relative",
            marginTop: 14, width: "100%", padding: "9px 12px",
            borderRadius: 11, border: 0, cursor: "pointer",
            background: "rgba(255,255,255,0.18)", color: "#fff",
            backdropFilter: "blur(12px)",
            fontSize: 11.5, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)",
            fontFamily: "inherit",
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4z"/></svg>
          Modifica profilo
        </button>
      </div>

      <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* AZIENDA · U5-U7 */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <SectionTitle ico={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"/></svg>}>
              Azienda
            </SectionTitle>
            <button type="button" onClick={() => setEdit("azienda")}
              style={{
                padding: "4px 10px", borderRadius: 7, border: 0, cursor: "pointer",
                background: "rgba(40,160,160,0.14)", color: "#1E8080",
                fontSize: 10, fontWeight: 900, letterSpacing: 0.3, textTransform: "uppercase",
                fontFamily: "inherit",
              }}>Modifica</button>
          </div>

          {/* U5 · Logo + nome */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: "linear-gradient(145deg, #C8E4E4, #8FB8B8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              fontSize: 16, fontWeight: 900, color: "#1E8080",
            }}>
              {(az.nome ?? "?").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#0F2525", letterSpacing: -0.2 }}>
                {az.nome ?? "Imposta nome azienda"}
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: "#5A7878", letterSpacing: 0.3, textTransform: "uppercase", marginTop: 1 }}>
                {az.sede ?? "—"}
              </div>
            </div>
          </div>

          {/* U6 · P.IVA + SDI */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <KV label="P.IVA" value={az.partita_iva ?? "—"} />
            <KV label="Cod. SDI" value={az.sdi ?? "—"} />
          </div>

          {/* U8 · Switch azienda */}
          <button type="button" disabled
            style={{
              marginTop: 10, width: "100%", padding: "8px 10px",
              borderRadius: 9, border: 0, cursor: "not-allowed",
              background: "rgba(244,246,245,0.6)", color: "#8FA8A8",
              fontSize: 10.5, fontWeight: 800, letterSpacing: 0.3,
              boxShadow: "inset 0 0 0 1px rgba(200,228,228,0.5)",
              fontFamily: "inherit",
            }}>
            Switch azienda · in arrivo (multi-azienda)
          </button>
        </Card>

        {/* ABBONAMENTO · U9-U12 */}
        <Card padding={0}>
          <div style={{ padding: "14px 14px 12px",
            background: "linear-gradient(135deg, rgba(127,119,221,0.10), rgba(40,160,160,0.06))",
            borderTopLeftRadius: 14, borderTopRightRadius: 14,
            borderBottom: "1px solid rgba(200,228,228,0.5)",
          }}>
            <SectionTitle ico={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M9 22l3-3 3 3M12 14v8"/></svg>}>
              Abbonamento
            </SectionTitle>

            <div style={{ marginTop: 10, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                {/* U9 · piano corrente */}
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{
                    padding: "3px 10px", borderRadius: 8,
                    background: "linear-gradient(145deg, #B5B0EE, #7F77DD)",
                    color: "#fff",
                    fontSize: 13, fontWeight: 900, letterSpacing: 0.3,
                    boxShadow: "0 3px 8px rgba(127,119,221,0.4)",
                  }}>
                    {abb.piano}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase",
                    color: abb.stato === "trial" ? "#854F0B" : "#04342C",
                    background: abb.stato === "trial" ? "rgba(239,159,39,0.14)" : "rgba(29,158,117,0.14)",
                    padding: "2px 7px", borderRadius: 5,
                  }}>{abb.stato}</span>
                </div>

                <div style={{ fontSize: 22, fontWeight: 900, color: "#0F2525", letterSpacing: -0.7, marginTop: 4, lineHeight: 1 }}>
                  €{((abb.prezzo_mensile_cents ?? 0) / 100).toFixed(2)}
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#5A7878", marginLeft: 4 }}>/mese</span>
                </div>

                {/* U10 · giorni rimanenti */}
                {abb.stato === "trial" && giorniTrial !== null && (
                  <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 800, color: giorniTrial <= 7 ? "#7F1D1D" : "#854F0B", letterSpacing: 0.2 }}>
                    {giorniTrial > 0 ? `${giorniTrial} giorni di trial rimanenti` : "Trial scaduto"}
                  </div>
                )}
                {abb.stato === "attivo" && giorniProssimo !== null && (
                  <div style={{ marginTop: 5, fontSize: 10.5, fontWeight: 700, color: "#5A7878", letterSpacing: 0.2 }}>
                    Prossimo addebito · {fmtData(abb.prossimo_addebito)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* U11 · Gestisci abbonamento */}
          <div style={{ padding: "10px 14px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
            <button type="button"
              onClick={() => alert("Stripe Customer Portal · in arrivo")}
              style={{
                width: "100%", padding: "10px 12px",
                borderRadius: 11, border: 0, cursor: "pointer",
                background: "linear-gradient(145deg, #28A0A0, #1E8080)",
                color: "#fff",
                fontSize: 12, fontWeight: 900, letterSpacing: 0.3, textTransform: "uppercase",
                boxShadow: "0 4px 12px rgba(40,160,160,0.4), inset 0 -2px 0 rgba(0,0,0,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "inherit",
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              Gestisci abbonamento
            </button>

            {/* U12 · Comparativa upgrade */}
            <button type="button" onClick={() => setShowPiani(true)}
              style={{
                width: "100%", padding: "9px 12px",
                borderRadius: 11, border: 0, cursor: "pointer",
                background: "#fff", color: "#1E8080",
                fontSize: 11, fontWeight: 900, letterSpacing: 0.3, textTransform: "uppercase",
                boxShadow: "inset 0 0 0 1px rgba(40,160,160,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                fontFamily: "inherit",
              }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              Confronta piani
            </button>
          </div>
        </Card>

        {/* NOTIFICHE · U13-U19 */}
        <NotificheBlock pref={preferenze} onToggle={togglePreferenza} />

        {/* INTEGRAZIONI · U20-U24 */}
        <IntegrazioniBlock items={integrazioni} onToggle={toggleIntegrazione} />

        {/* SICUREZZA · U25-U29 */}
        <SicurezzaBlock email={dati?.email ?? ""}
          onCambiaPassword={cambiaPassword}
          onEsportaGDPR={esportaGDPR}
          onRichiediCancellazione={richiediCancellazione}
        />

        {/* FOOTER · U30-U33 */}
        <FooterBlock onSignOut={async () => {
          if (confirm("Esci da MASTRO?")) await signOut();
        }} />

        {loading && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12, fontWeight: 700, color: "#5A7878" }}>
            Caricamento...
          </div>
        )}
      </div>

      {/* MODAL · Modifica profilo */}
      {edit === "profilo" && (
        <EditProfiloModal
          op={op} email={dati?.email ?? ""}
          onClose={() => setEdit(null)}
          onSave={async (input) => {
            const ok = await aggiornaProfilo(input);
            if (ok) setEdit(null);
            else alert("Errore aggiornamento");
          }}
        />
      )}

      {/* MODAL · Modifica azienda */}
      {edit === "azienda" && (
        <EditAziendaModal
          az={az}
          onClose={() => setEdit(null)}
          onSave={async (input) => {
            const ok = await aggiornaAzienda(input);
            if (ok) setEdit(null);
            else alert("Errore aggiornamento azienda");
          }}
        />
      )}

      {/* MODAL · Comparativa piani */}
      {showPiani && <ComparativaPianiModal currentPiano={abb.piano} onClose={() => setShowPiani(false)} />}
    </div>
  );
}


// ============== Card ==============
function Card({ children, padding = 14 }: { children: React.ReactNode; padding?: number }) {
  return (
    <div style={{
      padding,
      background: "#fff", borderRadius: 14,
      boxShadow: "0 2px 6px rgba(13,31,31,0.05)",
      border: "1px solid rgba(200,228,228,0.5)",
    }}>{children}</div>
  );
}

function SectionTitle({ ico, children }: { ico: JSX.Element; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase",
    }}>
      <span style={{ color: "#1E8080" }}>{ico}</span>
      {children}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: "7px 9px", borderRadius: 9,
      background: "rgba(244,246,245,0.7)",
      border: "1px solid rgba(200,228,228,0.4)",
    }}>
      <div style={{ fontSize: 8.5, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: "#0F2525", letterSpacing: -0.1, marginTop: 1,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {value}
      </div>
    </div>
  );
}


// ============== EditProfiloModal ==============
function EditProfiloModal({ op, email, onClose, onSave }: {
  op: { nome?: string | null; cognome?: string | null; telefono?: string | null; ruolo?: string | null };
  email: string;
  onClose: () => void;
  onSave: (input: { nome?: string; cognome?: string; telefono?: string; ruolo?: string }) => Promise<void>;
}) {
  const [nome, setNome] = useState(op.nome ?? "");
  const [cognome, setCognome] = useState(op.cognome ?? "");
  const [telefono, setTelefono] = useState(op.telefono ?? "");
  const [ruolo, setRuolo] = useState(op.ruolo ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <ModalShell onClose={onClose} title="Modifica profilo">
      <Field label="Nome">
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Cognome">
        <input type="text" value={cognome} onChange={(e) => setCognome(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Telefono">
        <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Ruolo">
        <input type="text" value={ruolo} onChange={(e) => setRuolo(e.target.value)} style={inputStyle} placeholder="Founder, CTO, Operatore..." />
      </Field>
      <Field label="Email (non modificabile)">
        <input type="email" value={email} disabled style={{...inputStyle, opacity: 0.6, cursor: "not-allowed"}} />
      </Field>
      <ModalActions onClose={onClose} saving={saving} disabled={!nome.trim() && !cognome.trim()}
        onSave={async () => { setSaving(true); await onSave({ nome, cognome, telefono, ruolo }); setSaving(false); }}/>
    </ModalShell>
  );
}


// ============== EditAziendaModal ==============
function EditAziendaModal({ az, onClose, onSave }: {
  az: { nome?: string | null; partita_iva?: string | null; sede?: string | null; sdi?: string | null };
  onClose: () => void;
  onSave: (input: { nome?: string; partita_iva?: string; sede?: string; sdi?: string }) => Promise<void>;
}) {
  const [nome, setNome] = useState(az.nome ?? "");
  const [piva, setPiva] = useState(az.partita_iva ?? "");
  const [sede, setSede] = useState(az.sede ?? "");
  const [sdi, setSdi] = useState(az.sdi ?? "");
  const [saving, setSaving] = useState(false);

  return (
    <ModalShell onClose={onClose} title="Modifica azienda">
      <Field label="Nome azienda">
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Partita IVA">
        <input type="text" value={piva} onChange={(e) => setPiva(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="Sede legale">
        <input type="text" value={sede} onChange={(e) => setSede(e.target.value)} style={inputStyle} placeholder="Via Roma 12, 87100 Cosenza" />
      </Field>
      <Field label="Codice SDI">
        <input type="text" value={sdi} onChange={(e) => setSdi(e.target.value)} style={inputStyle} placeholder="0000000" maxLength={7} />
      </Field>
      <ModalActions onClose={onClose} saving={saving}
        onSave={async () => { setSaving(true); await onSave({ nome, partita_iva: piva, sede, sdi }); setSaving(false); }}/>
    </ModalShell>
  );
}


// ============== ComparativaPianiModal ==============
function ComparativaPianiModal({ currentPiano, onClose }: { currentPiano: string; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} title="Confronta piani">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PIANI.map((p) => {
          const isCurrent = p.code === currentPiano;
          return (
            <div key={p.code} style={{
              position: "relative",
              padding: "11px 13px", borderRadius: 12,
              background: isCurrent
                ? "linear-gradient(135deg, rgba(40,160,160,0.14), rgba(40,160,160,0.05))"
                : p.best
                  ? "linear-gradient(135deg, rgba(127,119,221,0.12), rgba(127,119,221,0.04))"
                  : "#fff",
              border: isCurrent ? "2px solid #28A0A0" : p.best ? "1.5px solid #7F77DD" : "1px solid rgba(200,228,228,0.5)",
              boxShadow: "0 2px 6px rgba(13,31,31,0.05)",
            }}>
              {p.best && !isCurrent && (
                <div style={{
                  position: "absolute", top: -8, right: 12,
                  padding: "2px 7px", borderRadius: 5,
                  background: "linear-gradient(145deg, #B5B0EE, #7F77DD)",
                  color: "#fff", fontSize: 8.5, fontWeight: 900, letterSpacing: 0.6, textTransform: "uppercase",
                  boxShadow: "0 2px 6px rgba(127,119,221,0.4)",
                }}>Più scelto</div>
              )}
              {isCurrent && (
                <div style={{
                  position: "absolute", top: -8, right: 12,
                  padding: "2px 7px", borderRadius: 5,
                  background: "linear-gradient(145deg, #3ABDBD, #1E8080)",
                  color: "#fff", fontSize: 8.5, fontWeight: 900, letterSpacing: 0.6, textTransform: "uppercase",
                  boxShadow: "0 2px 6px rgba(40,160,160,0.4)",
                }}>Attuale</div>
              )}
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#0F2525", letterSpacing: -0.3 }}>
                  {p.code}
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#1E8080", letterSpacing: -0.4 }}>
                  €{p.prezzo}<span style={{ fontSize: 9, fontWeight: 700, color: "#5A7878", marginLeft: 2 }}>/mese</span>
                </div>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 3 }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10.5, fontWeight: 700, color: "#5A7878" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <button type="button" onClick={onClose}
        style={{
          marginTop: 14, width: "100%", padding: "11px",
          borderRadius: 11, border: 0, cursor: "pointer",
          background: "#fff", color: "#5A7878",
          fontSize: 12, fontWeight: 900, letterSpacing: 0.3, textTransform: "uppercase",
          boxShadow: "inset 0 0 0 1px rgba(200,228,228,0.5)",
          fontFamily: "inherit",
        }}>Chiudi</button>
    </ModalShell>
  );
}


// ============== Modal shared ==============
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  fontSize: 13, fontWeight: 600, color: "#0F2525",
  background: "#fff",
  border: "1px solid rgba(200,228,228,0.6)",
  borderRadius: 10, outline: "none",
  boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
  fontFamily: "inherit",
};

function ModalShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10006,
        background: "rgba(13,31,31,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          maxHeight: "92vh", overflowY: "auto",
          background: "#F4F6F5",
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          padding: "10px 18px 22px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.3)",
          animation: "tuModalUp 0.22s cubic-bezier(.2,.8,.2,1)",
        }}>
        <style>{`@keyframes tuModalUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
        <div style={{ margin: "0 auto 12px", height: 4, width: 40, background: "#C8E4E4", borderRadius: 99 }}/>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#0F2525", letterSpacing: -0.3 }}>{title}</div>
          <button type="button" onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 9, border: 0, cursor: "pointer",
              background: "#fff", boxShadow: "inset 0 0 0 1px rgba(200,228,228,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F2525" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 9.5, fontWeight: 900, color: "#5A7878", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function ModalActions({ onClose, onSave, saving = false, disabled = false }: { onClose: () => void; onSave: () => void; saving?: boolean; disabled?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 8, marginTop: 6 }}>
      <button type="button" onClick={onClose}
        style={{
          padding: "11px 8px", borderRadius: 11, border: 0, cursor: "pointer",
          fontSize: 12, fontWeight: 900, color: "#5A7878",
          background: "#fff",
          boxShadow: "inset 0 0 0 1px rgba(200,228,228,0.5)",
          fontFamily: "inherit",
        }}>Annulla</button>
      <button type="button" onClick={onSave} disabled={disabled || saving}
        style={{
          padding: "11px 8px", borderRadius: 11, border: 0,
          cursor: disabled || saving ? "not-allowed" : "pointer",
          fontSize: 12, fontWeight: 900, color: "#fff",
          background: disabled || saving
            ? "rgba(40,160,160,0.4)"
            : "linear-gradient(145deg, #28A0A0, #1E8080)",
          boxShadow: disabled || saving ? "none" : "0 4px 12px rgba(40,160,160,0.4), inset 0 -2px 0 rgba(0,0,0,0.08)",
          fontFamily: "inherit",
        }}>{saving ? "Salvo..." : "Salva"}</button>
    </div>
  );
}


// ============== NotificheBlock · U13-U19 ==============
const TOGGLE_DEFS: { key: keyof import("@/hooks/useTu").TuPreferenze; lbl: string; sub: string }[] = [
  { key: "notif_mail_clienti",       lbl: "Mail clienti",       sub: "Mail in arrivo finiscono nei NUOVI" },
  { key: "notif_vocali_whatsapp",    lbl: "Vocali WhatsApp",    sub: "Note vocali da WhatsApp/Messaggi" },
  { key: "notif_risposte_preventivi",lbl: "Risposte preventivi",sub: "Cliente risponde su un preventivo" },
  { key: "notif_listini_fornitori",  lbl: "Listini fornitori",  sub: "Aggiornamenti prezzi forniture" },
  { key: "notif_recensioni_google",  lbl: "Recensioni Google",  sub: "Nuove recensioni sulla scheda" },
  { key: "notif_eventi_calendario",  lbl: "Eventi calendario",  sub: "Sync da Google Calendar" },
];

function NotificheBlock({ pref, onToggle }: {
  pref: import("@/hooks/useTu").TuPreferenze | null;
  onToggle: (key: any, value: boolean | string) => Promise<void>;
}) {
  return (
    <Card padding={0}>
      <div style={{ padding: "12px 14px 8px" }}>
        <SectionTitle ico={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 01-4 0"/></svg>}>
          Notifiche · cosa entra in NUOVI
        </SectionTitle>
      </div>
      <div style={{ padding: "0 4px 8px" }}>
        {TOGGLE_DEFS.map((d, i) => (
          <ToggleRow key={d.key as string}
            lbl={d.lbl} sub={d.sub}
            value={!!(pref as any)?.[d.key]}
            onChange={(v) => onToggle(d.key, v)}
            isFirst={i === 0}
          />
        ))}
      </div>

      {/* U19 · Non disturbare */}
      <div style={{
        padding: "11px 14px",
        background: "rgba(40,160,160,0.06)",
        borderTop: "1px solid rgba(200,228,228,0.5)",
        borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{
            width: 26, height: 26, borderRadius: 8,
            background: "linear-gradient(145deg, #2E2E5C, #14143A)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1 }}>
              Non disturbare
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: "#5A7878", marginTop: 1 }}>
              Silenzia tutte le notifiche in questa fascia
            </div>
          </div>
          <Switch value={!!pref?.ndd_attivo} onChange={(v) => onToggle("ndd_attivo", v)} />
        </div>

        {pref?.ndd_attivo && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <TimeField lbl="Da" value={pref?.ndd_inizio ?? "22:00"}
              onChange={(v) => onToggle("ndd_inizio", v)} />
            <TimeField lbl="A" value={pref?.ndd_fine ?? "07:00"}
              onChange={(v) => onToggle("ndd_fine", v)} />
          </div>
        )}
      </div>
    </Card>
  );
}

function ToggleRow({ lbl, sub, value, onChange, isFirst }: {
  lbl: string; sub: string; value: boolean; onChange: (v: boolean) => void; isFirst: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 12px",
      borderTop: isFirst ? "none" : "1px solid rgba(200,228,228,0.4)",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1 }}>{lbl}</div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: "#5A7878", marginTop: 1 }}>{sub}</div>
      </div>
      <Switch value={value} onChange={onChange} />
    </div>
  );
}

function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      role="switch" aria-checked={value}
      style={{
        position: "relative",
        width: 38, height: 22, borderRadius: 99, border: 0, cursor: "pointer",
        background: value
          ? "linear-gradient(145deg, #28A0A0, #1E8080)"
          : "rgba(200,228,228,0.7)",
        boxShadow: value
          ? "inset 0 1px 3px rgba(0,0,0,0.15)"
          : "inset 0 1px 3px rgba(13,31,31,0.12)",
        transition: "background 0.2s",
        flexShrink: 0,
      }}>
      <span style={{
        position: "absolute",
        top: 2, left: value ? 18 : 2,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
        transition: "left 0.2s",
      }}/>
    </button>
  );
}

function TimeField({ lbl, value, onChange }: { lbl: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{
      padding: "5px 10px", borderRadius: 9,
      background: "#fff",
      border: "1px solid rgba(200,228,228,0.5)",
    }}>
      <div style={{ fontSize: 8.5, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase" }}>{lbl}</div>
      <input type="time" value={value.slice(0, 5)} onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: 0, marginTop: 2,
          fontSize: 13, fontWeight: 800, color: "#0F2525", letterSpacing: -0.1,
          background: "transparent", border: 0, outline: "none",
          fontFamily: "inherit",
        }}/>
    </div>
  );
}


// ============== IntegrazioniBlock · U20-U24 ==============
const INT_DEFS: { servizio: import("@/hooks/useTu").ServizioInt; lbl: string; sub: string; color: string; ico: JSX.Element }[] = [
  { servizio: "whatsapp", lbl: "WhatsApp Business", sub: "Vocali e mail clienti", color: "#25D366",
    ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11.7 11.7 0 0012 0a11.5 11.5 0 00-9.9 17.4L0 24l6.8-2A11.5 11.5 0 0012 23.5a11.5 11.5 0 008.5-20zM12 21.4a9.4 9.4 0 01-4.9-1.4l-.3-.2-3.6 1 1-3.5-.2-.4a9.6 9.6 0 1116.5-6.4 9.6 9.6 0 01-8.5 9.9z"/></svg> },
  { servizio: "gmail", lbl: "Email · Gmail/IMAP", sub: "Mail entrata e uscita", color: "#EA4335",
    ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h20v16H2zM22 6l-10 7L2 6"/></svg> },
  { servizio: "gcal", lbl: "Google Calendar", sub: "Sync eventi e scadenze", color: "#4285F4",
    ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg> },
  { servizio: "greviews", lbl: "Google Reviews", sub: "Recensioni scheda Google", color: "#FBBC05",
    ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.1 6.3L22 9.3l-5 4.9 1.2 6.9L12 17.8 5.8 21.1 7 14.2 2 9.3l6.9-1z"/></svg> },
  { servizio: "stripe", lbl: "Stripe pagamenti", sub: "Riscuoti dai tuoi clienti", color: "#635BFF",
    ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 4.5c-2 0-4 .8-4 3 0 4 7 2 7 4.5 0 .9-.8 1.3-2 1.3-1.6 0-4-.7-5.5-1.5v3.4c1.5.7 3.6 1 5.5 1 2.4 0 4.5-.8 4.5-3.2 0-4.4-7-2.5-7-4.6 0-.7.7-1 1.7-1 1.4 0 3.3.5 4.7 1.2V4.7C17.5 4.5 15.5 4 13.5 4z"/></svg> },
];

function IntegrazioniBlock({ items, onToggle }: {
  items: import("@/hooks/useTu").TuIntegrazione[];
  onToggle: (servizio: import("@/hooks/useTu").ServizioInt) => Promise<void>;
}) {
  return (
    <Card padding={0}>
      <div style={{ padding: "12px 14px 8px" }}>
        <SectionTitle ico={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 14.5L4 20m11.5-5.5L20 20M4 4l5.5 5.5M14.5 9.5L20 4M4 12h2m12 0h2M12 4v2m0 12v2"/></svg>}>
          Integrazioni
        </SectionTitle>
      </div>
      <div>
        {INT_DEFS.map((d, i) => {
          const it = items.find((x) => x.servizio === d.servizio);
          const connesso = it?.stato === "connesso";
          const errore = it?.stato === "errore";
          return (
            <div key={d.servizio}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px",
                borderTop: i === 0 ? "none" : "1px solid rgba(200,228,228,0.4)",
              }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: connesso ? d.color : "rgba(200,228,228,0.6)",
                color: connesso ? "#fff" : "#5A7878",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: connesso ? `0 3px 8px ${d.color}55` : undefined,
              }}>{d.ico}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1 }}>
                  {d.lbl}
                </div>
                {connesso ? (
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: "#04342C", letterSpacing: 0.2, marginTop: 1 }}>
                    Connesso · {it?.account_label ?? "—"}
                  </div>
                ) : errore ? (
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: "#7F1D1D", letterSpacing: 0.2, marginTop: 1 }}>
                    Errore · {it?.errore_msg ?? "verifica auth"}
                  </div>
                ) : (
                  <div style={{ fontSize: 9.5, fontWeight: 700, color: "#5A7878", marginTop: 1 }}>
                    {d.sub}
                  </div>
                )}
              </div>

              <button type="button" onClick={() => onToggle(d.servizio)}
                style={{
                  padding: "6px 10px", borderRadius: 8, border: 0, cursor: "pointer",
                  background: connesso ? "rgba(220,68,68,0.10)" : "rgba(40,160,160,0.14)",
                  color: connesso ? "#B91C1C" : "#1E8080",
                  fontSize: 10, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase",
                  boxShadow: connesso
                    ? "inset 0 0 0 1px rgba(220,68,68,0.25)"
                    : "inset 0 0 0 1px rgba(40,160,160,0.3)",
                  fontFamily: "inherit",
                  flexShrink: 0,
                }}>
                {connesso ? "Scollega" : "Connetti"}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}


// ============== SicurezzaBlock · U25-U29 ==============
function SicurezzaBlock({ email, onCambiaPassword, onEsportaGDPR, onRichiediCancellazione }: {
  email: string;
  onCambiaPassword: (email: string) => Promise<boolean>;
  onEsportaGDPR: () => Promise<string | null>;
  onRichiediCancellazione: (motivo?: string) => Promise<boolean>;
}) {
  const [loadingPwd, setLoadingPwd] = useState(false);
  const [loadingExp, setLoadingExp] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const handleCambiaPassword = async () => {
    if (!email) { alert("Email non disponibile"); return; }
    setLoadingPwd(true);
    const ok = await onCambiaPassword(email);
    setLoadingPwd(false);
    alert(ok ? `Email di reset inviata a ${email}` : "Errore invio email");
  };

  const handleEsporta = async () => {
    setLoadingExp(true);
    const json = await onEsportaGDPR();
    setLoadingExp(false);
    if (!json) { alert("Errore export"); return; }
    // download
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mastro-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEliminaAccount = async () => {
    const motivo = prompt("Perchè vuoi eliminare l'account? (opzionale)");
    const ok = await onRichiediCancellazione(motivo ?? undefined);
    setConfirmDel(false);
    alert(ok ? "Richiesta inviata · ti contatteremo entro 48h" : "Errore richiesta");
  };

  return (
    <Card padding={0}>
      <div style={{ padding: "12px 14px 8px" }}>
        <SectionTitle ico={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}>
          Sicurezza & privacy
        </SectionTitle>
      </div>

      <SecurityRow ico={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
        lbl="Cambia password" sub="Ricevi email di reset password"
        cta={loadingPwd ? "Invio..." : "Invia email"}
        onClick={handleCambiaPassword}
        disabled={loadingPwd}
      />

      <SecurityRow ico={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33"/></svg>}
        lbl="Sessioni attive" sub="Dispositivi connessi al tuo account"
        cta="In arrivo"
        onClick={() => alert("Gestione sessioni · in arrivo")}
        disabled
      />

      <SecurityRow ico={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4M12 15v2"/></svg>}
        lbl="Autenticazione 2FA" sub="Aggiungi un secondo fattore"
        cta="In arrivo"
        onClick={() => alert("Setup 2FA · in arrivo")}
        disabled
      />

      <SecurityRow ico={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M5 10l7-7 7 7M5 21h14"/></svg>}
        lbl="Esporta i tuoi dati" sub="Download JSON · GDPR"
        cta={loadingExp ? "Genero..." : "Scarica"}
        onClick={handleEsporta}
        disabled={loadingExp}
      />

      <div style={{
        padding: "10px 14px 14px",
        borderTop: "1px solid rgba(220,68,68,0.15)",
        background: "rgba(220,68,68,0.03)",
        borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
      }}>
        {!confirmDel ? (
          <button type="button" onClick={() => setConfirmDel(true)}
            style={{
              width: "100%", padding: "10px 12px",
              borderRadius: 10, border: 0, cursor: "pointer",
              background: "rgba(220,68,68,0.10)", color: "#B91C1C",
              fontSize: 11, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase",
              boxShadow: "inset 0 0 0 1px rgba(220,68,68,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontFamily: "inherit",
            }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            Elimina account
          </button>
        ) : (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7F1D1D", marginBottom: 8, lineHeight: 1.4 }}>
              Sei sicuro? Tutti i tuoi dati verranno cancellati definitivamente entro 48 ore.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <button type="button" onClick={() => setConfirmDel(false)}
                style={{
                  padding: "9px 8px", borderRadius: 9, border: 0, cursor: "pointer",
                  background: "#fff", color: "#5A7878",
                  fontSize: 11, fontWeight: 900, letterSpacing: 0.3,
                  boxShadow: "inset 0 0 0 1px rgba(200,228,228,0.5)",
                  fontFamily: "inherit",
                }}>Annulla</button>
              <button type="button" onClick={handleEliminaAccount}
                style={{
                  padding: "9px 8px", borderRadius: 9, border: 0, cursor: "pointer",
                  background: "linear-gradient(145deg, #DC4444, #B91C1C)",
                  color: "#fff",
                  fontSize: 11, fontWeight: 900, letterSpacing: 0.3,
                  boxShadow: "0 3px 8px rgba(185,28,28,0.4), inset 0 -2px 0 rgba(0,0,0,0.1)",
                  fontFamily: "inherit",
                }}>Conferma eliminazione</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function SecurityRow({ ico, lbl, sub, cta, onClick, disabled = false }: {
  ico: JSX.Element; lbl: string; sub: string; cta: string;
  onClick: () => void; disabled?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 14px",
      borderTop: "1px solid rgba(200,228,228,0.4)",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: "rgba(40,160,160,0.10)", color: "#1E8080",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>{ico}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1 }}>{lbl}</div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: "#5A7878", marginTop: 1 }}>{sub}</div>
      </div>
      <button type="button" onClick={onClick} disabled={disabled}
        style={{
          padding: "5px 10px", borderRadius: 7, border: 0,
          cursor: disabled ? "not-allowed" : "pointer",
          background: disabled ? "rgba(200,228,228,0.5)" : "rgba(40,160,160,0.14)",
          color: disabled ? "#8FA8A8" : "#1E8080",
          fontSize: 10, fontWeight: 900, letterSpacing: 0.3, textTransform: "uppercase",
          fontFamily: "inherit",
          flexShrink: 0,
        }}>{cta}</button>
    </div>
  );
}


// ============== FooterBlock · U30-U33 ==============
function FooterBlock({ onSignOut }: { onSignOut: () => void }) {
  const version = "1.0.0-beta";
  const lastSync = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <a href="https://docs.mastro.app" target="_blank" rel="noopener noreferrer"
          style={{
            padding: "11px 10px", borderRadius: 11,
            background: "#fff", color: "#1E8080",
            fontSize: 11, fontWeight: 900, letterSpacing: 0.3, textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            boxShadow: "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.5)",
            textDecoration: "none",
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
          Aiuto
        </a>
        <a href="mailto:feedback@mastro.app?subject=Feedback%20MASTRO"
          style={{
            padding: "11px 10px", borderRadius: 11,
            background: "#fff", color: "#7F77DD",
            fontSize: 11, fontWeight: 900, letterSpacing: 0.3, textTransform: "uppercase",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            boxShadow: "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.5)",
            textDecoration: "none",
          }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          Feedback
        </a>
      </div>

      {/* U33 · Esci · rosso */}
      <button type="button" onClick={onSignOut}
        style={{
          width: "100%", padding: "12px",
          borderRadius: 12, border: 0, cursor: "pointer",
          background: "linear-gradient(145deg, #FF6464, #DC4444)",
          color: "#fff",
          fontSize: 12, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase",
          boxShadow: "0 4px 14px rgba(220,68,68,0.4), inset 0 -2px 0 rgba(0,0,0,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          fontFamily: "inherit",
        }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        Esci da MASTRO
      </button>

      {/* U30 · Version + last sync */}
      <div style={{
        textAlign: "center", padding: "6px 0",
        fontSize: 9, fontWeight: 700, color: "#8FA8A8", letterSpacing: 0.3,
      }}>
        MASTRO v{version} · ultima sync {lastSync}
      </div>
    </div>
  );
}
