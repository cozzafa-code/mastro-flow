// components/mobile/home/HomeReorderToolbar.tsx
'use client';

import React from 'react';

type Props = {
  expandedCount: number;
  totalCount: number;
  editMode: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleEdit: () => void;
  onReset: () => void;
};

const btnBase: React.CSSProperties = {
  padding: '7px 12px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  border: '1.5px solid #1E3A5F',
  background: '#FFFFFF',
  color: '#1E3A5F',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: '#1E3A5F',
  color: '#FFFFFF',
};

export function HomeReorderToolbar({
  expandedCount, totalCount, editMode,
  onExpandAll, onCollapseAll, onToggleEdit, onReset,
}: Props) {
  return (
    <div style={{
      background: '#DBE6F1',
      borderBottom: '1px solid #93C5FD',
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    }}>
      {!editMode ? (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onExpandAll} style={btnBase}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              Apri tutto
            </button>
            <button onClick={onCollapseAll} style={btnBase}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <polyline points="18 15 12 9 6 15"/>
              </svg>
              Chiudi tutto
            </button>
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#1E3A5F',
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {expandedCount}/{totalCount}
          </div>
        </>
      ) : (
        <>
          <div style={{
            fontSize: 12, fontWeight: 700, color: '#1E3A5F',
            letterSpacing: '0.02em', flex: 1,
          }}>Trascina per riordinare</div>
          <button onClick={onReset} style={btnBase}>Reset</button>
          <button onClick={onToggleEdit} style={btnPrimary}>Fatto</button>
        </>
      )}
    </div>
  );
}
