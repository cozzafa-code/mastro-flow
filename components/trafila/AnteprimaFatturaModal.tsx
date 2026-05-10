'use client';

import { useState } from 'react';
import { X, FileText, Send, Download } from 'lucide-react';

// ============================================================================
// TYPES — adattali ai tuoi se diversi
// ============================================================================
interface Fattura {
  id: string;          // id locale fat_xxx
  dbId?: string;       // UUID Supabase (presente solo dopo persist)
  numero: string;
  data: string;        // ISO
  tipo: 'acconto' | 'saldo' | 'unica';
  imponibile: number;
  iva: number;         // es. 10, 22
  totale: number;
  stato: 'bozza' | 'inviata' | 'pagata';
}

interface Commessa {
  codice: string;
  descrizione?: string;
}

interface Cliente {
  nome?: string;
  ragione_sociale?: string;
  indirizzo?: string;
  cap?: string;
  citta?: string;
  codice_fiscale?: string;
  partita_iva?: string;
  codice_sdi?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  fattura: Fattura;
  commessa: Commessa;
  cliente: Cliente;
  xmlSDI: string;
  onInvia: () => Promise<void>;
}

// ============================================================================
// COMPONENT
// ============================================================================
export default function AnteprimaFatturaModal({
  open,
  onClose,
  fattura,
  commessa,
  cliente,
  xmlSDI,
  onInvia,
}: Props) {
  const [tab, setTab] = useState<'preview' | 'xml'>('preview');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleInvia = async () => {
    setSending(true);
    try {
      await onInvia();
      onClose();
    } catch (e) {
      console.error('[AnteprimaFatturaModal] invio fallito:', e);
    } finally {
      setSending(false);
    }
  };

  const downloadXML = () => {
    const blob = new Blob([xmlSDI], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IT_${fattura.numero}_FPR12.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-[#0D1F1F] w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col border border-[#28A0A0]/30">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#28A0A0]" />
            <div>
              <h2 className="text-white font-semibold text-base">
                Anteprima Fattura {fattura.numero}
              </h2>
              <p className="text-white/50 text-xs">
                {cliente.ragione_sociale || cliente.nome || 'Cliente'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg"
            aria-label="Chiudi"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setTab('preview')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              tab === 'preview'
                ? 'text-[#28A0A0] border-b-2 border-[#28A0A0]'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            Anteprima
          </button>
          <button
            onClick={() => setTab('xml')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              tab === 'xml'
                ? 'text-[#28A0A0] border-b-2 border-[#28A0A0]'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            XML SDI
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'preview' ? (
            <FatturaPreview fattura={fattura} commessa={commessa} cliente={cliente} />
          ) : (
            <pre className="text-xs text-white/70 bg-black/40 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all font-mono">
              {xmlSDI}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex gap-2">
          <button
            onClick={downloadXML}
            className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            Scarica XML
          </button>
          <button
            onClick={handleInvia}
            disabled={sending || !fattura.dbId}
            className="flex-1 py-3 px-4 bg-[#28A0A0] hover:bg-[#2BB8B8] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Invio…' : 'Invia a SDI'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PREVIEW INTERNA
// ============================================================================
function FatturaPreview({
  fattura,
  commessa,
  cliente,
}: {
  fattura: Fattura;
  commessa: Commessa;
  cliente: Cliente;
}) {
  const dataFmt = new Date(fattura.data).toLocaleDateString('it-IT');

  return (
    <div className="bg-white text-black rounded-lg p-5 text-sm shadow-lg">
      {/* Intestazione */}
      <div className="flex justify-between border-b border-gray-200 pb-3 mb-3">
        <div>
          <h3 className="font-bold text-lg">FATTURA</h3>
          <p className="text-gray-600 text-xs">
            N° {fattura.numero} del {dataFmt}
          </p>
        </div>
        <div className="text-right text-xs">
          <p className="font-semibold">Walter Cozza Serramenti</p>
          <p className="text-gray-600">P.IVA 0XXXXXXXXXXX</p>
          <p className="text-gray-600">Cosenza</p>
        </div>
      </div>

      {/* Destinatario */}
      <div className="mb-4 text-xs">
        <p className="text-gray-500 mb-1 uppercase tracking-wide">Destinatario</p>
        <p className="font-semibold text-sm">
          {cliente.ragione_sociale || cliente.nome || '—'}
        </p>
        {cliente.indirizzo && (
          <p className="text-gray-600">
            {cliente.indirizzo} — {cliente.cap || ''} {cliente.citta || ''}
          </p>
        )}
        <p className="text-gray-600">
          {cliente.codice_fiscale && <>CF: {cliente.codice_fiscale} </>}
          {cliente.partita_iva && <>· P.IVA: {cliente.partita_iva}</>}
        </p>
        <p className="text-gray-600">SDI: {cliente.codice_sdi || '0000000'}</p>
      </div>

      {/* Commessa */}
      <div className="mb-3">
        <p className="text-gray-500 text-xs mb-1 uppercase tracking-wide">Commessa</p>
        <p className="text-sm">
          {commessa.codice} — {commessa.descrizione || 'Fornitura serramenti'}
        </p>
      </div>

      {/* Tabella */}
      <table className="w-full text-xs border-t border-gray-200">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="py-2 font-medium">Descrizione</th>
            <th className="text-right font-medium">Imponibile</th>
            <th className="text-right font-medium">IVA</th>
            <th className="text-right font-medium">Totale</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-gray-200">
            <td className="py-2">
              {fattura.tipo === 'acconto'
                ? 'Acconto su fornitura'
                : fattura.tipo === 'saldo'
                ? 'Saldo fornitura'
                : 'Fornitura'}
            </td>
            <td className="text-right">€ {fattura.imponibile.toFixed(2)}</td>
            <td className="text-right">{fattura.iva}%</td>
            <td className="text-right font-semibold">€ {fattura.totale.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* Totale */}
      <div className="flex justify-end mt-4 pt-3 border-t border-gray-200">
        <div className="text-right">
          <p className="text-gray-600 text-xs">Totale documento</p>
          <p className="font-bold text-lg">€ {fattura.totale.toFixed(2)}</p>
        </div>
      </div>

      {/* Stato */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <span
          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            fattura.stato === 'pagata'
              ? 'bg-green-100 text-green-800'
              : fattura.stato === 'inviata'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {fattura.stato.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
