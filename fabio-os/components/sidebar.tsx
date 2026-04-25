'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Oggi', href: '/dashboard' },
  { label: 'Progetti', href: '/dashboard/progetti' },
  { label: 'Finanza', href: '/dashboard/finanza' },
  { label: 'Agenda', href: '/dashboard/agenda' },
  { label: 'Lab', href: '/dashboard/lab' },
  { label: 'Famiglia', href: '/dashboard/famiglia' },
]

export function Sidebar() {
  const pathname = usePathname()
  const isActive = (href: string) => href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <aside style={{ width:'200px', minWidth:'200px', height:'100vh', backgroundColor:'#1A1A1C', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, zIndex:50 }}>
      <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'28px', height:'28px', backgroundColor:'#D08008', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700', color:'#fff', fontFamily:'Inter,sans-serif' }}>F</div>
          <div>
            <div style={{ fontFamily:'Inter,sans-serif', fontWeight:'600', fontSize:'13px', color:'#FFFFFF' }}>FABIO OS</div>
            <div style={{ fontFamily:'monospace', fontSize:'9px', color:'#D08008', marginTop:'1px' }}>v1.0</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:'12px 8px' }}>
        <div style={{ fontFamily:'Inter,sans-serif', fontSize:'9px', fontWeight:'600', color:'#5A5A5E', letterSpacing:'0.1em', textTransform:'uppercase', padding:'0 8px', marginBottom:'6px' }}>Workspace</div>
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', borderRadius:'6px', marginBottom:'2px', textDecoration:'none', backgroundColor: active ? 'rgba(208,128,8,0.15)' : 'transparent', color: active ? '#D08008' : '#9CA3AF', fontFamily:'Inter,sans-serif', fontSize:'13px', fontWeight: active ? '600' : '400', borderLeft: active ? '2px solid #D08008' : '2px solid transparent' }}>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div style={{ padding:'16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/dashboard/settings" style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 10px', borderRadius:'6px', textDecoration:'none', color:'#9CA3AF', fontFamily:'Inter,sans-serif', fontSize:'13px' }}>Impostazioni</Link>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 10px 0', marginTop:'8px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width:'28px', height:'28px', borderRadius:'50%', backgroundColor:'#3B7FE0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'700', color:'#fff' }}>F</div>
          <div>
            <div style={{ fontFamily:'Inter,sans-serif', fontSize:'12px', fontWeight:'500', color:'#E5E7EB' }}>Fabio</div>
            <div style={{ fontFamily:'monospace', fontSize:'9px', color:'#5A5A5E' }}>Founder</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
