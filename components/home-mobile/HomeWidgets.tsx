// components/home-mobile/HomeWidgets.tsx
// 10 widget operativi con navigazioni cablate.

'use client'

import React, { useState } from 'react'
import {
  T, btnBaseStyle, numStyle, Card, CardHeader, Kpi, Importo,
  Pill, PillStatus, Avatar, BtnPrimary, BtnSecondary, BtnFull,
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
      {attivita.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {attivita.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ ...numStyle(13, T.text), minWidth: 44, fontWeight: 700 }}>{a.ora}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titolo}</div>
                <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.indirizzo}</div>
              </div>
              <BtnPrimary label={a.azione_primaria} onClick={onVedi} />
              <BtnSecondary label={a.azione_secondaria} onClick={onVedi} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '14px 8px', fontSize: 12, color: T.muted, textAlign: 'center' }}>
          Nessuna attivita pianificata oggi
        </div>
      )}
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Pill bg={T.tealSoft} fg={T.numTeal} dot={T.numTeal} text={`${attivi} attivi`} />
        {problemi > 0 && <Pill bg={T.redSoft} fg={T.numRed} dot={T.numRed} text={`${problemi} problema`} />}
      </div>
      {operatori.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {operatori.map(o => <RigaOperatore key={o.id} o={o} onApri={onApri} />)}
        </div>
      ) : (
        <div style={{ padding: '14px 8px', fontSize: 12, color: T.muted, textAlign: 'center' }}>
          Nessun operatore attivo
        </div>
      )}
      <BtnFull label="APRI TEAM COMPLETO" onClick={onApri} />
    </Card>
  )
}

function RigaOperatore({ o, onApri }: { o: Operatore; onApri?: () => void }) {
  const palette =
    o.stato === 'attivo' ? { bg: '#F8FCFC', bdr: '#E6F0EC', tempoCol: T.numTeal, attCol: T.muted } :
    o.stato === 'pausa' ? { bg: T.amberSoft, bdr: '#F4DDB8', tempoCol: T.numAmber, attCol: T.numAmber } :
    o.stato === 'problema' ? { bg: T.redSoft, bdr: '#F5C8C8', tempoCol: T.numRed, attCol: T.numRed } :
    { bg: T.blueSoft, bdr: '#C8DCEF', tempoCol: T.numBlue, attCol: T.numBlue }

  const azione =
    o.stato === 'pausa' ? { label: 'ASSEGNA', bg: T.acc, fg: '#FFF', bdr: 'none' } :
    o.stato === 'problema' ? { label: 'RISOLVI', bg: T.numRed, fg: '#FFF', bdr: 'none' } :
    o.stato === 'viaggio' ? { label: 'MAPPA', bg: '#FFF', fg: T.numBlue, bdr: `1px solid ${palette.bdr}` } :
    null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, background: palette.bg, border: `1px solid ${palette.bdr}` }}>
      <Avatar text={iniziali(o.nome)} bg={T.acc} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{o.nome}</div>
        <div style={{ fontSize: 11, color: palette.attCol, fontWeight: 500 }}>
          {o.stato === 'pausa' ? `Pausa da ${o.tempo}` :
           o.stato === 'problema' ? `${o.attivita} - ${o.tempo}` :
           o.stato === 'viaggio' ? `In viaggio - arrivo ${o.tempo}` :
           o.attivita}
        </div>
      </div>
      {azione ? (
        <button onClick={onApri} style={{ background: azione.bg, color: azione.fg, border: azione.bdr, borderRadius: 8, padding: '6px 10px', fontSize: 10, fontWeight: 600, height: 30, cursor: 'pointer' }}>{azione.label}</button>
      ) : (
        <div onClick={onApri} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, cursor: 'pointer' }}>
          <span style={{ ...numStyle(13, palette.tempoCol), fontWeight: 700 }}>{o.tempo}</span>
          <span style={{ fontSize: 9, color: T.muted }}>tap › azioni</span>
        </div>
      )}
    </div>
  )
}

// ───────── 3. COMMESSE CRITICHE ─────────

