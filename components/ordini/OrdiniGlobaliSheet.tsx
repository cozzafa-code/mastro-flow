"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { OrdineConCommessa, OrdineStato } from "./ordini-types";
import { fetchOrdiniByAzienda } from "./ordini-helpers";
import GlobaliHeader from "./globali/GlobaliHeader";
import GlobaliToolbar, { CardStyle, GroupingKey } from "./globali/GlobaliToolbar";
import GlobaliFilters, { ActiveFilter } from "./globali/GlobaliFilters";
import OrdineCardRadar from "./globali/OrdineCardRadar";
import OrdineCardTimeline from "./globali/OrdineCardTimeline";
import OrdineCardHero from "./globali/OrdineCardHero";
import StatisticheOrdiniSheet from "./StatisticheOrdiniSheet";
import OrdineDettaglioSheet from "./OrdineDettaglioSheet";
import RicezioneMerceSheet from "./RicezioneMerceSheet";
import QrScannerSheet from "./qr/QrScannerSheet";
import QrShowModal from "./qr/QrShowModal";
import NuovoOrdineWizard from "./NuovoOrdineWizard";
import { usePreferenze } from "@/hooks/usePreferenze";

interface Props {
  aziendaId: string;
  onClose: () => void;
  onApriOrdine: (ordineId: string) => void;
  onApriCommessa: (commessaId: string) => void;
  onApriStatistiche?: () => void;
  onApriScanner?: () => void;
}

