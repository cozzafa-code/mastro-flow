"use client";
// components/centro/TabImmobili.tsx
// BLOCCO 3 - Tab immobili cliente + drawer dettaglio + storico tecnico

import React, { useState } from "react";
import { useImmobiliCliente, useInfissiImmobile, type Immobile, type InfissoInstallato } from "../../hooks/useImmobili";
import { uploadFile } from "../../lib/uploadStorage";
import { supabase } from "@/lib/supabase";
import FotoGrid from "../FotoGrid";
import { IcoLayout, IcoCamera, IcoUpload, IcoRefresh, IcoMap } from "../IconLib";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

const TIPO_IMMOBILE: Record<string, { icon: string; label: string; col: string }> = {
  villa:        { icon: '🏡', label: 'Villa',        col: TEAL_DEEP },
  casa:         { icon: '🏠', label: 'Casa',         col: TEAL },
  appartamento: { icon: '🏢', label: 'Appartamento', col: BLUE },
  ufficio:      { icon: '🏢', label: 'Ufficio',      col: PURPLE },
  negozio:      { icon: '🏪', label: 'Negozio',      col: AMBER },
  capannone:    { icon: '🏭', label: 'Capannone',    col: '#6B21A8' },
  altro:        { icon: '🏚️',  label: 'Altro',        col: MUTED },
};

const TIPO_INFISSO: Record<string, { icon: string; col: string }> = {
  finestra:   { icon: '🪟', col: BLUE },
  porta:      { icon: '🚪', col: '#7E22CE' },
  scorrevole: { icon: '↔️',  col: TEAL },
  persiana:   { icon: '🗂️',  col: AMBER },
};

interface Props {
  clienteId: string;
  onApriCommessa?: (cmId: string) => void;
}

