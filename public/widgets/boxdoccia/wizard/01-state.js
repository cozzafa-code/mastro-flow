/* MASTRO Box Doccia - Module: state + supabase helpers
   File: public/widgets/boxdoccia/wizard/01-state.js
*/
(function () {
  'use strict';

  window.MastroBD = window.MastroBD || {};

  const state = {
    step: 1,
    fornitore: null,
    serie: null,
    configurazione: null,
    modello: null,
    apertura: null,
    misure: {
      parete_sx: { alto: null, medio: null, basso: null },
      parete_dx: { alto: null, medio: null, basso: null },
      top: { sx: null, centro: null, dx: null },
      diagonali: { d1: null, d2: null },
      piatto: { w: null, d: null },
      pavimento: { inclinazione_gradi: 0, verso_scarico: 'centrale' },
      ostacoli: [],
      foto_cantiere: [],
      note_libere: ''
    },
    profili: { finitura_id: null, finitura_nome: null, hex: null, supplemento: 0 },
    cristallo: {
      id: null, codice: null, tipologia: 'BASE',
      spessore_mm: 8, materiale: 'VETRO_TEMPERATO',
      decori: [], trattamenti: ['anticalcare']
    },
    piatto: {
      modalita: 'standard', modello_id: null,
      w_cm: null, d_cm: null, h_cm: 4, colore: 'bianco_opaco'
    },
    scarico: 'centrale',
    bom: []
  };

  const cache = {
    fornitori: null, serie: null, modelli: null,
    finiture: null, cristalli: null, componenti: null
  };

  async function fetchTable(table, params) {
    const key = window.MASTRO_SUPABASE_ANON_KEY;
    const url = window.MASTRO_SUPABASE_URL + '/rest/v1/' + table + '?' + (params || '');
    const r = await fetch(url, {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      }
    });
    if (!r.ok) throw new Error(table + ': ' + r.status);
    return r.json();
  }

  function getAziendaId() {
    return window.MASTRO_AZIENDA_ID || 'ccca51c1-656b-4e7c-a501-55753e20da29';
  }

  function calcolaFuoriSquadro(m) {
    const sxArr = [m.parete_sx.alto, m.parete_sx.medio, m.parete_sx.basso].filter(v => v);
    const dxArr = [m.parete_dx.alto, m.parete_dx.medio, m.parete_dx.basso].filter(v => v);
    const topArr = [m.top.sx, m.top.centro, m.top.dx].filter(v => v);
    const asimmetriaSx = sxArr.length >= 2 ? Math.max.apply(null, sxArr) - Math.min.apply(null, sxArr) : 0;
    const asimmetriaDx = dxArr.length >= 2 ? Math.max.apply(null, dxArr) - Math.min.apply(null, dxArr) : 0;
    const asimmetriaTop = topArr.length >= 2 ? Math.max.apply(null, topArr) - Math.min.apply(null, topArr) : 0;
    const maxFs = Math.max(asimmetriaSx, asimmetriaDx, asimmetriaTop);
    const diagDelta = m.diagonali.d1 && m.diagonali.d2 ? Math.abs(m.diagonali.d1 - m.diagonali.d2) : 0;
    return {
      asimmetria_sx_mm: asimmetriaSx,
      asimmetria_dx_mm: asimmetriaDx,
      asimmetria_top_mm: asimmetriaTop,
      max_fuori_squadro_mm: maxFs,
      richiede_compensatori: maxFs > 15,
      delta_diagonali_mm: diagDelta,
      squadrato: diagDelta < 5
    };
  }

  window.MastroBD.state = state;
  window.MastroBD.cache = cache;
  window.MastroBD.fetchTable = fetchTable;
  window.MastroBD.getAziendaId = getAziendaId;
  window.MastroBD.calcolaFuoriSquadro = calcolaFuoriSquadro;
})();
