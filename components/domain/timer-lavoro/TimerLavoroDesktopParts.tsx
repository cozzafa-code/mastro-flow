'use client';

// ============================================================
// MASTRO — TimerLavoroDesktop — sub-components
// ============================================================

import type { ReactNode } from 'react';

const TT = {
  bg: '#F8FAFC', card: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', muted: '#64748B',
};

export function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider mb-1.5" style={{ color: TT.muted }}>
        {label}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: 'white', color: TT.text, border: `1px solid ${TT.bdr}` }}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.l}</option>
        ))}
      </select>
    </div>
  );
}

export function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-${align}`}>
      {children}
    </th>
  );
}

export function Td({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return <td className={`px-4 py-3 text-${align}`}>{children}</td>;
}

export function Badge({ children, color, bg }: { children: ReactNode; color: string; bg: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}
