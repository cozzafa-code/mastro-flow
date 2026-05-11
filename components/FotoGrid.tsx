"use client";
// components/FotoGrid.tsx - Griglia foto riutilizzabile con upload e lightbox

import React, { useState, useRef } from "react";
import { uploadMultipleFiles } from "../lib/uploadStorage";

const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const RED = "#DC2626", AMBER = "#D97706";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

interface Props {
  foto: string[];
  onChange?: (foto: string[]) => void;
  uploadFolder?: string;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  maxFoto?: number;
  label?: string;
}

export default function FotoGrid({ foto, onChange, uploadFolder = 'notes', readOnly = false, size = 'md', maxFoto = 10, label }: Props) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tileSize = size === 'sm' ? 60 : size === 'lg' ? 110 : 80;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !onChange) return;
    if (foto.length + files.length > maxFoto) {
      alert(`Max ${maxFoto} foto`);
      return;
    }
    setUploading(true);
    const urls = await uploadMultipleFiles(uploadFolder, files);
    if (urls.length > 0) {
      onChange([...foto, ...urls]);
    } else {
      alert('Errore upload');
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeFoto(i: number) {
    if (!onChange) return;
    onChange(foto.filter((_, idx) => idx !== i));
  }

  return (
    <>
      {label && <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>}
      
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
        {foto.map((url, i) => (
          <div key={i} style={{ position: 'relative' as const, width: tileSize, height: tileSize }}>
            <img src={url} alt="" onClick={() => setLightbox(url)} style={{
              width: '100%', height: '100%', objectFit: 'cover' as const,
              borderRadius: 8, cursor: 'pointer',
              border: '2px solid #E5EAF0',
            }} />
            {!readOnly && (
              <button onClick={(e) => { e.stopPropagation(); removeFoto(i); }} style={{
                position: 'absolute' as const, top: -6, right: -6,
                width: 22, height: 22, borderRadius: '50%',
                background: RED, color: '#fff', border: '2px solid #fff',
                fontSize: 12, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}>×</button>
            )}
          </div>
        ))}
        
        {!readOnly && foto.length < maxFoto && (
          <>
            <button onClick={() => inputRef.current?.click()} disabled={uploading} style={{
              width: tileSize, height: tileSize, borderRadius: 8,
              background: uploading ? '#F1F4F7' : '#fff',
              border: `2px dashed ${uploading ? MUTED : TEAL}`,
              color: TEAL_DEEP, cursor: uploading ? 'wait' : 'pointer',
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', gap: 4,
              fontFamily: 'inherit',
            }}>
              {uploading ? (
                <>
                  <span style={{ fontSize: 18 }}>⏳</span>
                  <span style={{ fontSize: 9, fontWeight: 700 }}>Upload...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 24, lineHeight: 1 }}>📷</span>
                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.3 }}>FOTO</span>
                  <span style={{ fontSize: 8, color: MUTED }}>{foto.length}/{maxFoto}</span>
                </>
              )}
            </button>
            <input ref={inputRef} type="file" accept="image/*" multiple onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 10100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' as const, borderRadius: 8 }} />
          <button onClick={() => setLightbox(null)} style={{
            position: 'absolute' as const, top: 20, right: 20,
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: 22, fontWeight: 700,
          }}>×</button>
        </div>
      )}
    </>
  );
}
