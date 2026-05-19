// components/home-mobile/HomeWidgets.tsx
// 10 widget operativi con navigazioni cablate. v3 swipe + chip.

'use client'

import React, { useState } from 'react'
import {
  T, btnBaseStyle, numStyle, Card, CardHeader, Kpi, Importo,
  Pill, PillStatus, Avatar, BtnPrimary, BtnSecondary, BtnFull,
  Chip, SwipeTrack, SwipeCard,
} from './HomeUI'
import {
  IconAlert, IconBell, IconTask, IconFolder, IconPin,
  IconCamera, IconPen, IconDoc,
} from './HomeIcons'
import type {
  AttivitaOggi, GiornoCarico, CommessaCritica, EventoAgenda, GiornoAgenda,
  Operatore, OperatoreFermo, OrdineProduzione, Problema, SoldiVeloce,
} from '../../hooks/useHomeMobile'
import { iniziali, caricoColor } from './homeUtils'

// ───────── helpers di stile interni ─────────

const titleStyle: React.CSSProperties = {
  fontSize: 16, fontWeight: 600, color: T.text,
  letterSpacing: '-0.2px', lineHeight: 1.3,
  marginBottom: 6, paddingRight: 90,
  WebkitFontSmoothing: 'antialiased',
}

const metaStyle: React.CSSProperties = {
  fontSize: 12, color: T.muted, fontWeight: 400,
  marginBottom: 10, lineHeight: 1.5,
}

const descStyle: React.CSSProperties = {
  fontSize: 13, color: T.text, lineHeight: 1.55, fontWeight: 400,
  background: '#FFF', border: `1px solid ${T.graySoft}`,
  borderRadius: 8, padding: '11px 13px', margin: '8px 0',
}

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 10,
  fontSize: 12, color: T.muted, fontWeight: 400,
  margin: '5px 0', lineHeight: 1.4,
}

const rowLabStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: T.muted,
  letterSpacing: 1, textTransform: 'uppercase' as const,
  minWidth: 64, paddingTop: 1,
}

const rowValStyle: React.CSSProperties = {
  flex: 1, minWidth: 0, color: T.text,
}

const actionsStyle: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 14,
  marginTop: 'auto', paddingTop: 12,
  borderTop: `1px solid ${T.graySoft}`,
}

const actStyle = (variant: 'primary' | 'muted' | 'alert' | 'warn' = 'primary'): React.CSSProperties => {
  const color =
    variant === 'muted' ? T.muted :
    variant === 'alert' ? T.numRed :
    variant === 'warn' ? T.numAmber : T.acc
  return {
    background: 'none', border: 'none', padding: 0,
    fontSize: 12, fontWeight: variant === 'muted' ? 500 : 600,
    color, cursor: 'pointer',
    display: 'inline-flex' as const, alignItems: 'center', gap: 4,
    fontFamily: 'inherit', letterSpacing: 0.2,
  }
}

const arrowStyle: React.CSSProperties = {
  fontSize: 14, lineHeight: 1, fontWeight: 700,
}

// ───────── 1. OGGI OPERATIVO ─────────

export function CardOggiOperativo({
  lavori, task, problemi, attivita, onVedi,
}: {
  lavori: number; task: number; problemi: number; attivita: AttivitaOggi[]; onVedi?: () => void
}) {
  return (
    <Card>
      <CardHeader index={1} title="OGGI OPERATIVO" link="vedi tutte" indexBg={T.acc} onLink={onVedi} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <Kpi value={lavori} label="lavori" />
        <Kpi value={task} label="task" />
        <Kpi value={problemi} label="problema" statusColor={problemi > 0 ? T.numRed : undefined} />
      </div>
      <SwipeTrack
        items={attivita}
        emptyText="Nessuna attivita pianificata oggi"
        renderItem={(a: AttivitaOggi) => (
          <SwipeCard>
            <div style={{ position: 'absolute', top: 14, right: 14 }}>
              <Chip text={`${a.ora} · oggi`} kind={a.azione_secondaria === 'COMPLETA' ? 'live' : 'neutral'} />
            </div>
            <div style={titleStyle}>{a.titolo}</div>
            <div style={metaStyle}>{a.indirizzo || '—'}</div>
            <div style={actionsStyle}>
              <button onClick={onVedi} style={actStyle('primary')}>
                {a.azione_primaria === 'CHIAMA' ? 'Chiama' : 'Apri'} <span style={arrowStyle}>›</span>
              </button>
              <button onClick={onVedi} style={actStyle('muted')}>
                {a.azione_secondaria === 'COMPLETA' ? 'Completa' : a.azione_secondaria === 'SPOSTA' ? 'Sposta' : 'Fatto'}
              </button>
            </div>
          </SwipeCard>
        )}
      />
      <BtnFull label="VAI A TUTTE LE ATTIVITA" onClick={onVedi} />
    </Card>
  )
}

