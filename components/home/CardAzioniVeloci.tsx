"use client";
// components/home/CardAzioniVeloci.tsx
// 8 bottoni grandi con contatori live DB - design mockup approvato

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  aziendaId: string;
  onProduzione?: () => void;
  onMontaggi?: () => void;
  onMateriali?: () => void;
  onMagazzino?: () => void;
  onClienti?: () => void;
  onAgenda?: () => void;
  onTeam?: () => void;
  onStatistiche?: () => void;
}

const NAVY = "#1E3A5F";
const TEAL = "#28A0A0";
const TEXT = "#0F1F33";
const MUTED = "#5C6B7A";

export default function CardAzioniVeloci(props: Props) {
  const initial = props.aziendaId || (typeof window !== 'undefined' ? (sessionStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro_azienda_id') || '') : '');
  const [resolvedAziendaId, setResolvedAziendaId] = useState(initial);

  useEffect(() => {
    if (resolvedAziendaId) return;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const uid = sess?.session?.user?.id;
        if (!uid) return;
        const { data: ud } = await supabase.from('user_data').select('azienda_id').eq('user_id', uid).limit(1).maybeSingle();
        const az = (ud as any)?.azienda_id;
        if (az) {
          setResolvedAziendaId(az);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('mastro:aziendaId', az);
            localStorage.setItem('mastro:aziendaId', az);
          }
        }
      } catch {}
    })();
  }, [resolvedAziendaId]);

  const [counts, setCounts] = useState({
    produzione: 0, montaggi: 0, materiali: 0, magazzino: 0,
    clienti: 0, agenda: 0, team: 0, fatturato: 0,
  });

  useEffect(() => {
    if (!resolvedAziendaId) return;
    async function load() {
      try {
        const [prodRes, montRes, matRes, magRes, cliRes, agRes, teamRes, fatRes] = await Promise.all([
          supabase.from("commesse").select("id", { count: 'exact', head: true }).eq("azienda_id", resolvedAziendaId).eq("fase", "produzione"),
          supabase.from("montaggi").select("id", { count: 'exact', head: true }).eq("azienda_id", resolvedAziendaId),
          supabase.from("ordini_fornitore").select("id", { count: 'exact', head: true }).eq("azienda_id", resolvedAziendaId).in("stato", ["bozza","inviato","confermato","in_transito"]),
          supabase.from("catalogo_galassia").select("id", { count: 'exact', head: true }),
          supabase.from("contatti").select("id", { count: 'exact', head: true }).eq("azienda_id", resolvedAziendaId),
          supabase.from("events").select("id", { count: 'exact', head: true }).eq("azienda_id", resolvedAziendaId),
          supabase.from("operatori").select("id", { count: 'exact', head: true }).eq("azienda_id", resolvedAziendaId),
          supabase.from("fin_fatture_emesse").select("totale").eq("azienda_id", resolvedAziendaId).gte("created_at", new Date(new Date().setDate(1)).toISOString()),
        ]);
        const fatturato = (fatRes.data || []).reduce((s: number, f: any) => s + Number(f.totale || 0), 0);
        setCounts({
          produzione: prodRes.count || 0,
          montaggi: montRes.count || 0,
          materiali: matRes.count || 0,
          magazzino: magRes.count || 0,
          clienti: cliRes.count || 0,
          agenda: agRes.count || 0,
          team: teamRes.count || 0,
          fatturato: Math.round(fatturato),
        });
      } catch (e) {
        console.warn("[CardAzioniVeloci] count error", e);
      }
    }
    load();
    const ch = supabase.channel(`av-${resolvedAziendaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "commesse" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "ordini_fornitore" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [resolvedAziendaId]);

  const fmtEur = (n: number) => n >= 1000 ? `€${(n/1000).toFixed(1)}k` : `€${n}`;

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: NAVY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>Azioni veloci</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>Tap per aprire modulo</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <Tile primary navy onClick={props.onProduzione} count={counts.produzione} label="Produzione" sub="In lavorazione" icon={<IT color="#fff" />} />
        <Tile primary teal onClick={props.onMontaggi} count={counts.montaggi} label="Montaggi" sub="Pianificati" icon={<IK color="#fff" />} />
        <Tile onClick={props.onMateriali} count={counts.materiali} label="Materiali" sub="Ordini attivi" accent="#D97706" accentBg="#FEF3C7" border icon={<IB color="#92400E" />} />
        <Tile onClick={props.onMagazzino} count={counts.magazzino} label="Magazzino" sub="Articoli a scorta" accent="#6B21A8" accentBg="#F3E8FF" icon={<IA color="#6B21A8" />} />
        <Tile onClick={props.onClienti} count={counts.clienti} label="Clienti" sub="Anagrafica" accent="#9A3412" accentBg="#FFEDD5" icon={<IU color="#9A3412" />} />
        <Tile onClick={props.onAgenda} count={counts.agenda} label="Agenda" sub="Appuntamenti" accent="#155E75" accentBg="#CFFAFE" icon={<IC color="#155E75" />} />
        <Tile onClick={props.onTeam} count={counts.team} label="Team" sub="Operatori" accent="#9F1239" accentBg="#FCE7F3" icon={<IG color="#9F1239" />} />
        <Tile onClick={props.onStatistiche} countText={fmtEur(counts.fatturato)} label="Statistiche" sub="Report mese" accent="#0F6E56" accentBg="#E1F5EE" icon={<IH color="#0F6E56" />} />
      </div>
    </div>
  );
}

function Tile({ primary, navy, teal, onClick, count, countText, label, sub, accent, accentBg, border, icon }: any) {
  const isPrimary = primary;
  const bg = isPrimary ? (navy ? NAVY : TEAL) : '#fff';
  const color = isPrimary ? '#fff' : TEXT;
  const borderStyle = isPrimary ? 'none' : (border ? `1.5px solid ${accent}` : '1.5px solid #E5EAF0');
  const iconBg = isPrimary ? 'rgba(255,255,255,0.15)' : accentBg;
  const badgeBg = isPrimary ? 'rgba(255,255,255,0.2)' : accentBg;
  const badgeColor = isPrimary ? '#fff' : accent;
  const subColor = isPrimary ? 'rgba(255,255,255,0.7)' : MUTED;
  return (
    <button onClick={onClick} disabled={!onClick} style={{
      background: bg, color, border: borderStyle, borderRadius: 14, padding: '14px 12px',
      display: 'flex', flexDirection: 'column', gap: 8, minHeight: 100,
      cursor: onClick ? 'pointer' : 'not-allowed', opacity: onClick ? 1 : 0.5,
      fontFamily: 'inherit', textAlign: 'left' as const, alignItems: 'stretch',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        {(count != null || countText) && (
          <div style={{ background: badgeBg, color: badgeColor, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{countText || count}</div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.15 }}>{label}</div>
        <div style={{ fontSize: 10, color: subColor, marginTop: 2 }}>{sub}</div>
      </div>
    </button>
  );
}

function IT({color}:any){return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;}
function IK({color}:any){return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><rect x={1} y={3} width={15} height={13}/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx={5.5} cy={18.5} r={2.5}/><circle cx={18.5} cy={18.5} r={2.5}/></svg>;}
function IB({color}:any){return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/></svg>;}
function IA({color}:any){return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><polyline points="21 8 21 21 3 21 3 8"/><rect x={1} y={3} width={22} height={5}/><line x1={10} y1={12} x2={14} y2={12}/></svg>;}
function IU({color}:any){return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/></svg>;}
function IC({color}:any){return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></svg>;}
function IG({color}:any){return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;}
function IH({color}:any){return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M3 3v18h18"/><path d="M7 12l4-4 4 4 5-5"/></svg>;}
