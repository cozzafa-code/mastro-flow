"use client";
// components/home/CardAzioniVeloci.tsx
// Tile primary grandi che APRONO i Centri Controllo via callback (no routing!)

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const NAVY = "#1E3A5F";
const TEAL = "#28A0A0";
const AMBER = "#D97706";
const PURPLE = "#6B21A8";
const TEAL_DEEP = "#0F6E56";
const TEXT = "#0F1F33";
const MUTED = "#5C6B7A";

interface Props {
  aziendaId: string;
  onProduzione?: () => void;
  onMontaggi?: () => void;
  onOrdini?: () => void;
  onMagazzino?: () => void;
  onFurgoni?: () => void;
  onFatturazione?: () => void;
  onAbbonamento?: () => void;
  onClienti?: () => void;
  onAgenda?: () => void;
  onTeam?: () => void;
  onStatistiche?: () => void;
}

export default function CardAzioniVeloci(props: Props) {
  const [counts, setCounts] = useState({
    produzione: 0, montaggi: 0, materiali: 0, magazzino: 0,
    fatture: 0, clienti: 0, agenda: 0, team: 0,
  });

  useEffect(() => {
    if (!props.aziendaId) return;
    (async () => {
      try {
        const [prod, mont, mat, art, fat, cli, ag, op] = await Promise.all([
          supabase.from('commesse').select('id', { count: 'exact', head: true }).eq('azienda_id', props.aziendaId).eq('fase', 'produzione'),
          supabase.from('montaggi').select('id', { count: 'exact', head: true }).eq('azienda_id', props.aziendaId),
          supabase.from('ordini_fornitore').select('id', { count: 'exact', head: true }).eq('azienda_id', props.aziendaId).not('stato', 'in', '(verificato,completato,annullato)'),
          supabase.from('articoli_magazzino').select('id', { count: 'exact', head: true }).eq('azienda_id', props.aziendaId).eq('attivo', true),
          supabase.from('fin_fatture_emesse').select('id', { count: 'exact', head: true }).eq('azienda_id', props.aziendaId).gt('residuo', 0).not('stato', 'in', '(pagata,incassata,annullata)'),
          supabase.from('contatti').select('id', { count: 'exact', head: true }).eq('azienda_id', props.aziendaId),
          supabase.from('events').select('id', { count: 'exact', head: true }).eq('azienda_id', props.aziendaId),
          supabase.from('operatori').select('id', { count: 'exact', head: true }).eq('azienda_id', props.aziendaId),
        ]);
        setCounts({
          produzione: prod.count || 0,
          montaggi: mont.count || 0,
          materiali: mat.count || 0,
          magazzino: art.count || 0,
          fatture: fat.count || 0,
          clienti: cli.count || 0,
          agenda: ag.count || 0,
          team: op.count || 0,
        });
      } catch (e) {
        console.warn('[CardAzioniVeloci counts]', e);
      }
    })();
  }, [props.aziendaId]);

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: NAVY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>Azioni veloci</div>
          <div style={{ fontSize: 10, color: MUTED }}>Tap per aprire modulo</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Tile primary bg={NAVY} onClick={props.onProduzione} count={counts.produzione} label="Produzione" sub="In lavorazione" icon={<IT color="#fff" />} />
        <Tile primary bg={TEAL} onClick={props.onMontaggi} count={counts.montaggi} label="Montaggi" sub="Pianificati" icon={<IK color="#fff" />} />
        <Tile primary bg={AMBER} onClick={props.onOrdini} count={counts.materiali} label="Ordini" sub="Catena operativa" icon={<IB color="#fff" />} />
        <Tile primary bg={PURPLE} onClick={props.onMagazzino} count={counts.magazzino} label="Magazzino" sub="Mappa scaffali" icon={<IA color="#fff" />} />

        <Tile onClick={props.onFurgoni} label="Furgoni" sub="Preparazione carichi" accent="#0E7490" accentBg="#CFFAFE" border
          icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#0E7490" strokeWidth={2}>
            <rect x={1} y={3} width={15} height={13}/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
            <circle cx={5.5} cy={18.5} r={2.5}/><circle cx={18.5} cy={18.5} r={2.5}/>
          </svg>} />
        <Tile onClick={props.onFatturazione} count={counts.fatture} label="Contabilità" sub="Finanze · Fatture · IVA" accent={TEAL_DEEP} accentBg="#D1FAE5" border
          icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={TEAL_DEEP} strokeWidth={2}>
            <path d="M4 10h12M4 14h9M19 5a7 7 0 1 0 0 14"/>
          </svg>} />

        {props.onClienti && (
          <Tile onClick={props.onClienti} count={counts.clienti} label="Clienti" sub="Anagrafica" accent="#D97706" accentBg="#FEF3C7" border
            icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx={12} cy={7} r={4}/></svg>} />
        )}
        {props.onAgenda && (
          <Tile onClick={props.onAgenda} count={counts.agenda} label="Agenda" sub="Appuntamenti" accent="#1E40AF" accentBg="#DBEAFE" border
            icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></svg>} />
        )}
        {props.onTeam && (
          <Tile onClick={props.onTeam} count={counts.team} label="Team" sub="Squadre operative" accent="#DB2777" accentBg="#FCE7F3" border
            icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
        )}
        {props.onStatistiche && (
          <Tile onClick={props.onStatistiche} label="Statistiche" sub="KPI azienda" accent={TEAL_DEEP} accentBg="#D1FAE5" border
            icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={TEAL_DEEP} strokeWidth={2}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} />
        )}
        {props.onAbbonamento && (
          <Tile onClick={props.onAbbonamento} label="Abbonamento" sub="Piano + add-on" accent="#1E40AF" accentBg="#DBEAFE" border
            icon={<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth={2}><rect x={1} y={4} width={22} height={16} rx={2}/><line x1={1} y1={10} x2={23} y2={10}/></svg>} />
        )}
      </div>
    </div>
  );
}