export default function TabImmobili({ clienteId, onApriCommessa }: Props) {
  const { immobili, loading } = useImmobiliCliente(clienteId);
  const [immobileAperto, setImmobileAperto] = useState<Immobile | null>(null);

  if (loading) return <div style={{ padding: 30, textAlign: 'center' as const, color: MUTED }}>Caricamento immobili...</div>;
  
  if (immobili.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center' as const }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🏠</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Nessun immobile registrato</div>
        <div style={{ fontSize: 11, color: MUTED, marginBottom: 16 }}>Aggiungi il primo immobile per costruire lo storico tecnico</div>
        <button style={{ padding: '10px 18px', background: TEAL_DEEP, color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          + Aggiungi immobile
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
        🏠 {immobili.length} IMMOBIL{immobili.length === 1 ? 'E' : 'I'} REGISTRAT{immobili.length === 1 ? 'O' : 'I'}
      </div>
      {immobili.map(i => <CardImmobile key={i.id} i={i} onClick={() => setImmobileAperto(i)} />)}

      {immobileAperto && (
        <DrawerImmobile
          immobile={immobileAperto}
          onClose={() => setImmobileAperto(null)}
          onApriCommessa={(cmId) => { setImmobileAperto(null); onApriCommessa?.(cmId); }}
        />
      )}
    </>
  );
}

// =============== CARD IMMOBILE ===============
function CardImmobile({ i, onClick }: { i: Immobile; onClick: () => void }) {
  const meta = TIPO_IMMOBILE[i.tipo] || TIPO_IMMOBILE.altro;

  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `5px solid ${meta.col}`, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {i.foto_url ? (
          <img src={i.foto_url} alt={i.nome} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover' as const }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 10, background: `linear-gradient(135deg, ${meta.col}, ${meta.col}aa)`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>
            {meta.icon}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>{i.nome}</span>
            {i.primario && <span style={{ background: AMBER, color: '#fff', padding: '2px 7px', borderRadius: 4, fontSize: 8, fontWeight: 800 }}>⭐ PRIMARIO</span>}
          </div>
          <div style={{ display: 'flex', gap: 5, marginBottom: 4, flexWrap: 'wrap' as const }}>
            <span style={{ background: meta.col + '22', color: meta.col, padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>{meta.label.toUpperCase()}</span>
            {i.anno_costruzione && <span style={{ background: '#F1F4F7', color: MUTED, padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{i.anno_costruzione}</span>}
          </div>
          <div style={{ fontSize: 10, color: MUTED }}>📍 {i.indirizzo}, {i.citta} ({i.provincia})</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 10, color: MUTED }}>
            {i.mq_totali && <span>📐 <strong style={{ color: TEXT }}>{i.mq_totali}m²</strong></span>}
            <span>🏗️ <strong style={{ color: TEXT }}>{i.num_piani}p</strong></span>
            <span style={{ marginLeft: 'auto' }}>🪟 <strong style={{ color: TEAL_DEEP }}>{i.num_infissi || 0} infiss{(i.num_infissi || 0) === 1 ? 'o' : 'i'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============== DRAWER IMMOBILE ===============
function DrawerImmobile({ immobile, onClose, onApriCommessa }: any) {
  const { infissi, modifiche, loading } = useInfissiImmobile(immobile.id);
  const [tab, setTab] = useState<'infissi' | 'planimetria' | 'modifiche'>('infissi');
  const meta = TIPO_IMMOBILE[immobile.tipo] || TIPO_IMMOBILE.altro;

  // Raggruppa per piano
  const byPiano: Record<string, InfissoInstallato[]> = {};
  infissi.forEach(i => {
    const k = i.piano || 'Senza piano';
    if (!byPiano[k]) byPiano[k] = [];
    byPiano[k].push(i);
  });

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9950, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 600, maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(180deg, ${meta.col}, ${meta.col}cc)`, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          {immobile.foto_url ? (
            <img src={immobile.foto_url} alt="" style={{ width: 60, height: 60, borderRadius: 12, objectFit: 'cover' as const, border: '2px solid rgba(255,255,255,0.3)' }} />
          ) : (
            <div style={{ width: 60, height: 60, borderRadius: 12, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{meta.icon}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>IMMOBILE</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{immobile.nome}</div>
            <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>{immobile.indirizzo}, {immobile.citta}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>×</button>
        </div>

        {/* KPI */}
        <div style={{ background: 'rgba(255,255,255,0.5)', padding: 10, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          <StatBox icon="📐" label="MQ" val={immobile.mq_totali || '—'} col={TEAL_DEEP} />
          <StatBox icon="🏗️" label="PIANI" val={immobile.num_piani} col={NAVY} />
          <StatBox icon="🪟" label="INFISSI" val={infissi.reduce((s, i) => s + Number(i.pezzi || 1), 0)} col={BLUE} />
          <StatBox icon="📅" label="ANNO" val={immobile.anno_costruzione || '—'} col={PURPLE} />
        </div>

        {/* Tab switcher */}
        <div style={{ background: '#fff', margin: '8px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2 }}>
          <TabBtn active={tab === 'infissi'} onClick={() => setTab('infissi')} label="🪟 Infissi" badge={infissi.length} />
          <TabBtn active={tab === 'planimetria'} onClick={() => setTab('planimetria')} label="📐 Planimetria" />
          <TabBtn active={tab === 'modifiche'} onClick={() => setTab('modifiche')} label="🔧 Modifiche" badge={modifiche.length} />
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 14, overflowY: 'auto' as const, minHeight: 200 }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center' as const, color: MUTED }}>Caricamento...</div>
          ) : tab === 'infissi' ? (
            infissi.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>
                Nessun infisso installato registrato
              </div>
            ) : Object.entries(byPiano).map(([piano, lista]) => (
              <div key={piano} style={{ marginBottom: 14 }}>
                <div style={{ background: NAVY, color: '#fff', padding: '7px 12px', borderRadius: '8px 8px 0 0', fontSize: 11, fontWeight: 800, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🏗️</span>{piano.toUpperCase()}
                  <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', padding: '2px 7px', borderRadius: 3, fontSize: 10 }}>{lista.length}</span>
                </div>
                {lista.map(inf => <CardInfisso key={inf.id} inf={inf} onApriCommessa={onApriCommessa} />)}
              </div>
            ))
          ) : tab === 'planimetria' ? (
            <ViewPlanimetria immobile={immobile} />
          ) : (
            <ViewModifiche modifiche={modifiche} infissi={infissi} />
          )}
        </div>
      </div>
    </div>
  );
}

// =============== CARD INFISSO STORICO ===============
function CardInfisso({ inf, onApriCommessa }: { inf: InfissoInstallato; onApriCommessa?: any }) {
  const tipoMeta = TIPO_INFISSO[inf.tipo || ''] || { icon: '📐', col: MUTED };
  const inGaranzia = inf.garanzia_fino && new Date(inf.garanzia_fino) > new Date();
  const giorniDallaInstall = Math.floor((Date.now() - new Date(inf.data_installazione).getTime()) / 86400000);
  const anniInstall = (giorniDallaInstall / 365).toFixed(1);

  return (
    <div style={{ background: '#fff', padding: 12, borderRadius: '0 0 8px 8px', marginBottom: 0, borderBottom: '1px solid #F1F4F7', borderLeft: `3px solid ${tipoMeta.col}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: tipoMeta.col + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{tipoMeta.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{inf.nome_vano || inf.stanza}</span>
            <span style={{ background: tipoMeta.col + '22', color: tipoMeta.col, padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{inf.tipo?.toUpperCase()}</span>
            {inf.pezzi > 1 && <span style={{ background: '#F1F4F7', color: TEXT, padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>×{inf.pezzi}</span>}
            {inGaranzia && <span style={{ background: '#D1FAE5', color: TEAL_DEEP, padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>🟢 IN GARANZIA</span>}
            {inf.modificato && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '1px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>🔧 MODIFICATO</span>}
          </div>
          <div style={{ fontSize: 11, color: MUTED }}>
            {inf.sistema} {inf.sottosistema && `· ${inf.sottosistema}`}
            {inf.larghezza_mm && ` · ${inf.larghezza_mm}×${inf.altezza_mm}mm`}
          </div>
        </div>
      </div>

      {/* Specifiche tecniche */}
      <div style={{ background: '#F8FAFA', borderRadius: 7, padding: 9, fontSize: 10 }}>
        <SpecRow label="🎨 COLORE" val={`${inf.colore_int}${inf.ral_int ? ` (RAL ${inf.ral_int})` : ''}${inf.bicolore ? ` int / ${inf.colore_est} est` : ''}`} />
        {inf.marca_profilo && <SpecRow label="🔧 PROFILO" val={`${inf.marca_profilo} ${inf.serie_profilo || ''}`} />}
        {inf.vetro_tipo && <SpecRow label="🪟 VETRO" val={`${inf.vetro_tipo}${inf.vetro_uw ? ` · Uw ${inf.vetro_uw}` : ''}${inf.vetro_ug ? ` · Ug ${inf.vetro_ug}` : ''}`} />}
        {inf.ferramenta_marca && <SpecRow label="⚙️ FERRAM." val={`${inf.ferramenta_marca} ${inf.ferramenta_modello || ''}`} />}
        {inf.motore_marca && <SpecRow label="⚡ MOTORE" val={`${inf.motore_marca} ${inf.motore_modello || ''}`} />}
        <div style={{ display: 'flex', gap: 8, marginTop: 5, flexWrap: 'wrap' as const }}>
          {inf.cassonetto && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>📦 Cassonetto</span>}
          {inf.persiana && <span style={{ background: '#F3E8FF', color: PURPLE, padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>🗂️ Persiana</span>}
          {inf.zanzariera && <span style={{ background: '#E1F5EE', color: TEAL_DEEP, padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>🦟 Zanzariera</span>}
        </div>
      </div>

      {/* Data + commessa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 10, color: MUTED, flexWrap: 'wrap' as const }}>
        <span>📅 Installato {new Date(inf.data_installazione).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span>· <strong style={{ color: TEXT }}>{anniInstall} anni fa</strong></span>
        {inf.garanzia_fino && (
          <span style={{ color: inGaranzia ? TEAL_DEEP : MUTED, fontWeight: 700 }}>
            🛡️ {inGaranzia ? `Garanzia fino ${new Date(inf.garanzia_fino).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'Garanzia scaduta'}
          </span>
        )}
        {inf.commessa_code && (
          <button onClick={() => onApriCommessa?.(inf.commessa_id)} style={{ marginLeft: 'auto', background: NAVY, color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
            {inf.commessa_code} →
          </button>
        )}
      </div>
    </div>
  );
}

// =============== VIEW PLANIMETRIA ===============
function ViewPlanimetria({ immobile }: any) {
  const [uploading, setUploading] = React.useState(false);
  const [planimetria, setPlanimetria] = React.useState<string | null>(immobile.planimetria_url);
  const [galleria, setGalleria] = React.useState<string[]>(Array.isArray(immobile.galleria) ? immobile.galleria : []);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handlePlanim(file: File | null) {
    if (!file) return;
    setUploading(true);
    const r = await uploadFile(`immobili/${immobile.id}/planimetria`, file);
    if (r) {
      await supabase.from('clienti_immobili').update({ planimetria_url: r.url }).eq('id', immobile.id);
      setPlanimetria(r.url);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleGalleria(urls: string[]) {
    setGalleria(urls);
    await supabase.from('clienti_immobili').update({ galleria: urls }).eq('id', immobile.id);
  }

  return (
    <>
      {/* PLANIMETRIA */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <IcoLayout size={11} color={MUTED} />PLANIMETRIA
        </div>
        {planimetria ? (
          <>
            <img src={planimetria} alt="Planimetria" style={{ width: '100%', borderRadius: 8, marginBottom: 8, cursor: 'pointer', border: '1px solid #E5EAF0' }} onClick={() => window.open(planimetria)} />
            <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{ width: '100%', padding: '9px 12px', background: '#F1F4F7', color: TEXT, border: 'none', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <IcoRefresh size={13} color={TEXT} />
              {uploading ? 'Upload...' : 'Sostituisci planimetria'}
            </button>
          </>
        ) : (
          <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{ width: '100%', padding: '28px 12px', background: '#F8FAFA', color: TEAL_DEEP, border: `2px dashed ${TEAL}`, borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: uploading ? 'wait' : 'pointer', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8 }}>
            <IcoLayout size={32} color={TEAL_DEEP} />
            <span>{uploading ? 'Upload in corso...' : 'Carica planimetria'}</span>
            <span style={{ fontSize: 9, color: MUTED, fontWeight: 600 }}>JPG, PNG o PDF</span>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*,application/pdf" onChange={e => handlePlanim(e.target.files?.[0] || null)} style={{ display: 'none' }} />
      </div>

      {/* GALLERIA FOTO */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 12 }}>
        <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <IcoCamera size={11} color={MUTED} />GALLERIA FOTO IMMOBILE · {galleria.length}
        </div>
        <FotoGrid foto={galleria} onChange={handleGalleria} uploadFolder={`immobili/${immobile.id}/galleria`} size="lg" maxFoto={20} />
      </div>
    </>
  );
}

// =============== VIEW MODIFICHE STORICHE ===============
function ViewModifiche({ modifiche, infissi }: any) {
  if (modifiche.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center' as const }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🔧</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Nessuna modifica registrata</div>
        <div style={{ fontSize: 11, color: MUTED }}>Riparazioni, regolazioni o sostituzioni appariranno qui</div>
      </div>
    );
  }
  const infMap: Record<string, InfissoInstallato> = {};
  infissi.forEach((i: InfissoInstallato) => { infMap[i.id] = i; });

  const tipiMeta: Record<string, { icon: string; col: string; bg: string }> = {
    sostituzione: { icon: '🔄', col: AMBER, bg: '#FEF3C7' },
    riparazione:  { icon: '🔧', col: RED,   bg: '#FEE2E2' },
    manutenzione: { icon: '🛠️',  col: BLUE,  bg: '#DBEAFE' },
    regolazione:  { icon: '⚙️',  col: TEAL,  bg: '#E1F5EE' },
  };

  return (
    <>
      {modifiche.map((m: any) => {
        const inf = infMap[m.infisso_id];
        const tipo = tipiMeta[m.tipo_modifica] || { icon: '📝', col: MUTED, bg: '#F1F4F7' };
        return (
          <div key={m.id} style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 6, borderLeft: `4px solid ${tipo.col}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: tipo.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{tipo.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' as const }}>
                  <span style={{ background: tipo.bg, color: tipo.col, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{m.tipo_modifica.toUpperCase()}</span>
                  {inf && <span style={{ background: '#F1F4F7', color: TEXT, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>{inf.nome_vano || inf.stanza}</span>}
                </div>
                <div style={{ fontSize: 12, color: TEXT, lineHeight: 1.4 }}>{m.descrizione}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 5, display: 'flex', gap: 10 }}>
                  <span>📅 {new Date(m.data_modifica).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  {m.autore && <span>· {m.autore}</span>}
                  {m.costo && <span style={{ marginLeft: 'auto', color: TEXT, fontWeight: 700 }}>€{Number(m.costo).toFixed(2)}</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// =============== HELPERS ===============
function SpecRow({ label, val }: any) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 2, fontSize: 10 }}>
      <span style={{ color: MUTED, fontWeight: 700, minWidth: 70, letterSpacing: 0.3 }}>{label}</span>
      <span style={{ color: TEXT, fontWeight: 600, flex: 1 }}>{val}</span>
    </div>
  );
}

function StatBox({ icon, label, val, col }: any) {
  return (
    <div style={{ background: '#fff', padding: '8px 6px', borderRadius: 7, textAlign: 'center' as const, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 12, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: col, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 7, color: MUTED, fontWeight: 700, letterSpacing: 0.4, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, label, badge }: any) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '9px 0', fontSize: 11, fontWeight: 700,
      color: active ? '#fff' : MUTED, background: active ? NAVY : 'transparent',
      border: 'none', borderRadius: 7, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    }}>
      {label}
      {badge !== undefined && badge > 0 && (
        <span style={{ background: active ? 'rgba(255,255,255,0.25)' : '#F1F4F7', color: active ? '#fff' : TEXT, padding: '2px 5px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{badge}</span>
      )}
    </button>
  );
}
