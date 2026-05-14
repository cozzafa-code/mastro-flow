"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const PURPLE = "#5C2D8C";
const MUTED = "#5C6B7A";

// ============================================================
// TYPES
// ============================================================

export interface ArticoloLocalizzazione {
  articolo_id: string;
  codice: string;
  nome: string;
  qta_sede: number;
  qta_furgoni: number;
  qta_cantieri: number;
  qta_operatori: number;
  qta_totale_distribuita: number;
}

export interface FurgoneContenuto {
  furgone_id: string;
  furgone_nome: string;
  targa: string;
  articolo_id: string;
  codice: string;
  nome: string;
  unita_misura: string;
  quantita: number;
  commessa_id: string | null;
  commessa_code: string | null;
  caricato_at: string;
  caricato_da_nome: string;
  valore: number;
}

export interface CantiereContenuto {
  commessa_id: string;
  commessa_code: string;
  cliente: string;
  articolo_id: string;
  codice: string;
  nome: string;
  unita_misura: string;
  quantita: number;
  consegnato_at: string;
  consegnato_da_nome: string;
  foto_consegna_url: string | null;
  firma_cliente: boolean;
  valore: number;
}

export interface MaterialeCommessa {
  commessa_id: string;
  commessa_code: string;
  cliente: string;
  articolo_id: string;
  codice: string;
  nome: string;
  unita_misura: string;
  qta_pianificata: number;
  qta_consegnata: number;
  qta_consumata: number;
  qta_da_consegnare: number;
  stato: string;
  fonte: string;
  valore_pianificato: number;
}

// ============================================================
// VISTA FURGONI CONTENUTO
// ============================================================

export function VistaFurgoniContenuto({ aziendaId }: { aziendaId: string }) {
  const [items, setItems] = useState<FurgoneContenuto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("v_furgone_contenuto").select("*").eq("azienda_id", aziendaId)
      .then(({ data }) => { setItems((data || []) as any); setLoading(false); });
  }, [aziendaId]);

  // Raggruppa per furgone
  const byFurgone = items.reduce((acc, i) => {
    const k = i.furgone_id;
    if (!acc[k]) acc[k] = { nome: i.furgone_nome, targa: i.targa, items: [], valoreTot: 0 };
    acc[k].items.push(i);
    acc[k].valoreTot += i.valore || 0;
    return acc;
  }, {} as Record<string, any>);

  if (loading) return <Loader />;

  return (
    <div>
      <HeroCard
        kicker="Materiale sui furgoni"
        valore={items.reduce((s, i) => s + i.valore, 0)}
        sub={`${Object.keys(byFurgone).length} furgoni con materiale · ${items.length} righe`}
      />

      {Object.keys(byFurgone).length === 0 ? (
        <EmptyState text="Nessun materiale sui furgoni" />
      ) : Object.entries(byFurgone).map(([furgoneId, data]: any) => (
        <Sez
          key={furgoneId}
          title={`${data.nome} ${data.targa || ""}`}
          subtitle={`${data.items.length} articoli · €${data.valoreTot.toFixed(0)}`}
          color={TEAL}
        >
          {data.items.map((i: FurgoneContenuto) => (
            <ArtRow
              key={`${i.furgone_id}-${i.articolo_id}-${i.commessa_id || ""}`}
              codice={i.codice}
              nome={i.nome}
              quantita={i.quantita}
              um={i.unita_misura}
              sub={i.commessa_code ? `Per ${i.commessa_code}` : "Scorta libera"}
              valore={i.valore}
            />
          ))}
        </Sez>
      ))}
    </div>
  );
}

// ============================================================
// VISTA CANTIERI CONTENUTO
// ============================================================