export default function OrdiniGlobaliSheet({
  aziendaId, onClose, onApriOrdine, onApriCommessa,
  onApriStatistiche, onApriScanner,
}: Props) {
  const [ordini, setOrdini] = useState<OrdineConCommessa[]>([]);
  const [loading, setLoading] = useState(true);
  const { preferenze, setPreferenza } = usePreferenze();
  const [raggruppa, setRaggruppaState] = useState<GroupingKey>(
    (preferenze.ordini_raggruppa as GroupingKey) || "stato"
  );
  const [cardStyle, setCardStyleState] = useState<CardStyle>(
    (preferenze.ordini_card_style as CardStyle) || "A"
  );

  // Sync preferenze da DB quando arrivano
  useEffect(() => {
    if (preferenze.ordini_raggruppa) setRaggruppaState(preferenze.ordini_raggruppa as GroupingKey);
    if (preferenze.ordini_card_style) setCardStyleState(preferenze.ordini_card_style as CardStyle);
  }, [preferenze.ordini_raggruppa, preferenze.ordini_card_style]);

  const setRaggruppa = (k: GroupingKey) => {
    setRaggruppaState(k);
    setPreferenza("ordini_raggruppa", k);
  };
  const setCardStyle = (s: CardStyle) => {
    setCardStyleState(s);
    setPreferenza("ordini_card_style", s);
  };
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [query, setQuery] = useState("");
  const [filtriAvanzati, setFiltriAvanzati] = useState<ActiveFilter[]>([]);
  const [statsOpen, setStatsOpen] = useState(false);
  const [dettaglioOrdineId, setDettaglioOrdineId] = useState<string | null>(null);
  const [ricezioneOrdineId, setRicezioneOrdineId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrShowOrdine, setQrShowOrdine] = useState<OrdineConCommessa | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (!aziendaId) return;
    setLoading(true);
    fetchOrdiniByAzienda(aziendaId).then((data) => {
      setOrdini(data);
      setLoading(false);
    });
  }, [aziendaId]);

  // realtime
  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel("ordini-globali-" + aziendaId)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "ordini_fornitore", filter: `azienda_id=eq.${aziendaId}` },
        () => fetchOrdiniByAzienda(aziendaId).then(setOrdini)
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId]);



  const filtered = useMemo(() => {
    let res = ordini;
    if (filtroStato !== "tutti") {
      if (filtroStato === "in_ritardo") {
        res = res.filter((o) => isInRitardo(o));
      } else {
        res = res.filter((o) => (o.stato as string) === filtroStato);
      }
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      res = res.filter((o) =>
        (o.numero || "").toLowerCase().includes(q) ||
        ((o as any).fornitore_nome || "").toLowerCase().includes(q) ||
        ((o as any).commessa?.code || "").toLowerCase().includes(q) ||
        ((o as any).commessa?.cognome || "").toLowerCase().includes(q)
      );
    }
    filtriAvanzati.forEach((f) => {
      if (f.key === "commessa") res = res.filter((o) => (o as any).commessa?.code === f.value);
      if (f.key === "fornitore") res = res.filter((o) => (o as any).fornitore_nome === f.value);
    });
    return res;
  }, [ordini, filtroStato, query, filtriAvanzati]);

  const counts = useMemo(() => ({
    tutti: ordini.length,
    bozza: ordini.filter((o) => o.stato === "bozza").length,
    inviato: ordini.filter((o) => o.stato === "inviato").length,
    in_transito: ordini.filter((o) => o.stato === "in_transito" || o.stato === "confermato").length,
    arrivato: ordini.filter((o) => o.stato === "arrivato" || o.stato === "verificato").length,
    in_ritardo: ordini.filter(isInRitardo).length,
  }), [ordini]);

  const kpi = useMemo(() => ({
    totale: ordini.length,
    inTransito: counts.in_transito,
    inRitardo: counts.in_ritardo,
    valoreAperto: ordini.filter((o) => !["arrivato", "verificato"].includes(o.stato || ""))
      .reduce((s, o) => s + ((o as any).totale_euro || 0), 0),
  }), [ordini, counts]);

  const gruppi = useMemo(() => buildGruppi(filtered, raggruppa), [filtered, raggruppa]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#8B9BB0",
      zIndex: 100, overflowY: "auto",
      fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <GlobaliHeader
        totale={kpi.totale}
        inTransito={kpi.inTransito}
        inRitardo={kpi.inRitardo}
        valoreAperto={kpi.valoreAperto}
        query={query}
        onQuery={setQuery}
        onClose={onClose}
        onOpenStats={() => setStatsOpen(true)}
        onOpenScanner={() => setScannerOpen(true)}
        onOpenSettings={() => { /* TODO settings */ }}
      />

      <GlobaliToolbar
        raggruppa={raggruppa}
        onRaggruppa={setRaggruppa}
        cardStyle={cardStyle}
        onCardStyle={setCardStyle}
        nFiltriAttivi={filtriAvanzati.length}
        onOpenFiltri={() => { /* TODO sheet filtri */ }}
      />

      <GlobaliFilters
        attivo={filtroStato}
        onAttivo={setFiltroStato}
        counts={counts}
        attiviChips={filtriAvanzati}
        onRemoveChip={(k) => setFiltriAvanzati((prev) => prev.filter((f) => f.key !== k))}
        onReset={() => setFiltriAvanzati([])}
      />

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#fff", fontSize: 13 }}>
          Caricamento...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          margin: "30px 14px", padding: 24, background: "rgba(255,255,255,0.5)",
          borderRadius: 12, textAlign: "center", color: "#5A6478", fontSize: 12
        }}>
          Nessun ordine corrisponde ai filtri
        </div>
      ) : (
        gruppi.map((g) => (
          <div key={g.key}>
            <div style={{
              margin: "14px 14px 0", padding: "7px 12px",
              background: "rgba(255,255,255,0.5)", borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px",
              color: "#1A2A47", textTransform: "uppercase"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: g.color }}>●</span>
                {g.label}
                <span style={{
                  background: "#1A2A47", color: "#fff",
                  padding: "2px 7px", borderRadius: 99, fontSize: 10
                }}>{g.ordini.length}</span>
              </div>
              <div style={{
                color: "#5A6478", fontWeight: 700, fontSize: 10.5,
                letterSpacing: "0.3px", textTransform: "none"
              }}>EUR {formatNum(g.ordini.reduce((s, o) => s + ((o as any).totale_euro || 0), 0))}</div>
            </div>

            <div style={{ margin: "0 10px", paddingBottom: 8 }}>
              {g.ordini.map((o) => {
                const props = {
                  ord: o,
                  onClick: () => setDettaglioOrdineId(o.id),
                  onQrClick: () => setQrShowOrdine(o),
                  onScan: () => onApriScanner?.(),
                };
                if (cardStyle === "B") return <OrdineCardTimeline key={o.id} {...props} />;
                if (cardStyle === "C") return <OrdineCardHero key={o.id} {...props} />;
                return <OrdineCardRadar key={o.id} {...props} />;
              })}
            </div>
          </div>
        ))
      )}

      {statsOpen && (
        <StatisticheOrdiniSheet
          aziendaId={aziendaId}
          onClose={() => setStatsOpen(false)}
        />
      )}

      {dettaglioOrdineId && (
        <OrdineDettaglioSheet
          ordineId={dettaglioOrdineId}
          aziendaId={aziendaId}
          onClose={() => setDettaglioOrdineId(null)}
          onApriRicezione={(id) => { setDettaglioOrdineId(null); setRicezioneOrdineId(id); }}
          onApriCommessa={(cmId) => { setDettaglioOrdineId(null); onApriCommessa(cmId); }}
        />
      )}

      {scannerOpen && (
        <QrScannerSheet
          onClose={() => setScannerOpen(false)}
          onScanResult={async (token, rigaCode) => {
            setScannerOpen(false);
            // Trova ordine via token chiamando RPC
            const { data, error } = await supabase.rpc("portale_ordine_via_token", { p_token: token });
            if (error || !data?.ok) {
              alert("QR non riconosciuto o scaduto");
              return;
            }
            const ordineId = (data as any).ordine?.id;
            if (ordineId) {
              setRicezioneOrdineId(ordineId);
            }
          }}
        />
      )}

      {wizardOpen && (
        <NuovoOrdineWizard
          aziendaId={aziendaId}
          onClose={() => setWizardOpen(false)}
          onCreated={(ordineId: string) => {
            setWizardOpen(false);
            fetchOrdiniByAzienda(aziendaId).then(setOrdini);
            setDettaglioOrdineId(ordineId);
          }}
        />
      )}

      {qrShowOrdine && (
        <QrShowModal
          ordineId={qrShowOrdine.id}
          numero={qrShowOrdine.numero || undefined}
          fornitore={(qrShowOrdine as any).fornitore_nome}
          onClose={() => setQrShowOrdine(null)}
        />
      )}

      {ricezioneOrdineId && (
        <RicezioneMerceSheet
          ordineId={ricezioneOrdineId}
          aziendaId={aziendaId}
          onClose={() => setRicezioneOrdineId(null)}
          onCompleted={() => { setRicezioneOrdineId(null); fetchOrdiniByAzienda(aziendaId).then(setOrdini); }}
        />
      )}

      <div onClick={() => setWizardOpen(true)} style={{
        position: "fixed", bottom: 100, right: 20, width: 54, height: 54,
        borderRadius: "50%", background: "#28A0A0", color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 6px 20px rgba(40,160,160,0.5)",
        fontSize: 28, fontWeight: 300, border: "3px solid #1a6b6b",
        cursor: "pointer", zIndex: 50
      }}>+</div>
    </div>
  );
}

