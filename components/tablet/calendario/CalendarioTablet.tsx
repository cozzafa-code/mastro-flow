"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useDashboard } from "../dashboard-context";
import { useMastroData } from "../store";

type Vista = "mese" | "settimana" | "giorno";

interface EventoCal {
  id: string;
  data: Date;
  ora: string;
  durataMin: number;
  titolo: string;
  sottotitolo: string;
  tipo: "sopralluogo" | "montaggio" | "produzione" | "consegna";
  tint: keyof typeof TINTS;
  commessaId?: string;
  squadraIds?: string[];
}

const TINTS = {
  red: TT.red, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, teal: TT.teal,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

const TIPO_LABEL: Record<EventoCal["tipo"], string> = {
  sopralluogo: "Sopralluogo",
  montaggio:   "Montaggio",
  produzione:  "Produzione",
  consegna:    "Consegna",
};

const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI_BREVI = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];

// Date corrente fissa per coerenza con il dataset
const OGGI = new Date(2026, 3, 27); // 27 aprile 2026 (mese 0-indexed)

// =========================================================
// PARSER DATE: converte "27 apr 2026" in Date
// =========================================================
const MESI_BREVI = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];

function parseDataIT(s: string | undefined): Date | null {
  if (!s) return null;
  // formato "27 apr 2026" o "12 mag 2026"
  const parts = s.toLowerCase().trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const giorno = parseInt(parts[0], 10);
  const mese = MESI_BREVI.indexOf(parts[1].substring(0, 3));
  const anno = parseInt(parts[2], 10);
  if (isNaN(giorno) || mese < 0 || isNaN(anno)) return null;
  return new Date(anno, mese, giorno);
}

function formatTime(ora: string): string {
  return ora.length === 4 ? `0${ora}` : ora;
}

