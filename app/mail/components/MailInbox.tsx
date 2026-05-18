'use client'
import { FC } from 'react'
import type { Email, MailFilter } from '@/lib/mail-types'
import { CAT_COLOR, getAvatarColor, getAvatarInitial, formatEmailTime, groupEmailsByDate, SECTION_ORDER } from '@/lib/mail-types'

const FILTERS: { id: MailFilter; label: string }[] = [
  { id: 'tutte', label: 'Tutte' }, { id: 'non_lette', label: 'Non lette' },
  { id: 'lead', label: 'Lead' }, { id: 'clienti', label: 'Clienti' },
  { id: 'fornitori', label: 'Fornitori' }, { id: 'fatture', label: 'Fatture' },
  { id: 'starred', label: '★ Salvate' },
]

interface Props {
  emails: Email[]
  filter: MailFilter
  onFilterChange: (f: MailFilter) => void
  onEmailClick: (e: Email) => void
  onStarToggle: (id: string, val: boolean) => void
  search: string
  onSearchChange: (v: string) => void
}

export const MailInbox: FC<Props> = ({ emails, filter, onFilterChange, onEmailClick, onStarToggle, search, onSearchChange }) => {
  const pinned = emails.filter(e => e.is_pinned)
  const rest = emails.filter(e => !e.is_pinned)
  const grouped = groupEmailsByDate(rest)
  const nonLette = emails.filter(e => !e.is_read).length
  const inAttesa = emails.filter(e => {
    if (!e.received_at) return false
    const days = (Date.now() - new Date(e.received_at).getTime()) / 86400000
    return !e.is_read && days > 3
  }).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Stats banner */}
      {inAttesa > 0 && (
        <div style={{ padding: '0 18px 10px', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: '0 18px 10px', borderRadius: 18, background: 'var(--ocra)', filter: 'blur(11px)', opacity: 0.25, zIndex: -1 }} />
          <div style={{ background: 'linear-gradient(160deg, var(--surface), var(--surface-2))', border: '1.5px solid rgba(232,167,38,0.35)', borderRadius: 16, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 11, position: 'relative', overflow: 'hidden', boxShadow: '0 6px 14px rgba(60,50,30,0.14), inset 0 3px 5px rgba(255,255,255,0.6)' }}>
            <div style={{ position: 'absolute', top: '8%', left: '10%', width: '28%', height: '16%', background: 'rgba(255,255,255,0.55)', borderRadius: '50%', filter: 'blur(7px)' }} />
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, position: 'relative', zIndex: 2, boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.3), 0 3px 6px rgba(200,138,23,0.4)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
            </div>
            <div style={{ flex: 1, position: 'relative', zIndex: 2 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: 'var(--ocra-deep)', letterSpacing: 1, textTransform: 'uppercase' }}>DA RICHIAMARE</div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, color: 'var(--ink)', marginTop: 2, textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>{inAttesa} mail in attesa da più di 3 giorni</div>
            </div>
            <button onClick={() => onFilterChange('non_lette')} style={{ background: 'linear-gradient(160deg, var(--ocra), var(--ocra-deep))', color: '#fff', border: 'none', fontFamily: "'Fredoka', sans-serif", fontSize: 10, fontWeight: 700, padding: '6px 10px', borderRadius: 999, cursor: 'pointer', flexShrink: 0, boxShadow: 'inset 0 1.5px 2.5px rgba(255,255,255,0.25), 0 3px 6px rgba(200,138,23,0.4)' }}>Apri</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '0 18px 10px' }}>
        <div style={{ background: 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', borderRadius: 14, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 9, boxShadow: 'inset 0 3px 5px rgba(60,50,30,0.1)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2.3" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Cerca mail, mittenti, S-XXXX..." style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--ink)', flex: 1 }} />
        </div>
      </div>

      {/* Filtri pill */}
      <div style={{ padding: '0 18px 12px', overflowX: 'auto', display: 'flex', gap: 6, scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => onFilterChange(f.id)} style={{ flexShrink: 0, border: 'none', cursor: 'pointer', borderRadius: 999, padding: '6px 13px', fontFamily: "'Fredoka', sans-serif", fontSize: 11.5, fontWeight: 700, background: filter === f.id ? 'linear-gradient(160deg, var(--teal), var(--teal-deep))' : 'linear-gradient(160deg, var(--bg-soft), var(--surface-2))', color: filter === f.id ? '#fff' : 'var(--ink-dim)', boxShadow: filter === f.id ? '0 4px 9px rgba(20,80,90,0.45), inset 0 1.5px 3px rgba(255,255,255,0.25)' : 'inset 0 2px 3px rgba(255,255,255,0.5), 0 1.5px 4px rgba(60,50,30,0.1)', textShadow: filter === f.id ? '0 1px 1px rgba(0,0,0,0.2)' : 'none' }}>
            {f.label}{f.id === 'non_lette' && nonLette > 0 ? ` (${nonLette})` : ''}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Pinned */}
        {pinned.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <SectionLabel label="FISSATE IN ALTO" />
            {pinned.map(e => <EmailRow key={e.id} email={e} onClick={() => onEmailClick(e)} onStar={() => onStarToggle(e.id, !e.is_starred)} />)}
          </div>
        )}

        {/* Grouped */}
        {SECTION_ORDER.filter(s => grouped[s]?.length).map(section => (
          <div key={section} style={{ marginBottom: 16 }}>
            <SectionLabel label={section} />
            {grouped[section].map(e => <EmailRow key={e.id} email={e} onClick={() => onEmailClick(e)} onStar={() => onStarToggle(e.id, !e.is_starred)} />)}
          </div>
        ))}

        {emails.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-soft)', fontFamily: "'Nunito', sans-serif" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Nessuna mail</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, marginTop: 6, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--ink-soft)' }}>Inbox vuota</div>
          </div>
        )}
      </div>
    </div>
  )
}

