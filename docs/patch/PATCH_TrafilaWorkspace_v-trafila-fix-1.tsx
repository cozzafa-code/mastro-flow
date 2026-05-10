// ============================================================================
// PATCH TrafilaWorkspace.tsx — Fix marca pagata + Anteprima fattura
// ============================================================================
//
// Applica queste modifiche dentro TrafilaWorkspace.tsx (o dove vivono
// handlePagaFattura e setFatture). Marker versione: [v-trafila-fix-1]
//
// ============================================================================


// ────────────────────────────────────────────────────────────────────────────
// 1) IMPORT (in cima al file)
// ────────────────────────────────────────────────────────────────────────────

import AnteprimaFatturaModal from '@/components/trafila/AnteprimaFatturaModal';
// ⚠️ Adatta il path se la tua struttura è diversa


// ────────────────────────────────────────────────────────────────────────────
// 2) STATE (insieme agli altri useState del componente)
// ────────────────────────────────────────────────────────────────────────────

const [anteprimaFattura, setAnteprimaFattura] = useState<Fattura | null>(null);


// ────────────────────────────────────────────────────────────────────────────
// 3) FIX handlePagaFattura — accetta dbId UUID, matcha su f.dbId
// ────────────────────────────────────────────────────────────────────────────

// PRIMA (BUG):
// const handlePagaFattura = async (id: string) => {
//   await supabase.from('fatture').update({ stato: 'pagata' }).eq('id', id);
//   setFatture(prev => prev.map(f => f.id === id ? {...f, stato:'pagata'} : f));
//   //                                  ^^^^^^^^^ id locale fat_xxx ≠ UUID DB
// };

// DOPO (FIX): [v-trafila-fix-1]
const handlePagaFattura = async (dbId: string) => {
  if (!dbId) {
    console.warn('[handlePagaFattura] dbId mancante — fattura non ancora persistita');
    return;
  }

  const { error } = await supabase
    .from('fatture')
    .update({
      stato: 'pagata',
      pagata_il: new Date().toISOString(),
    })
    .eq('id', dbId);

  if (error) {
    console.error('[handlePagaFattura] errore DB:', error);
    return;
  }

  // ✅ Match su dbId (UUID Supabase), NON su id locale fat_xxx
  setFatture(prev =>
    prev.map(f =>
      f.dbId === dbId
        ? { ...f, stato: 'pagata' as const, pagata_il: new Date().toISOString() }
        : f
    )
  );

  // Avanza fase commessa se serve (acconto_pagato → produzione, ecc.)
  await checkAndAdvancePhase?.();
};


// ────────────────────────────────────────────────────────────────────────────
// 4) BOTTONE "Marca pagata" — assicura che passi dbId, non id
// ────────────────────────────────────────────────────────────────────────────

// PRIMA:
// <button onClick={() => handlePagaFattura(fattura.id)}>Marca pagata</button>

// DOPO:
<button
  onClick={() => fattura.dbId && handlePagaFattura(fattura.dbId)}
  disabled={!fattura.dbId || fattura.stato === 'pagata'}
  className="px-4 py-2 bg-[#28A0A0] hover:bg-[#2BB8B8] disabled:opacity-40 text-white rounded-lg text-sm font-medium"
>
  {fattura.stato === 'pagata' ? '✓ Pagata' : 'Marca pagata'}
</button>


// ────────────────────────────────────────────────────────────────────────────
// 5) BOTTONE "Anteprima e invia" (sostituisce o affianca "Invia fattura")
// ────────────────────────────────────────────────────────────────────────────

<button
  onClick={() => setAnteprimaFattura(fattura)}
  disabled={!fattura.dbId || fattura.stato === 'inviata' || fattura.stato === 'pagata'}
  className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-lg text-sm font-medium"
>
  Anteprima e invia
</button>


// ────────────────────────────────────────────────────────────────────────────
// 6) RENDER MODALE — in fondo al JSX del componente, prima della chiusura
// ────────────────────────────────────────────────────────────────────────────

{anteprimaFattura && (
  <AnteprimaFatturaModal
    open={!!anteprimaFattura}
    onClose={() => setAnteprimaFattura(null)}
    fattura={anteprimaFattura}
    commessa={commessa}
    cliente={cliente}
    xmlSDI={generaXMLSDI(anteprimaFattura, commessa, cliente)}
    onInvia={async () => {
      // 1. Invia a SDI tramite API intermediaria
      const res = await fetch('/api/sdi/invia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fattura_id: anteprimaFattura.dbId }),
      });

      if (!res.ok) throw new Error('Invio SDI fallito');

      // 2. Aggiorna stato in DB
      await supabase
        .from('fatture')
        .update({
          stato: 'inviata',
          inviata_il: new Date().toISOString(),
        })
        .eq('id', anteprimaFattura.dbId);

      // 3. Aggiorna UI locale (match su dbId!)
      setFatture(prev =>
        prev.map(f =>
          f.dbId === anteprimaFattura.dbId
            ? { ...f, stato: 'inviata' as const }
            : f
        )
      );
    }}
  />
)}


// ────────────────────────────────────────────────────────────────────────────
// 7) HELPER generaXMLSDI — se non esiste già, stub minimo
// ────────────────────────────────────────────────────────────────────────────

// Se hai già la funzione altrove, ignora questo blocco.
// Altrimenti importala da lib/sdi/genera-xml.ts:

// import { generaXMLSDI } from '@/lib/sdi/genera-xml';


// ============================================================================
// CHECKLIST APPLICAZIONE
// ============================================================================
//
// [ ] Cerca tutte le occorrenze: grep -rn "handlePagaFattura(" components/ app/
// [ ] Ogni call deve passare fattura.dbId (NON fattura.id)
// [ ] Verifica che il tipo Fattura abbia il campo dbId?: string
// [ ] Verifica che dopo INSERT in Supabase il dbId venga salvato in state
// [ ] Test S-0026: marca pagata acconto → riga DB aggiornata + UI aggiornata
// [ ] Test anteprima: click su "Anteprima e invia" → modale appare
// [ ] Test XML: tab XML mostra contenuto, "Scarica XML" produce file .xml
//
// ============================================================================
