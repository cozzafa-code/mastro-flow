'use client'
import { BottomNav } from '@/app/components/BottomNav'
import { Topbar } from '@/app/components/Topbar'

export default function MailPage() {
  return (
    <div className="phone-screen">
      <Topbar notificheCount={0} onSearchOpen={() => {}} />
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>Mail</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--ink-soft)', marginTop: 8, letterSpacing: 1.5 }}>COMING SOON</div>
        </div>
      </div>
      <BottomNav mailCount={0} />
    </div>
  )
}