// ───────── 2. TEAM LIVE ─────────

export function CardTeamLive({
  operatori, attivi, problemi, onApri,
}: { operatori: Operatore[]; attivi: number; problemi: number; onApri?: () => void }) {
  return (
    <Card>
      <CardHeader index={2} title="TEAM LIVE" link="vedi tutto" indexBg={T.acc} onLink={onApri} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Pill bg={T.tealSoft} fg={T.numTeal} dot={T.numTeal} text={`${attivi} attivi`} />
        {problemi > 0 && <Pill bg={T.redSoft} fg={T.numRed} dot={T.numRed} text={`${problemi} problema`} />}
      </div>
      <SwipeTrack
        items={operatori}
        emptyText="Nessun operatore attivo"
        renderItem={(o: Operatore) => <RigaOperatore o={o} onApri={onApri} />}
      />
      <BtnFull label="APRI TEAM COMPLETO" onClick={onApri} />
    </Card>
  )
}

function RigaOperatore({ o, onApri }: { o: Operatore; onApri?: () => void }) {
  const chipKind: 'live' | 'warn' | 'alert' | 'info' =
    o.stato === 'pausa' ? 'warn' :
    o.stato === 'problema' ? 'alert' :
    o.stato === 'viaggio' ? 'info' : 'live'

  const chipText =
    o.stato === 'pausa' ? `Pausa · ${o.tempo}` :
    o.stato === 'problema' ? `Problema · ${o.tempo}` :
    o.stato === 'viaggio' ? `Viaggio · ${o.tempo}` :
    `Live · ${o.tempo}`

  const dotBg =
    o.stato === 'pausa' ? '#F59E0B' :
    o.stato === 'problema' ? '#EF4444' :
    o.stato === 'viaggio' ? '#3B82F6' : '#10B981'

  return (
    <SwipeCard>
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <Chip text={chipText} kind={chipKind} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, paddingRight: 100 }}>
        <div style={{ position: 'relative' }}>
          <Avatar text={iniziali(o.nome)} bg={T.acc} size={42} />
          <span style={{
            position: 'absolute', bottom: -1, right: -2,
            width: 11, height: 11, borderRadius: '50%',
            background: dotBg, border: '2px solid #F8FAFC',
          }}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text, lineHeight: 1.2, letterSpacing: '-0.2px' }}>{o.nome}</div>
          <div style={{ fontSize: 11, color: T.muted, fontWeight: 500, marginTop: 2 }}>{o.attivita || 'Operatore'}</div>
        </div>
      </div>
      <div style={rowStyle}>
        <span style={rowLabStyle}>Tempo</span>
        <div style={rowValStyle}>{o.tempo || '—'}</div>
      </div>
      {o.telefono && (
        <div style={rowStyle}>
          <span style={rowLabStyle}>Telefono</span>
          <div style={rowValStyle}>{o.telefono}</div>
        </div>
      )}
      <div style={actionsStyle}>
        <button onClick={onApri} style={actStyle('primary')}>Apri scheda <span style={arrowStyle}>›</span></button>
        {o.telefono && (
          <button onClick={() => window.open('tel:' + o.telefono)} style={actStyle('muted')}>Chiama</button>
        )}
        {o.stato === 'pausa' && (
          <button onClick={onApri} style={actStyle('warn')}>Sollecita</button>
        )}
      </div>
    </SwipeCard>
  )
}

// ───────── 3. COMMESSE CRITICHE ─────────