export function CardCommesseCritiche({
  commesse, onApri,
}: { commesse: CommessaCritica[]; onApri?: (id: string) => void }) {
  return (
    <Card>
      <CardHeader index={3} title="COMMESSE CRITICHE" link="vedi tutte" indexBg={T.numRed} onLink={() => onApri && onApri('')} />
      {commesse.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {commesse.map(c => {
            const palette =
              c.livello === 'ritardo' ? { bg: T.redSoft, dot: T.numRed, label: T.numRed } :
              c.livello === 'problema' ? { bg: T.amberSoft, dot: T.numAmber, label: T.numAmber } :
              { bg: '#FEF9C3', dot: '#854F0B', label: '#854F0B' }
            return (
              <div key={c.id} style={{ background: palette.bg, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: palette.dot, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.titolo}</div>
                  <div style={{ fontSize: 11, color: palette.label, fontWeight: 500 }}>{c.motivo}</div>
                </div>
                <BtnPrimary label={c.azione} onClick={() => onApri && onApri(c.id)} />
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ padding: '14px 8px', fontSize: 12, color: T.muted, textAlign: 'center' }}>
          Nessuna commessa critica
        </div>
      )}
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
      {problemi.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {problemi.map(p => (
            <div key={p.id} style={{ background: T.redSoft, borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconAlert color={T.numRed} size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.titolo}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{p.contesto}</div>
              </div>
              <BtnPrimary label={p.azione} onClick={onApri} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '14px 8px', fontSize: 12, color: T.muted, textAlign: 'center' }}>
          Nessun problema aperto
        </div>
      )}
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
      {eventiGiorno.length > 0 ? (
        <ListaEventi eventi={eventiGiorno} onApri={onApri} />
      ) : (
        <div style={{ padding: '20px 8px', textAlign: 'center', color: T.muted, fontSize: 12 }}>
          Nessun evento in questo giorno
        </div>
      )}
      <BtnFull label="VAI ALL AGENDA COMPLETA" onClick={onApri} />
    </Card>
  )
}

function StripGiorni({
  giorni, selezionato, onSelect,
}: { giorni: GiornoAgenda[]; selezionato: string; onSelect: (d: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12, scrollbarWidth: 'none' }}>
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
              boxShadow: sel ? '0 2px 8px rgba(15,118,110,0.25)' : 'none',
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

function ListaEventi({ eventi, onApri }: { eventi: EventoAgenda[]; onApri?: () => void }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 20 }}>
      <div style={{ position: 'absolute', left: 4, top: 8, bottom: 8, width: 2, background: T.bdr }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {eventi.map(e => (
          <div key={e.id} style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: -20, top: 4, width: 10, height: 10, borderRadius: '50%', background: T.acc, border: `2px solid ${T.bg}` }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ ...numStyle(13, T.text), fontWeight: 700, minWidth: 44 }}>{e.ora}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{e.titolo}</div>
                <div style={{ fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.cliente}{e.indirizzo ? ' · ' + e.indirizzo : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <BtnPrimary label="VAI" small onClick={onApri} />
                <BtnSecondary label="SPOSTA" small onClick={onApri} />
              </div>
            </div>
          </div>
        ))}
      </div>
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
      {ordini.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ordini.map(o => <RigaOrdine key={o.id} o={o} onApri={onApri} />)}
        </div>
      ) : (
        <div style={{ padding: '14px 8px', fontSize: 12, color: T.muted, textAlign: 'center' }}>
          Nessun ordine in produzione
        </div>
      )}
      <BtnFull label="VAI ALLA PRODUZIONE" onClick={onApri} />
    </Card>
  )
}

function RigaOrdine({ o, onApri }: { o: OrdineProduzione; onApri?: () => void }) {
  if (o.stato === 'FERMO') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: T.redSoft, border: '1px solid #F5C8C8' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Ordine {o.codice}</div>
          <div style={{ fontSize: 11, color: T.muted }}>{o.descrizione}</div>
        </div>
        <PillStatus text="FERMO" kind="danger" />
        <button onClick={onApri} style={{ background: T.numRed, color: '#FFF', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontWeight: 600, height: 30, cursor: 'pointer' }}>SBLOCCA</button>
      </div>
    )
  }
  if (o.stato === 'IN_ATTESA') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: T.amberSoft, border: '1px solid #F4DDB8' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Ordine {o.codice}</div>
          <div style={{ fontSize: 11, color: T.muted }}>{o.descrizione}</div>
        </div>
        <PillStatus text="IN ATTESA" kind="warn" />
        <button onClick={onApri} style={{ background: '#FFF', color: T.numAmber, border: '1px solid #F4DDB8', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontWeight: 600, height: 30, cursor: 'pointer' }}>VERIFICA</button>
      </div>
    )
  }
  const p = o.percentuale ?? 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10, background: T.tealSoft, border: '1px solid #C5E5D9' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Ordine {o.codice}</div>
          <span style={{ ...numStyle(10, T.numTeal), fontWeight: 700 }}>{p}%</span>
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{o.descrizione}</div>
        <div style={{ height: 3, background: '#C5E5D9', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${p}%`, height: '100%', background: T.numTeal }} />
        </div>
      </div>
      <button onClick={onApri} style={{ background: '#FFF', color: T.numTeal, border: '1px solid #C5E5D9', borderRadius: 8, padding: '6px 10px', fontSize: 10, fontWeight: 600, height: 30, cursor: 'pointer' }}>TRACCIA</button>
    </div>
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