export function VistaCantieriContenuto({ aziendaId }: { aziendaId: string }) {
  const [items, setItems] = useState<CantiereContenuto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("v_cantiere_contenuto").select("*").eq("azienda_id", aziendaId)
      .then(({ data }) => { setItems((data || []) as any); setLoading(false); });
  }, [aziendaId]);

  const byCantiere = items.reduce((acc, i) => {
    const k = i.commessa_id;
    if (!acc[k]) acc[k] = { code: i.commessa_code, cliente: i.cliente, items: [], valoreTot: 0 };
    acc[k].items.push(i);
    acc[k].valoreTot += i.valore || 0;
    return acc;
  }, {} as Record<string, any>);

  if (loading) return <Loader />;

  return (
    <div>
      <HeroCard
        kicker="Materiale in cantiere"
        valore={items.reduce((s, i) => s + i.valore, 0)}
        sub={`${Object.keys(byCantiere).length} cantieri attivi · ${items.length} righe`}
      />

      {Object.keys(byCantiere).length === 0 ? (
        <EmptyState text="Nessun materiale in cantiere" />
      ) : Object.entries(byCantiere).map(([cmId, data]: any) => (
        <Sez
          key={cmId}
          title={data.code}
          subtitle={`${data.cliente} · ${data.items.length} articoli · €${data.valoreTot.toFixed(0)}`}
          color={PURPLE}
        >
          {data.items.map((i: CantiereContenuto) => (
            <ArtRow
              key={`${i.commessa_id}-${i.articolo_id}`}
              codice={i.codice}
              nome={i.nome}
              quantita={i.quantita}
              um={i.unita_misura}
              sub={i.firma_cliente ? "Firmato cliente" : `Consegnato ${formatDate(i.consegnato_at)}`}
              valore={i.valore}
              ok={i.firma_cliente}
            />
          ))}
        </Sez>
      ))}
    </div>
  );
}

// ============================================================
// VISTA MATERIALI COMMESSA (specifica di 1 commessa)
// ============================================================

interface MaterialiCommessaProps {
  commessaId: string;
  onPreleva?: (articolo: MaterialeCommessa) => void;
}