export function CardCommesseCritiche({
  commesse, onApri,
}: { commesse: CommessaCritica[]; onApri?: (id: string) => void }) {
  return (
    <Card>
      <CardHeader index={3} title="COMMESSE CRITICHE" link="vedi tutte" indexBg={T.numRed} onLink={() => onApri && onApri('')} />
      <SwipeTrack
        items={commesse}
        emptyText="Nessuna commessa critica"
        renderItem={(c: CommessaCritica) => {
          const kind: 'alert' | 'warn' = c.livello === 'ritardo' ? 'alert' : 'warn'
          const azioneLabel =
            c.azione === 'RISOLVI' ? 'Risolvi' :
            c.azione === 'SBLOCCA' ? 'Sblocca' : 'Gestisci'
          const azioneVar: 'alert' | 'warn' | 'primary' =
            c.azione === 'RISOLVI' ? 'alert' :
            c.azione === 'GESTISCI' ? 'warn' : 'primary'
          return (
            <SwipeCard>
              <div style={{ position: 'absolute', top: 14, right: 14 }}>
                <Chip text={c.motivo} kind={kind} />
              </div>
              <div style={titleStyle}>{c.titolo}</div>
              <div style={metaStyle}><b style={{ color: T.text, fontWeight: 600 }}>{c.cliente}</b></div>
              <div style={rowStyle}>
                <span style={rowLabStyle}>Stato</span>
                <div style={rowValStyle}>{c.motivo}</div>
              </div>
              <div style={actionsStyle}>
                <button onClick={() => onApri && onApri(c.id)} style={actStyle(azioneVar)}>
                  {azioneLabel} <span style={arrowStyle}>›</span>
                </button>
                <button onClick={() => onApri && onApri(c.id)} style={actStyle('muted')}>Apri commessa</button>
              </div>
            </SwipeCard>
          )
        }}
      />
    </Card>
  )
}

// ───────── 4. PROBLEMI ─────────

export function CardProblemi({
  problemi, onApri,
}: { problemi: Problema[]; onApri?: () => void }) {
  return (
    <Card>
      <CardHeader index={4} title="PROBLEMI" link="vedi tutti" indexBg={T.numRed} onLink={onApri} />
      <SwipeTrack
        items={problemi}
        emptyText="Nessun problema aperto"
        renderItem={(p: Problema) => (
          <SwipeCard>
            <div style={{ position: 'absolute', top: 14, right: 14 }}>
              <Chip text="Aperto" kind="alert" />
            </div>
            <div style={titleStyle}>{p.titolo}</div>
            <div style={metaStyle}>
              {p.contesto && <>Cliente <b style={{ color: T.text, fontWeight: 600 }}>{p.contesto}</b></>}
            </div>
            {p.contesto && (
              <div style={rowStyle}>
                <span style={rowLabStyle}>Contesto</span>
                <div style={rowValStyle}>{p.contesto}</div>
              </div>
            )}
            <div style={actionsStyle}>
              <button onClick={onApri} style={actStyle('alert')}>
                {p.azione === 'ASSEGNA' ? 'Assegna' : p.azione === 'APRI' ? 'Apri' : 'Risolvi'} <span style={arrowStyle}>›</span>
              </button>
              <button onClick={onApri} style={actStyle('muted')}>Vedi dettagli</button>
            </div>
          </SwipeCard>
        )}
      />
    </Card>
  )
}

// ───────── 5. AGENDA LIVE ─────────

export function CardAgendaLive({
  giorni, eventi, onApri,
}: { giorni: GiornoAgenda[]; eventi: EventoAgenda[]; onApri?: () => void }) {
  const [selezionato, setSelezionato] = useState<string>(
    giorni.find(g => g.oggi)?.data ?? giorni[0]?.data ?? ''
  )
  const eventiGiorno = eventi.filter(e => e.data === selezionato)

  return (
    <Card>
      <CardHeader index={5} title="AGENDA LIVE" link="vedi agenda" indexBg={T.acc} onLink={onApri} />
      <StripGiorni giorni={giorni} selezionato={selezionato} onSelect={setSelezionato} />
      <SwipeTrack
        items={eventiGiorno}
        emptyText="Nessun evento in questo giorno"
        renderItem={(e: EventoAgenda) => (
          <SwipeCard>
            <div style={{ position: 'absolute', top: 14, right: 14 }}>
              <Chip text={e.ora} kind="neutral" />
            </div>
            <div style={titleStyle}>{e.titolo}</div>
            <div style={metaStyle}>
              {e.cliente && <b style={{ color: T.text, fontWeight: 600 }}>{e.cliente}</b>}
              {e.cliente && e.indirizzo && ' · '}
              {e.indirizzo}
            </div>
            <div style={actionsStyle}>
              <button onClick={onApri} style={actStyle('primary')}>Vai <span style={arrowStyle}>›</span></button>
              <button onClick={onApri} style={actStyle('muted')}>Sposta</button>
            </div>
          </SwipeCard>
        )}
      />
      <BtnFull label="VAI ALL AGENDA COMPLETA" onClick={onApri} />
    </Card>
  )
}