function addMinutes(ora: string, min: number): string {
  const [h, m] = ora.split(":").map(Number);
  const total = h * 60 + m + min;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2,"0")}:${String(nm).padStart(2,"0")}`;
}

// =========================================================
// COMPUTE EVENTI dal store
// =========================================================
function useEventi(): EventoCal[] {
  const data = useMastroData();
  return React.useMemo(() => {
    const eventi: EventoCal[] = [];

    // Sopralluoghi
    data.getSopralluoghi().forEach((s) => {
      const d = parseDataIT(s.data);
      if (!d) return;
      const cli = data.getCliente(s.clienteId);
      eventi.push({
        id: `sop-${s.id}`,
        data: d,
        ora: formatTime(s.ora),
        durataMin: 60,
        titolo: `Sopralluogo ${cli?.nome.split(" ").slice(0,2).join(" ") || ""}`,
        sottotitolo: cli ? `${cli.indirizzo}, ${cli.citta}` : "",
        tipo: "sopralluogo",
        tint: s.stato === "completato" ? "slate" : "red",
        commessaId: s.commessaId,
      });
    });

    // Montaggi
    data.getMontaggi().forEach((m) => {
      const d = parseDataIT(m.data);
      if (!d) return;
      const c = data.getCommessa(m.commessaId);
      const cli = c ? data.getCliente(c.clienteId) : null;
      eventi.push({
        id: `mon-${m.id}`,
        data: d,
        ora: formatTime(m.ora),
        durataMin: m.durataOre * 60,
        titolo: `Montaggio ${cli?.nome.split(" ").slice(0,2).join(" ") || ""}`,
        sottotitolo: cli ? `${cli.indirizzo}, ${cli.citta} - ${m.pezzi} pezzi` : "",
        tipo: "montaggio",
        tint: "green",
        commessaId: m.commessaId,
        squadraIds: m.squadraIds,
      });
    });

    // Produzione: consegne previste
    data.getProduzioni().forEach((p) => {
      const consegna = p.consegnaPrevista; // "5 mag" o "12 mag"
      const parts = consegna.toLowerCase().trim().split(/\s+/);
      if (parts.length !== 2) return;
      const giorno = parseInt(parts[0], 10);
      const mese = MESI_BREVI.indexOf(parts[1].substring(0,3));
      if (isNaN(giorno) || mese < 0) return;
      const d = new Date(2026, mese, giorno);
      const c = data.getCommessa(p.commessaId);
      const cli = c ? data.getCliente(c.clienteId) : null;
      eventi.push({
        id: `prod-${p.id}`,
        data: d,
        ora: "08:00",
        durataMin: 30,
        titolo: `Consegna prod. ${cli?.nome.split(" ").slice(0,2).join(" ") || ""}`,
        sottotitolo: `${p.sistemaProfilo} - ${p.pezzi} pezzi`,
        tipo: "consegna",
        tint: "blue",
        commessaId: p.commessaId,
      });
    });

    // Sort
    eventi.sort((a, b) => {
      const dt = a.data.getTime() - b.data.getTime();
      if (dt !== 0) return dt;
      return a.ora.localeCompare(b.ora);
    });

    return eventi;
  }, [data]);
}

// =========================================================
// MAIN COMPONENT
// =========================================================
export default function CalendarioTablet() {
  const [vista, setVista] = React.useState<Vista>("settimana");
  const [riferimento, setRiferimento] = React.useState<Date>(OGGI);
  const eventi = useEventi();
  const { openCommessa } = useDashboard();

  const onEventoClick = (e: EventoCal) => {
    if (e.commessaId) openCommessa(e.commessaId);
  };

  return (
    <div>
      <Toolbar vista={vista} setVista={setVista} riferimento={riferimento} setRiferimento={setRiferimento} />
      {vista === "mese"      && <VistaMese      riferimento={riferimento} eventi={eventi} onClick={onEventoClick} setRif={setRiferimento} setVista={setVista} />}
      {vista === "settimana" && <VistaSettimana riferimento={riferimento} eventi={eventi} onClick={onEventoClick} />}
      {vista === "giorno"    && <VistaGiorno    riferimento={riferimento} eventi={eventi} onClick={onEventoClick} />}
    </div>
  );
}

function Toolbar({ vista, setVista, riferimento, setRiferimento }: any) {
  const labelMese = `${MESI[riferimento.getMonth()]} ${riferimento.getFullYear()}`;

  const prev = () => {
    const d = new Date(riferimento);
    if (vista === "mese") d.setMonth(d.getMonth() - 1);
    else if (vista === "settimana") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setRiferimento(d);
  };
  const next = () => {
    const d = new Date(riferimento);
    if (vista === "mese") d.setMonth(d.getMonth() + 1);
    else if (vista === "settimana") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setRiferimento(d);
  };
  const oggi = () => setRiferimento(OGGI);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>{labelMese}</div>
        <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
          Vista {vista === "mese" ? "mensile" : vista === "settimana" ? "settimanale" : "giornaliera"}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={oggi} style={btnSecondary}>Oggi</button>
        <div style={{ display: "flex", gap: 0 }}>
          <button onClick={prev} style={{ ...btnIcon, borderRadius: "8px 0 0 8px" }}>
            <Icon name="chevronRight" size={14} color={TT.text2} strokeWidth={2.4} style={{ transform: "rotate(180deg)" }} />
          </button>
          <button onClick={next} style={{ ...btnIcon, borderRadius: "0 8px 8px 0", borderLeft: "none" }}>
            <Icon name="chevronRight" size={14} color={TT.text2} strokeWidth={2.4} />
          </button>
        </div>

        <div style={{ display: "flex", padding: 3, background: TT.bgSoft, borderRadius: 9, gap: 2 }}>
          {(["mese","settimana","giorno"] as Vista[]).map((v) => (
            <button key={v}
              onClick={() => setVista(v)}
              style={{
                padding: "6px 12px",
                background: vista === v ? TT.surface : "transparent",
                border: "none", borderRadius: 6,
                color: vista === v ? TT.text1 : TT.text3,
                fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: TT.fontFamily,
                boxShadow: vista === v ? TT.shadowSm : "none",
                textTransform: "capitalize",
                letterSpacing: "-0.05px",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        <button style={btnPrimary}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuovo evento
        </button>
      </div>
    </div>
  );
}

const btnSecondary: React.CSSProperties = {
  padding: "8px 14px",
  background: TT.surface, color: TT.text2,
  border: `1px solid ${TT.borderStrong}`, borderRadius: 9,
  fontSize: 12, fontWeight: 700, cursor: "pointer",
  fontFamily: TT.fontFamily,
};

const btnIcon: React.CSSProperties = {
  width: 32, height: 32,
  background: TT.surface, border: `1px solid ${TT.borderStrong}`,
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px",
  background: TT.violet[400], color: "#fff",
  border: "none", borderRadius: 9,
  fontSize: 12, fontWeight: 700,
  cursor: "pointer", fontFamily: TT.fontFamily,
  boxShadow: `0 2px 8px ${TT.violet[300]}`,
};

// =========================================================
// VISTA MESE
// =========================================================
function VistaMese({ riferimento, eventi, onClick, setRif, setVista }: any) {
  // Lunedi della prima settimana del mese
  const primo = new Date(riferimento.getFullYear(), riferimento.getMonth(), 1);
  let weekday = primo.getDay() - 1; // 0=lun
  if (weekday < 0) weekday = 6;
  const inizio = new Date(primo);
  inizio.setDate(primo.getDate() - weekday);

  const giorni: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(inizio);
    d.setDate(inizio.getDate() + i);
    giorni.push(d);
  }

  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
        <thead>
          <tr style={{ background: TT.bgSoft }}>
            {GIORNI_BREVI.map((g) => (
              <th key={g} style={{
                padding: "10px 8px",
                fontSize: 10, fontWeight: 700, color: TT.text3,
                letterSpacing: "0.6px", textTransform: "uppercase",
                borderBottom: `1px solid ${TT.border}`,
                width: "14.28%",
              }}>{g}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0,1,2,3,4,5].map((row) => (
            <tr key={row}>
              {[0,1,2,3,4,5,6].map((col) => {
                const d = giorni[row * 7 + col];
                const inMese = d.getMonth() === riferimento.getMonth();
                const isOggi = d.toDateString() === OGGI.toDateString();
                const eventiGiorno = eventi.filter((e: EventoCal) => sameDay(e.data, d));
                return (
                  <td key={col} style={{
                    padding: 4,
                    borderRight: col < 6 ? `1px solid ${TT.border}` : "none",
                    borderBottom: row < 5 ? `1px solid ${TT.border}` : "none",
                    height: 90,
                    verticalAlign: "top",
                    background: isOggi ? TT.violet[50] : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => { setRif(d); setVista("giorno"); }}>
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "2px 4px",
                    }}>
                      <span style={{
                        fontSize: 11, fontWeight: isOggi ? 800 : 600,
                        color: !inMese ? TT.text4 : isOggi ? TT.violet[600] : TT.text1,
                        fontVariantNumeric: "tabular-nums",
                        background: isOggi ? TT.violet[400] : "transparent",
                        color: isOggi ? "#fff" : !inMese ? TT.text4 : TT.text1,
                        width: 22, height: 22, borderRadius: "50%",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {d.getDate()}
                      </span>
                      {eventiGiorno.length > 0 && (
                        <span style={{
                          fontSize: 8, fontWeight: 800, color: TT.text3,
                          background: TT.bgSoft, padding: "1px 5px", borderRadius: 999,
                        }}>
                          {eventiGiorno.length}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 2 }}>
                      {eventiGiorno.slice(0, 3).map((e: EventoCal) => {
                        const ramp = TINTS[e.tint];
                        return (
                          <div key={e.id} style={{
                            display: "flex", alignItems: "center", gap: 3,
                            padding: "1px 4px",
                            background: ramp[100], color: ramp[600],
                            borderRadius: 4,
                            fontSize: 9, fontWeight: 700,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            <div style={{ width: 4, height: 4, borderRadius: "50%", background: ramp[500], flexShrink: 0 }} />
                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {e.ora} {e.titolo}
                            </span>
                          </div>
                        );
                      })}
                      {eventiGiorno.length > 3 && (
                        <div style={{ fontSize: 9, color: TT.text3, fontWeight: 600, padding: "0 4px" }}>
                          +{eventiGiorno.length - 3} altri
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// =========================================================
// VISTA SETTIMANA
// =========================================================
function VistaSettimana({ riferimento, eventi, onClick }: any) {
  // Lunedi della settimana
  let weekday = riferimento.getDay() - 1;
  if (weekday < 0) weekday = 6;
  const lun = new Date(riferimento);
  lun.setDate(riferimento.getDate() - weekday);
  lun.setHours(0,0,0,0);

  const giorni: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lun);
    d.setDate(lun.getDate() + i);
    giorni.push(d);
  }

  const ore = [];
  for (let h = 7; h < 20; h++) ore.push(h);

  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: TT.bgSoft }}>
            <th style={{ width: 60, padding: "8px", fontSize: 9, fontWeight: 700, color: TT.text3, borderBottom: `1px solid ${TT.border}` }}></th>
            {giorni.map((d, i) => {
              const isOggi = sameDay(d, OGGI);
              return (
                <th key={i} style={{
                  padding: "10px 8px",
                  borderBottom: `1px solid ${TT.border}`,
                  borderLeft: `1px solid ${TT.border}`,
                }}>
                  <div style={{
                    fontSize: 9, fontWeight: 700,
                    color: isOggi ? TT.violet[600] : TT.text3,
                    letterSpacing: "0.6px", textTransform: "uppercase",
                  }}>
                    {GIORNI_BREVI[i]}
                  </div>
                  <div style={{
                    fontSize: 16, fontWeight: 800,
                    color: isOggi ? "#fff" : TT.text1,
                    background: isOggi ? TT.violet[400] : "transparent",
                    width: 30, height: 30, borderRadius: "50%",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontVariantNumeric: "tabular-nums",
                    marginTop: 4,
                  }}>
                    {d.getDate()}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ore.map((h, hIdx) => (
            <tr key={h}>
              <td style={{
                padding: "0 8px",
                borderRight: `1px solid ${TT.border}`,
                fontSize: 10, color: TT.text3,
                fontVariantNumeric: "tabular-nums", fontWeight: 600,
                verticalAlign: "top",
                paddingTop: 2,
                height: 50,
              }}>
                {String(h).padStart(2,"0")}:00
              </td>
              {giorni.map((d, i) => {
                const isOggi = sameDay(d, OGGI);
                const eventiOra = eventi.filter((e: EventoCal) => {
                  if (!sameDay(e.data, d)) return false;
                  const eh = parseInt(e.ora.split(":")[0], 10);
                  return eh === h;
                });
                return (
                  <td key={i} style={{
                    padding: 2,
                    borderLeft: `1px solid ${TT.border}`,
                    borderTop: `1px solid ${TT.border}`,
                    background: isOggi ? TT.violet[50] : "transparent",
                    verticalAlign: "top",
                    height: 50,
                  }}>
                    {eventiOra.map((e: EventoCal) => {
                      const ramp = TINTS[e.tint];
                      return (
                        <div key={e.id}
                          onClick={() => onClick(e)}
                          style={{
                            padding: "4px 6px",
                            background: ramp[100],
                            borderLeft: `3px solid ${ramp[400]}`,
                            borderRadius: 4,
                            fontSize: 9, cursor: "pointer",
                            marginBottom: 2,
                          }}>
                          <div style={{ fontWeight: 800, color: ramp[600], fontVariantNumeric: "tabular-nums" }}>
                            {e.ora}
                          </div>
                          <div style={{
                            fontWeight: 700, color: TT.text1,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            {e.titolo}
                          </div>
                        </div>
                      );
                    })}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =========================================================
// VISTA GIORNO
// =========================================================
function VistaGiorno({ riferimento, eventi, onClick }: any) {
  const eventiOggi = eventi.filter((e: EventoCal) => sameDay(e.data, riferimento));
  const ore = [];
  for (let h = 7; h < 20; h++) ore.push(h);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 12 }}>
      {/* Timeline */}
      <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
        <div style={{
          padding: "12px 16px",
          background: TT.bgSoft,
          borderBottom: `1px solid ${TT.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
            {GIORNI_BREVI[(riferimento.getDay()+6)%7]} {riferimento.getDate()} {MESI[riferimento.getMonth()].toLowerCase().substring(0,3)} {riferimento.getFullYear()}
          </div>
          <div style={{ fontSize: 11, color: TT.text3 }}>
            {eventiOggi.length} eventi
          </div>
        </div>

        <div style={{ position: "relative" }}>
          {ore.map((h) => (
            <div key={h} style={{
              display: "flex",
              borderTop: `1px solid ${TT.border}`,
              minHeight: 56,
            }}>
              <div style={{
                width: 60, padding: "6px 10px",
                fontSize: 10, color: TT.text3,
                fontVariantNumeric: "tabular-nums", fontWeight: 600,
                textAlign: "right",
                borderRight: `1px solid ${TT.border}`,
              }}>
                {String(h).padStart(2,"0")}:00
              </div>
              <div style={{ flex: 1, padding: 4, display: "flex", flexDirection: "column", gap: 4 }}>
                {eventiOggi.filter((e: EventoCal) => parseInt(e.ora.split(":")[0],10) === h).map((e: EventoCal) => {
                  const ramp = TINTS[e.tint];
                  return (
                    <div key={e.id}
                      onClick={() => onClick(e)}
                      style={{
                        padding: "8px 12px",
                        background: ramp[50],
                        borderLeft: `3px solid ${ramp[400]}`,
                        borderRadius: 6,
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, color: ramp[600],
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {e.ora}
                        </span>
                        <span style={{
                          padding: "1px 7px",
                          background: ramp[100], color: ramp[600],
                          borderRadius: 999, fontSize: 9, fontWeight: 700,
                          letterSpacing: "0.3px", textTransform: "uppercase",
                        }}>
                          {TIPO_LABEL[e.tipo]}
                        </span>
                        <span style={{ fontSize: 9, color: TT.text3, fontWeight: 600 }}>
                          {e.durataMin >= 60 ? `${Math.floor(e.durataMin/60)}h` : `${e.durataMin}min`}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.15px" }}>
                        {e.titolo}
                      </div>
                      {e.sottotitolo && (
                        <div style={{ fontSize: 11, color: TT.text2, marginTop: 2 }}>
                          {e.sottotitolo}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar dettagli giorno */}
      <div style={cardStyle({ padding: "16px 18px", height: "fit-content" })}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 12 }}>
          Riepilogo giorno
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(["sopralluogo","montaggio","produzione","consegna"] as EventoCal["tipo"][]).map((tipo) => {
            const count = eventiOggi.filter((e: EventoCal) => e.tipo === tipo).length;
            const tint: keyof typeof TINTS = tipo === "sopralluogo" ? "red" : tipo === "montaggio" ? "green" : tipo === "consegna" ? "blue" : "amber";
            const ramp = TINTS[tint];
            return (
              <div key={tipo} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px",
                background: ramp[50],
                border: `1px solid ${ramp[100]}`,
                borderRadius: 8,
              }}>
                <span style={{ fontSize: 12, color: TT.text2, fontWeight: 600 }}>
                  {TIPO_LABEL[tipo]}
                </span>
                <span style={{
                  fontSize: 16, fontWeight: 800, color: ramp[600],
                  fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px",
                }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {eventiOggi.length === 0 && (
          <div style={{ marginTop: 14, padding: 14, textAlign: "center", color: TT.text3, fontSize: 11, fontStyle: "italic" }}>
            Giornata libera
          </div>
        )}
      </div>
    </div>
  );
}