export function VistaMaterialiCommessa({ commessaId, onPreleva }: MaterialiCommessaProps) {
  const [items, setItems] = useState<MaterialeCommessa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("v_commessa_materiali_riepilogo").select("*").eq("commessa_id", commessaId).order("nome")
      .then(({ data }) => { setItems((data || []) as any); setLoading(false); });
  }, [commessaId]);

  const estraiDaPreventivo = async () => {
    const { data, error } = await supabase.rpc("estrai_materiali_da_preventivo", { p_commessa_id: commessaId });
    if (error) { alert("Errore: " + error.message); return; }
    if (data?.ok) {
      alert(`Estratti ${data.materiali_estratti} materiali da preventivo`);
      // Reload
      const { data: nuovi } = await supabase.from("v_commessa_materiali_riepilogo").select("*").eq("commessa_id", commessaId);
      setItems((nuovi || []) as any);
    }
  };

  if (loading) return <Loader />;

  const totPianificato = items.reduce((s, i) => s + (i.valore_pianificato || 0), 0);
  const daConsegnare = items.filter(i => i.qta_da_consegnare > 0).length;

  return (
    <div>
      <HeroCard
        kicker="Materiali commessa"
        valore={totPianificato}
        sub={`${items.length} articoli · ${daConsegnare} da consegnare`}
      />

      {items.length === 0 ? (
        <>
          <EmptyState text="Nessun materiale assegnato a questa commessa" />
          <button onClick={estraiDaPreventivo} style={btnPrimary}>
            ESTRAI DA PREVENTIVO
          </button>
        </>
      ) : (
        <>
          <Sez title="Lista materiali" color={TEAL}>
            {items.map(i => (
              <div key={i.articolo_id} style={{ padding: "9px 0", borderBottom: "1px solid #E5EAF0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <StatoBadge stato={i.stato} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9.5, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{i.codice}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.nome}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: NAVY }}>{i.qta_pianificata} {i.unita_misura}</div>
                    {i.qta_consegnata > 0 && (
                      <div style={{ fontSize: 9.5, color: GREEN, fontWeight: 700 }}>
                        consegnati {i.qta_consegnata}
                      </div>
                    )}
                    {i.qta_da_consegnare > 0 && (
                      <div style={{ fontSize: 9.5, color: AMBER, fontWeight: 700 }}>
                        mancano {i.qta_da_consegnare}
                      </div>
                    )}
                  </div>
                  {onPreleva && i.qta_da_consegnare > 0 && (
                    <button onClick={() => onPreleva(i)} style={{
                      padding: "5px 9px", background: TEAL, color: "#fff",
                      fontSize: 9, fontWeight: 800, borderRadius: 5,
                      border: "none", cursor: "pointer", letterSpacing: 0.3, textTransform: "uppercase",
                    }}>SPOSTA</button>
                  )}
                </div>
              </div>
            ))}
          </Sez>

          <button onClick={estraiDaPreventivo} style={btnSecondary}>
            🔄 RICALCOLA DA PREVENTIVO
          </button>
        </>
      )}
    </div>
  );
}

// ============================================================
// VISTA LOCALIZZAZIONE (dove è ogni articolo)
// ============================================================

export function VistaLocalizzazioneArticoli({ aziendaId }: { aziendaId: string }) {
  const [items, setItems] = useState<ArticoloLocalizzazione[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("v_articolo_localizzazione").select("*").eq("azienda_id", aziendaId)
      .then(({ data }) => {
        const filtered = (data || []).filter((a: any) => a.qta_totale_distribuita > 0);
        setItems(filtered as any);
        setLoading(false);
      });
  }, [aziendaId]);

  if (loading) return <Loader />;

  const totSede = items.reduce((s, i) => s + i.qta_sede, 0);
  const totFurgoni = items.reduce((s, i) => s + i.qta_furgoni, 0);
  const totCantieri = items.reduce((s, i) => s + i.qta_cantieri, 0);
  const totOperatori = items.reduce((s, i) => s + i.qta_operatori, 0);
  const tot = totSede + totFurgoni + totCantieri + totOperatori;

  const pctS = tot > 0 ? (totSede / tot) * 100 : 0;
  const pctF = tot > 0 ? (totFurgoni / tot) * 100 : 0;
  const pctC = tot > 0 ? (totCantieri / tot) * 100 : 0;
  const pctO = tot > 0 ? (totOperatori / tot) * 100 : 0;

  return (
    <div>
      {/* Hero distribuzione */}
      <div style={{
        background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`, color: "#fff",
        borderRadius: 13, padding: "12px 14px", marginBottom: 9,
      }}>
        <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1, fontWeight: 700, textTransform: "uppercase" }}>
          Distribuzione fisica magazzino
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
          {tot.toLocaleString("it-IT")} unità totali
        </div>
        <div style={{
          display: "flex", height: 10, borderRadius: 5, overflow: "hidden",
          background: "#F1F4F7", marginTop: 9,
        }}>
          <div style={{ width: `${pctS}%`, background: TEAL }} />
          <div style={{ width: `${pctF}%`, background: AMBER }} />
          <div style={{ width: `${pctC}%`, background: PURPLE }} />
          <div style={{ width: `${pctO}%`, background: RED }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginTop: 6, color: "rgba(255,255,255,0.85)", flexWrap: "wrap", gap: 5 }}>
          <span><DotI color={TEAL}/> Sede {Math.round(pctS)}%</span>
          <span><DotI color={AMBER}/> Furgoni {Math.round(pctF)}%</span>
          <span><DotI color={PURPLE}/> Cantieri {Math.round(pctC)}%</span>
          <span><DotI color={RED}/> Team {Math.round(pctO)}%</span>
        </div>
      </div>

      <Sez title="Articoli con materiale fuori sede" count={items.filter(i => (i.qta_furgoni + i.qta_cantieri + i.qta_operatori) > 0).length}>
        {items.filter(i => (i.qta_furgoni + i.qta_cantieri + i.qta_operatori) > 0).map(i => (
          <div key={i.articolo_id} style={{ padding: "9px 0", borderBottom: "1px solid #E5EAF0" }}>
            <div style={{ fontSize: 9.5, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{i.codice}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginTop: 2 }}>{i.nome}</div>
            <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
              {i.qta_sede > 0 && <Tag color={TEAL}>Sede {i.qta_sede}</Tag>}
              {i.qta_furgoni > 0 && <Tag color={AMBER}>Furgoni {i.qta_furgoni}</Tag>}
              {i.qta_cantieri > 0 && <Tag color={PURPLE}>Cantieri {i.qta_cantieri}</Tag>}
              {i.qta_operatori > 0 && <Tag color={RED}>Team {i.qta_operatori}</Tag>}
            </div>
          </div>
        ))}
      </Sez>
    </div>
  );
}

// ============================================================
// COMPONENTI CONDIVISI
// ============================================================

function HeroCard({ kicker, valore, sub }: any) {
  return (
    <div style={{
      background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`, color: "#fff",
      borderRadius: 13, padding: "12px 14px", marginBottom: 9,
    }}>
      <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1, fontWeight: 700, textTransform: "uppercase" }}>{kicker}</div>
      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>€ {valore.toLocaleString("it-IT", { minimumFractionDigits: 0 })}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function Sez({ title, subtitle, count, color = NAVY, children }: any) {
  return (
    <div style={{
      background: "#fff", borderRadius: 13, padding: "11px 12px",
      marginBottom: 9, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: NAVY,
        letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>{title}</span>
        {count !== undefined && (
          <span style={{ background: color, color: "#fff", padding: "1px 7px", borderRadius: 99, fontSize: 9, fontWeight: 800 }}>{count}</span>
        )}
      </div>
      {subtitle && <div style={{ fontSize: 10, color: MUTED, marginBottom: 8, fontWeight: 600 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

function ArtRow({ codice, nome, quantita, um, sub, valore, ok }: any) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      padding: "8px 0", borderBottom: "1px solid #F1F4F7",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>{codice}</div>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nome}</div>
        <div style={{ fontSize: 9.5, color: ok ? GREEN : MUTED, marginTop: 1, fontWeight: ok ? 700 : 500 }}>{sub}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: NAVY }}>{quantita}</div>
        <div style={{ fontSize: 9, color: MUTED }}>{um}</div>
        {valore !== undefined && (
          <div style={{ fontSize: 9, color: TEAL, fontWeight: 700, marginTop: 1 }}>€{valore.toFixed(0)}</div>
        )}
      </div>
    </div>
  );
}

function StatoBadge({ stato }: { stato: string }) {
  const cfg: Record<string, any> = {
    pianificato: { bg: "#F1F4F7", col: MUTED, lbl: "PIAN." },
    riservato: { bg: "#FBF0DC", col: "#8B6926", lbl: "RIS." },
    ordinato: { bg: "#E3EDF9", col: "#2D5A8C", lbl: "ORD." },
    arrivato: { bg: "#FBF0DC", col: AMBER, lbl: "ARR." },
    in_furgone: { bg: "#FBF0DC", col: AMBER, lbl: "FURG." },
    in_cantiere: { bg: "rgba(92,45,140,0.15)", col: PURPLE, lbl: "CANT." },
    consumato: { bg: "#D5EBE0", col: GREEN, lbl: "OK" },
    reso: { bg: "#FCE3E3", col: RED, lbl: "RESO" },
  };
  const c = cfg[stato] || cfg.pianificato;
  return (
    <span style={{
      background: c.bg, color: c.col,
      padding: "2px 6px", borderRadius: 5,
      fontSize: 8.5, fontWeight: 800, letterSpacing: 0.3,
      flexShrink: 0,
    }}>{c.lbl}</span>
  );
}

function Tag({ color, children }: any) {
  return (
    <span style={{
      background: `${color}15`, color, border: `1px solid ${color}50`,
      padding: "2px 7px", borderRadius: 99,
      fontSize: 9.5, fontWeight: 700,
    }}>{children}</span>
  );
}

function DotI({ color }: { color: string }) {
  return <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 99, background: color, marginRight: 3 }} />;
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12, fontWeight: 600 }}>{text}</div>;
}

function Loader() {
  return <div style={{ padding: 30, textAlign: "center", color: MUTED, fontSize: 12 }}>Caricamento...</div>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

const btnPrimary: React.CSSProperties = {
  width: "100%", padding: 12,
  background: `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
  color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 800,
  letterSpacing: 0.5, textTransform: "uppercase",
  border: "none", cursor: "pointer", marginTop: 9,
};

const btnSecondary: React.CSSProperties = {
  width: "100%", padding: 10,
  background: "#fff", color: TEAL,
  borderRadius: 9, fontSize: 11, fontWeight: 800,
  letterSpacing: 0.4, textTransform: "uppercase",
  border: `1.5px solid ${TEAL}`, cursor: "pointer", marginTop: 8,
};