const SectionLabel: FC<{ label: string }> = ({ label }) => (
  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 800, color: 'var(--ink-soft)', letterSpacing: 1.5, textTransform: 'uppercase', padding: '4px 2px 8px' }}>{label}</div>
)

const EmailRow: FC<{ email: Email; onClick: () => void; onStar: () => void }> = ({ email: e, onClick, onStar }) => {
  const av = getAvatarColor(e.from_address)
  const cat = e.category ? CAT_COLOR[e.category] : null
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '11px 12px', marginBottom: 6, borderRadius: 16, background: e.is_pinned ? 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))' : 'linear-gradient(160deg, var(--surface), var(--surface-2))', cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(60,50,30,0.06), 0 4px 10px rgba(60,50,30,0.12), inset 0 3px 5px rgba(255,255,255,0.55)' }}>
      <div style={{ position: 'absolute', top: '8%', left: '8%', width: '24%', height: '14%', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', filter: 'blur(6px)' }} />
      {/* Unread dot */}
      {!e.is_read && <div style={{ position: 'absolute', top: 12, left: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', boxShadow: '0 0 6px var(--teal)' }} />}
      {/* Avatar */}
      <div style={{ width: 38, height: 38, borderRadius: 12, background: av.bg, color: av.color, display: 'grid', placeItems: 'center', fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: 16, flexShrink: 0, position: 'relative', zIndex: 2, boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.55), 0 2px 4px rgba(0,0,0,0.08)' }}>
        {getAvatarInitial(e.from_name, e.from_address)}
      </div>
      {/* Body */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: e.is_read ? 700 : 900, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
            {e.from_name || e.from_address}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--ink-soft)', fontWeight: 700, flexShrink: 0 }}>
            {formatEmailTime(e.received_at || e.sent_at)}
          </span>
        </div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12.5, fontWeight: e.is_read ? 600 : 800, color: e.is_read ? 'var(--ink-2)' : 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
          {e.subject || '(senza oggetto)'}
        </div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11.5, color: 'var(--ink-dim)', fontWeight: 600, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, lineHeight: 1.35, marginBottom: 5 }}>
          {e.preview}
        </div>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          {cat && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: cat.bg, color: cat.color, letterSpacing: 0.4 }}>{cat.label}</span>}
          {e.commessa && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, fontWeight: 800, padding: '2px 7px', borderRadius: 5, background: 'var(--teal-bg)', color: 'var(--teal-deep)' }}>{e.commessa.code}</span>}
          {e.attachments && e.attachments.length > 0 && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2.2" strokeLinecap="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          )}
        </div>
      </div>
      {/* Star */}
      <button onClick={ev => { ev.stopPropagation(); onStar() }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, flexShrink: 0, position: 'relative', zIndex: 2 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={e.is_starred ? 'var(--ocra)' : 'none'} stroke={e.is_starred ? 'var(--ocra)' : 'var(--ink-soft)'} strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>
  )
}