function StripGiorni({
  giorni, selezionato, onSelect,
}: { giorni: GiornoAgenda[]; selezionato: string; onSelect: (d: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12, scrollbarWidth: 'none' as const }}>
      {giorni.map(g => {
        const sel = g.data === selezionato
        const evCol = g.count >= 4 ? T.numAmber : g.count > 0 ? T.numTeal : T.muted
        return (
          <button
            key={g.data}
            onClick={() => onSelect(g.data)}
            style={{
              minWidth: 50, textAlign: 'center', padding: '8px 6px', borderRadius: 10,
              background: sel ? T.acc : '#FFF',
              border: `1px solid ${sel ? T.acc : T.bdr}`,
              cursor: 'pointer',
              boxShadow: sel ? '0 2px 8px rgba(30,58,95,0.25)' : 'none',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 9, color: sel ? T.tealSoft : T.muted, textTransform: 'uppercase', fontWeight: sel ? 700 : 600 }}>{g.label_giorno}</div>
            <div style={{ ...numStyle(18, sel ? '#FFF' : T.text), fontWeight: 700, marginTop: 2 }}>{g.numero}</div>
            <div style={{ fontSize: 8, color: sel ? T.tealSoft : evCol, marginTop: 2, fontWeight: 600 }}>
              {g.count > 0 ? `${g.count} ev` : '·'}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ───────── 6. PRODUZIONE ─────────

export function CardProduzione({
  ordini, inCorso, fermi, onApri,
}: { ordini: OrdineProduzione[]; inCorso: number; fermi: number; onApri?: () => void }) {
  return (
    <Card>
      <CardHeader index={6} title="PRODUZIONE" link="vedi produzione" indexBg={T.numAmber} onLink={onApri} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <Kpi value={inCorso} label="in corso" statusColor={T.numTeal} icon="check" />
        <Kpi value={fermi} label="fermo" statusColor={fermi > 0 ? T.numRed : undefined} icon="clock" />
      </div>
      <SwipeTrack
        items={ordini}
        emptyText="Nessun ordine in produzione"
        renderItem={(o: OrdineProduzione) => <RigaOrdine o={o} onApri={onApri} />}
      />
      <BtnFull label="VAI ALLA PRODUZIONE" onClick={onApri} />
    </Card>
  )
}

function RigaOrdine({ o, onApri }: { o: OrdineProduzione; onApri?: () => void }) {
  const chipKind: 'live' | 'warn' | 'alert' =
    o.stato === 'FERMO' ? 'alert' :
    o.stato === 'IN_ATTESA' ? 'warn' : 'live'
  const chipText =
    o.stato === 'FERMO' ? 'Fermo' :
    o.stato === 'IN_ATTESA' ? 'In attesa' : 'In lavorazione'
  const azioneVar: 'alert' | 'warn' | 'primary' =
    o.stato === 'FERMO' ? 'alert' :
    o.stato === 'IN_ATTESA' ? 'warn' : 'primary'
  const azioneLabel =
    o.stato === 'FERMO' ? 'Sblocca' :
    o.stato === 'IN_ATTESA' ? 'Verifica' : 'Apri'
  const p = o.percentuale ?? 0
  return (
    <SwipeCard>
      <div style={{ position: 'absolute', top: 14, right: 14 }}>
        <Chip text={chipText} kind={chipKind} />
      </div>
      <div style={titleStyle}>Ordine {o.codice}</div>
      <div style={metaStyle}>{o.descrizione}</div>
      {o.stato === 'IN_LAVORAZIONE' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ ...numStyle(11, T.numTeal), fontWeight: 700 }}>{p}%</span>
            <div style={{ flex: 1, height: 3, background: T.graySoft, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${p}%`, height: '100%', background: T.numTeal }} />
            </div>
          </div>
        </>
      )}
      <div style={actionsStyle}>
        <button onClick={onApri} style={actStyle(azioneVar)}>
          {azioneLabel} <span style={arrowStyle}>›</span>
        </button>
        <button onClick={onApri} style={actStyle('muted')}>Dettagli</button>
      </div>
    </SwipeCard>
  )
}

// ───────── 7. CARICO LAVORO ─────────

export function CardCaricoLavoro({
  settimana, onApri,
}: { settimana: GiornoCarico[]; onApri?: () => void }) {
  const sovraccarichi = settimana.filter(g => g.percentuale >= 100)
  const leggeri = settimana.filter(g => g.percentuale > 0 && g.percentuale < 50)
  const showAlert = sovraccarichi.length > 0 && leggeri.length > 0

  return (
    <Card>
      <CardHeader index={7} title="CARICO LAVORO" link="vedi piano" indexBg={T.acc} onLink={onApri} />
      <Istogramma giorni={settimana} />
      {showAlert && (
        <div style={{ background: T.redSoft, border: '1px solid #F5C8C8', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <IconAlert color={T.numRed} size={16} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
              {sovraccarichi.map(g => g.label.split(' ')[0]).join(', ')} in sovraccarico
            </div>
            <div style={{ fontSize: 10, color: T.muted }}>
              {leggeri.map(g => g.label.split(' ')[0]).join(', ')} sono leggeri
            </div>
          </div>
          <button onClick={onApri} style={{ background: T.acc, color: '#FFF', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontWeight: 600, height: 30, cursor: 'pointer' }}>BILANCIA</button>
        </div>
      )}
      <BtnFull label="PIANIFICA SETTIMANA" onClick={onApri} />
    </Card>
  )
}

function Istogramma({ giorni }: { giorni: GiornoCarico[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 14, alignItems: 'end', height: 120, padding: '0 4px' }}>
      {giorni.map(g => {
        const c = caricoColor(g.percentuale)
        const h = Math.min(g.percentuale, 130) / 130 * 100
        const dataLabel = g.label.split(' ')[1]
        return (
          <button key={g.data} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column-reverse', height: 80 }}>
              <div style={{ height: `${h}%`, background: g.percentuale > 0 ? c.bar : T.bdr, borderRadius: 4, minHeight: g.percentuale > 0 ? 4 : 2 }} />
            </div>
            <div style={{ ...numStyle(10, g.oggi ? T.text : T.muted), fontWeight: g.oggi ? 700 : 600 }}>
              {g.abbrev}{dataLabel}
            </div>
            <div style={{ ...numStyle(10, c.text), fontWeight: 700 }}>{g.percentuale}</div>
          </button>
        )
      })}
    </div>
  )
}

// ───────── 8. CASSA ─────────

export function CardCassa({
  soldi, onApri,
}: { soldi: SoldiVeloce; onApri?: () => void }) {
  const deltaIeri = soldi.fatturato_ieri > 0
    ? Math.round((soldi.fatturato_oggi - soldi.fatturato_ieri) / soldi.fatturato_ieri * 100)
    : 0

  return (
    <Card>
      <CardHeader index={8} title="CASSA" link="contabilita" indexBg={T.acc} onLink={onApri} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 12 }}>
        <Importo label="Fatturato oggi" value={soldi.fatturato_oggi} variazione={soldi.fatturato_ieri > 0 ? { delta: deltaIeri, testo: 'vs ieri' } : undefined} />
        <Importo label="In lavorazione" value={soldi.in_lavorazione} />
        <Importo label="In attesa pagamento" value={soldi.in_attesa} alertSoft />
      </div>
      {soldi.clienti_non_paganti > 0 && (
        <div style={{ background: T.amberSoft, border: '1px solid #F4DDB8', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <IconAlert color={T.numAmber} size={16} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{soldi.clienti_non_paganti} clienti non hanno pagato</div>
            <div style={{ fontSize: 10, color: T.muted }}>Da contattare</div>
          </div>
          <button onClick={onApri} style={{ background: T.acc, color: '#FFF', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontWeight: 600, height: 30, cursor: 'pointer' }}>CONTATTA</button>
        </div>
      )}
      <BtnFull label="VAI ALLA CONTABILITA" onClick={onApri} />
    </Card>
  )
}

// ───────── 9. OPERATORE FERMO ─────────

export function CardOperatoreFermo({ op, onApri }: { op: OperatoreFermo; onApri?: () => void }) {
  return (
    <div style={{ background: T.redSoft, border: '1px solid #F5C8C8', borderRadius: 16, padding: 16, boxShadow: T.shadow }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ background: T.numRed, color: '#FFF', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>9</span>
        <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: T.text, letterSpacing: 0.4 }}>OPERATORE FERMO</div>
        <IconBell color={T.numRed} size={18} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <Avatar text={iniziali(op.nome)} bg={T.acc} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{op.nome}</div>
          <div style={{ fontSize: 12, color: T.numRed, fontWeight: 500 }}>Fermo da {op.minuti_fermo} minuti</div>
          <div style={{ fontSize: 11, color: T.muted }}>{op.motivo}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onApri} style={{ ...btnBaseStyle, background: T.acc, color: '#FFF', flex: 1 }}>ASSEGNA LAVORO</button>
        <button onClick={() => op.telefono && window.open('tel:' + op.telefono)} style={{ ...btnBaseStyle, background: '#FFF', color: T.text, border: `1px solid ${T.bdr}`, flex: 1 }}>CHIAMA</button>
      </div>
    </div>
  )
}

// ───────── 10. AZIONI RAPIDE ─────────

export function CardAzioniRapide({
  onTask, onCommessa, onMappa, onFoto, onFirma, onPreventivo,
}: {
  onTask?: () => void; onCommessa?: () => void; onMappa?: () => void;
  onFoto?: () => void; onFirma?: () => void; onPreventivo?: () => void;
}) {
  const azioni = [
    { id: 'a1', icon: <IconTask />, titolo: 'Nuovo task', sub: 'Assegna lavoro', onClick: onTask },
    { id: 'a2', icon: <IconFolder />, titolo: 'Nuova commessa', sub: 'Crea commessa', onClick: onCommessa },
    { id: 'a3', icon: <IconPin />, titolo: 'Apri mappa team', sub: 'Vedi tutti', onClick: onMappa },
    { id: 'a4', icon: <IconCamera />, titolo: 'Scatta foto', sub: 'Carica foto', onClick: onFoto },
    { id: 'a5', icon: <IconPen />, titolo: 'Firma documento', sub: 'Richiedi firma', onClick: onFirma },
    { id: 'a6', icon: <IconDoc />, titolo: 'Nuovo preventivo', sub: 'Crea preventivo', onClick: onPreventivo },
  ]
  return (
    <Card>
      <CardHeader index={10} title="AZIONI RAPIDE" indexBg={T.acc} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {azioni.map(a => (
          <button key={a.id} onClick={a.onClick} style={{
            background: '#FFF', border: `1px solid ${T.bdr}`, borderRadius: 12,
            padding: '14px 8px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 6, cursor: 'pointer',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: T.tealSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{a.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: T.text, textAlign: 'center' }}>{a.titolo}</div>
            <div style={{ fontSize: 9, color: T.muted, textAlign: 'center' }}>{a.sub}</div>
          </button>
        ))}
      </div>
    </Card>
  )
}

// ==================================================================
// APPENDERE QUESTO BLOCCO IN FONDO A: components/home-mobile/HomeWidgets.tsx
// (PRIMA della chiusura, NON sostituire nulla)
// ==================================================================

// ==================== CardApiLive ====================
// Widget home: stato API + integrazioni attive
export function CardApiLive({
  callsToday,
  activeKeys,
  expiringKeys,
  leadsViaApi,
  onApri,
}: {
  callsToday: number;
  activeKeys: number;
  expiringKeys: number;
  leadsViaApi: number;
  onApri: () => void;
}) {
  return (
    <div onClick={onApri} style={{ cursor: 'pointer' }}>
      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 12,
      }}>
        <ApiStat label="CHIAMATE OGGI" value={callsToday.toLocaleString('it-IT')} accent="#1E3A5F" />
        <ApiStat label="LEAD VIA API" value={String(leadsViaApi)} accent="#2D5F3F" sub="ultimi 7gg" />
        <ApiStat label="CHIAVI ATTIVE" value={String(activeKeys)} accent="#1E3A5F" />
        <ApiStat
          label="STATO API"
          value="OPERATIVA"
          accent={expiringKeys > 0 ? '#E89F3F' : '#2D5F3F'}
          sub={expiringKeys > 0 ? `${expiringKeys} key in scadenza` : 'tutto ok'}
        />
      </div>

      {/* Quick links */}
      <div style={{
        background: '#1E3A5F',
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: '#E89F3F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, color: '#F5F0E8', fontSize: 13, fontWeight: 700 }}>
            Sistema API attivo
          </p>
          <p style={{ margin: '2px 0 0', color: '#B8C5D6', fontSize: 11 }}>
            Tap per aprire Sviluppatori
          </p>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E89F3F" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}

function ApiStat({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent: string;
  sub?: string;
}) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #d8cfc0',
      borderRadius: 12,
      padding: '12px 14px',
    }}>
      <p style={{
        margin: 0,
        color: '#6b6358',
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        fontWeight: 700,
      }}>
        {label}
      </p>
      <p style={{
        margin: '4px 0 0',
        color: accent,
        fontSize: 22,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ margin: '2px 0 0', color: '#6b6358', fontSize: 10 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