function isInRitardo(o: OrdineConCommessa): boolean {
  if (!(o as any).consegna_prevista) return false;
  if (["arrivato", "verificato"].includes(o.stato || "")) return false;
  return new Date((o as any).consegna_prevista) < new Date();
}

interface Gruppo { key: string; label: string; color: string; ordini: OrdineConCommessa[]; }

function buildGruppi(ordini: OrdineConCommessa[], raggruppa: GroupingKey): Gruppo[] {
  if (raggruppa === "stato") {
    const map: Record<string, Gruppo> = {
      ritardo: { key: "ritardo", label: "In Ritardo", color: "#C44545", ordini: [] },
      transito: { key: "transito", label: "In Transito", color: "#E8B05C", ordini: [] },
      inviato: { key: "inviato", label: "Inviati", color: "#3F7AC4", ordini: [] },
      arrivato: { key: "arrivato", label: "Arrivati", color: "#1F5A3F", ordini: [] },
      bozza: { key: "bozza", label: "Bozze", color: "#8893A8", ordini: [] },
    };
    ordini.forEach((o) => {
      if (isInRitardo(o)) { map.ritardo.ordini.push(o); return; }
      const s = o.stato || "bozza";
      if (["arrivato", "verificato"].includes(s)) map.arrivato.ordini.push(o);
      else if (["in_transito", "confermato"].includes(s)) map.transito.ordini.push(o);
      else if (s === "inviato") map.inviato.ordini.push(o);
      else map.bozza.ordini.push(o);
    });
    return Object.values(map).filter((g) => g.ordini.length > 0);
  }

  if (raggruppa === "fornitore") {
    const grouped = new Map<string, OrdineConCommessa[]>();
    ordini.forEach((o) => {
      const k = (o as any).fornitore_nome || "—";
      if (!grouped.has(k)) grouped.set(k, []);
      grouped.get(k)!.push(o);
    });
    return Array.from(grouped.entries()).map(([k, list]) => ({
      key: k, label: k, color: "#1A2A47", ordini: list,
    }));
  }

  if (raggruppa === "commessa") {
    const grouped = new Map<string, OrdineConCommessa[]>();
    ordini.forEach((o) => {
      const k = (o as any).commessa?.code || "—";
      if (!grouped.has(k)) grouped.set(k, []);
      grouped.get(k)!.push(o);
    });
    return Array.from(grouped.entries()).map(([k, list]) => ({
      key: k, label: k, color: "#E8B05C", ordini: list,
    }));
  }

  // data
  const grouped = new Map<string, OrdineConCommessa[]>();
  ordini.forEach((o) => {
    const d = o.created_at ? new Date(o.created_at) : null;
    const k = d ? d.toLocaleDateString("it-IT", { month: "long", year: "numeric" }) : "—";
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(o);
  });
  return Array.from(grouped.entries()).map(([k, list]) => ({
    key: k, label: k, color: "#5A6478", ordini: list,
  }));
}

function formatNum(v: number): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