function IT({ color }: any) {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>;
}
function IK({ color }: any) {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <rect x={2} y={4} width={20} height={16} rx={2}/>
    <path d="M2 8h20"/>
    <path d="M6 4v4"/><path d="M10 4v4"/><path d="M14 4v4"/><path d="M18 4v4"/>
  </svg>;
}
function IB({ color }: any) {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1={12} y1={22.08} x2={12} y2={12}/>
  </svg>;
}
function IA({ color }: any) {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>;
}

function Tile({ primary, bg, onClick, count, countText, label, sub, accent, accentBg, border, icon }: any) {
  const isPrimary = primary;
  const background = isPrimary ? (bg || TEAL) : '#fff';
  const color = isPrimary ? '#fff' : TEXT;
  const borderStyle = isPrimary ? 'none' : (border ? `1.5px solid ${accent}` : '1.5px solid #E5EAF0');
  const iconBg = isPrimary ? 'rgba(255,255,255,0.18)' : accentBg;
  const badgeBg = isPrimary ? 'rgba(255,255,255,0.22)' : accentBg;
  const badgeColor = isPrimary ? '#fff' : accent;
  const subColor = isPrimary ? 'rgba(255,255,255,0.75)' : MUTED;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onClick) onClick();
      }}
      disabled={!onClick}
      style={{
        background, color, border: borderStyle, borderRadius: 14, padding: '14px 12px',
        display: 'flex', flexDirection: 'column', gap: 8, minHeight: 100,
        cursor: onClick ? 'pointer' : 'not-allowed', opacity: onClick ? 1 : 0.5,
        fontFamily: 'inherit', textAlign: 'left' as const, alignItems: 'stretch',
        WebkitTapHighlightColor: 'transparent',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        {(count != null || countText) && (count !== 0 || isPrimary) && (
          <div style={{ background: badgeBg, color: badgeColor, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
            {countText || count}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.15 }}>{label}</div>
        <div style={{ fontSize: 10, color: subColor, marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}