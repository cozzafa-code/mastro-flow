// components/mobile/home/HomeIcons.tsx
// SVG inline per i widget Home. Quando in repo trovate equivalenti
// in mastro-constants, sostituire gli import. Stroke 2 stile coerente.

import React from 'react'

type IP = { color?: string; size?: number }

export function IconCalendar({ color = '#FFF', size = 16 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="2"/><path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
}
export function IconMenu({ color = '#FFF', size = 18 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
}
export function IconAlert({ color = '#A32D2D', size = 16 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
export function IconBell({ color = '#A32D2D', size = 18 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
export function IconCheck({ color = '#0F6E56', size = 14 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M20 6 9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
export function IconClock({ color = '#A32D2D', size = 14 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/><path d="M12 7v5l3 2" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
}
export function IconTask({ color = '#0F766E', size = 20 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="3" stroke={color} strokeWidth="2"/><path d="m8 12 3 3 5-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
export function IconFolder({ color = '#0F766E', size = 20 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" stroke={color} strokeWidth="2"/></svg>
}
export function IconPin({ color = '#0F766E', size = 20 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z" stroke={color} strokeWidth="2"/><circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="2"/></svg>
}
export function IconCamera({ color = '#0F766E', size = 20 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" stroke={color} strokeWidth="2"/><circle cx="12" cy="13" r="3.5" stroke={color} strokeWidth="2"/></svg>
}
export function IconPen({ color = '#0F766E', size = 20 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M14.5 4.5 19.5 9.5 8 21H3v-5z" stroke={color} strokeWidth="2" strokeLinejoin="round"/></svg>
}
export function IconDoc({ color = '#0F766E', size = 20 }: IP) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke={color} strokeWidth="2" strokeLinejoin="round"/><path d="M14 3v6h6M8 13h8M8 17h6" stroke={color} strokeWidth="2" strokeLinecap="round"/></svg>
}
