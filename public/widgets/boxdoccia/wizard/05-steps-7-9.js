/* MASTRO Box Doccia - Module: render steps 7-9 + public API
   File: public/widgets/boxdoccia/wizard/05-steps-7-9.js
*/
(function () {
  'use strict';
  const M = window.MastroBD;
  const escape = M.escape;
  const shellHead = M.shellHead;

  async function renderStep7() {
    const host = M.ensureHost();
    host.innerHTML = '<div class="bd-loading">Caricamento finiture...</div>';
    const finiture = await M.loaders.finiture(M.state.modello.id);
    const body = finiture.map(f => {
      const json = escape(JSON.stringify(f));
      return '<button class="bd-finitura-tile" style="--col:' + (f.hex_color || '#999') + '" onclick="MastroBoxDoccia.selFinitura(JSON.parse(this.dataset.f))" data-f="' + json + '">' +
        '<span class="bd-finitura-swatch"></span>' +
        '<span class="bd-finitura-name">' + escape(f.nome) + '</span>' +
        (f.ral ? '<small>' + escape(f.ral) + '</small>' : '') +
        (f.prezzo_supplemento > 0 ? '<small class="bd-supplemento">+€' + f.prezzo_supplemento + '</small>' : '') +
        '</button>';
    }).join('');
    host.innerHTML = '<div class="bd-wizard-shell">' +
      shellHead(7, 'Profili', 6) +
      '<div class="bd-step-body"><div class="bd-grid bd-grid-finiture">' + body + '</div></div></div>';
  }

  function buildCristallo(c, active) {
    const json = escape(JSON.stringify(c));
    return '<button class="bd-cristallo-tile' + active + '" onclick="MastroBoxDoccia.selCristalloBase(JSON.parse(this.dataset.c))" data-c="' + json + '">' +
      (c.immagine_url ? '<img src="' + escape(c.immagine_url) + '">' : '') +
      '<strong>' + escape(c.nome) + '</strong>' +
      '<small>' + c.spessore_mm + 'mm · ' + c.materiale.replace(/_/g, ' ').toLowerCase() + '</small>' +
      '</button>';
  }

  function buildDecoro(d, checked) {
    const json = escape(JSON.stringify(d));
    const active = checked ? ' bd-active' : '';
    return '<label class="bd-decoro-tile' + active + '">' +
      '<input type="checkbox" data-decoro="' + json + '" ' + (checked ? 'checked' : '') + '>' +
      (d.immagine_url ? '<img src="' + escape(d.immagine_url) + '">' : '') +
      '<strong>' + escape(d.nome) + '</strong>' +
      '<small>' + d.tipologia.replace(/_/g, ' ').toLowerCase() + '</small></label>';
  }

  async function renderStep8() {
    const host = M.ensureHost();
    host.innerHTML = '<div class="bd-loading">Caricamento cristalli...</div>';
    const cristalli = await M.loaders.cristalli(M.state.modello.id);
    const base = cristalli.filter(c => c.tipologia === 'BASE');
    const decori = cristalli.filter(c => c.tipologia === 'SERIGRAFIA' || c.tipologia === 'DECORO_ARTISTICO');

    const baseHtml = base.map(c => buildCristallo(c, M.state.cristallo.id === c.id ? ' bd-active' : '')).join('');
    const decoriHtml = decori.map(d => buildDecoro(d, !!M.state.cristallo.decori.find(x => x.id === d.id))).join('');

    const trattamenti = ['anticalcare', 'easyclean', 'anti_impronta', 'brillbox', 'antibatterico'];
    const trattHtml = trattamenti.map(t => {
      const checked = M.state.cristallo.trattamenti.indexOf(t) !== -1;
      return '<label class="bd-trattamento' + (checked ? ' bd-active' : '') + '">' +
        '<input type="checkbox" data-tratt="' + t + '"' + (checked ? ' checked' : '') + '>' +
        '<span>' + t.replace(/_/g, ' ') + '</span></label>';
    }).join('');

    host.innerHTML = '<div class="bd-wizard-shell">' +
      shellHead(8, 'Cristallo', 7) +
      '<div class="bd-step-body">' +
      '<h3>Cristallo base</h3><div class="bd-grid bd-grid-cristalli">' + baseHtml + '</div>' +
      '<h3>Decori (multi)</h3><div class="bd-grid bd-grid-decori">' + decoriHtml + '</div>' +
      '<h3>Trattamenti (multi)</h3><div class="bd-trattamenti">' + trattHtml + '</div>' +
      '</div>' +
      '<footer class="bd-wizard-foot"><button class="bd-btn-primary" onclick="MastroBoxDoccia.goStep(9)">Avanti ›</button></footer>' +
      '</div>';

    host.querySelectorAll('[data-decoro]').forEach(cb => {
      cb.addEventListener('change', e => {
        const d = JSON.parse(e.target.dataset.decoro);
        if (e.target.checked) M.state.cristallo.decori.push({ id: d.id, codice: d.codice_articolo, tipo: d.tipologia, nome: d.nome });
        else M.state.cristallo.decori = M.state.cristallo.decori.filter(x => x.id !== d.id);
      });
    });
    host.querySelectorAll('[data-tratt]').forEach(cb => {
      cb.addEventListener('change', e => {
        const t = e.target.dataset.tratt;
        if (e.target.checked && M.state.cristallo.trattamenti.indexOf(t) === -1) M.state.cristallo.trattamenti.push(t);
        else if (!e.target.checked) M.state.cristallo.trattamenti = M.state.cristallo.trattamenti.filter(x => x !== t);
      });
    });
  }

  function buildBomRows(comps) {
    if (!comps.length) return '<p class="bd-empty">Nessun componente auto-collegato.</p>';
    return comps.map(c =>
      '<div class="bd-bom-row' + (c.auto ? ' bd-bom-auto' : '') + '">' +
      '<span class="bd-bom-cat">' + c.categoria.replace(/_/g, ' ').toLowerCase() + '</span>' +
      '<span class="bd-bom-name">' + escape(c.nome) + '</span>' +
      '<span class="bd-bom-qty">×' + c.quantita + '</span>' +
      (c.incluso_serie ? '<span class="bd-bom-incluso">incluso</span>' : '') +
      (c.auto ? '<span class="bd-bom-auto-tag">auto</span>' : '') +
      '</div>'
    ).join('');
  }

  function buildRecap(fs) {
    const s = M.state;
    return '<ul>' +
      '<li><strong>Fornitore:</strong> ' + escape(s.fornitore.nome) + '</li>' +
      '<li><strong>Serie:</strong> ' + escape(s.serie.nome) + '</li>' +
      '<li><strong>Modello:</strong> ' + escape((s.modello.codice_articolo || '') + ' ' + s.modello.nome) + '</li>' +
      '<li><strong>Configurazione:</strong> ' + s.configurazione + '</li>' +
      '<li><strong>Apertura:</strong> ' + (s.apertura || 'n/d') + '</li>' +
      '<li><strong>Profilo:</strong> ' + (s.profili.finitura_nome || 'n/d') + '</li>' +
      '<li><strong>Cristallo:</strong> ' + (s.cristallo.codice || 'n/d') + ' ' + s.cristallo.spessore_mm + 'mm</li>' +
      '<li><strong>Trattamenti:</strong> ' + (s.cristallo.trattamenti.join(', ') || 'nessuno') + '</li>' +
      '<li><strong>Decori:</strong> ' + (s.cristallo.decori.map(d => d.nome).join(', ') || 'nessuno') + '</li>' +
      '<li><strong>Fuori squadro max:</strong> ' + fs.max_fuori_squadro_mm + 'mm ' + (fs.richiede_compensatori ? '⚠' : '✓') + '</li>' +
      '</ul>';
  }

  async function renderStep9() {
    const host = M.ensureHost();
    host.innerHTML = '<div class="bd-loading">Calcolo distinta materiali...</div>';
    const compsAuto = await M.loaders.componentiAuto(M.state.modello.id);
    const fs = M.calcolaFuoriSquadro(M.state.misure);

    if (fs.richiede_compensatori && !compsAuto.find(c => c.categoria === 'PROFILO_COMPENSATORE')) {
      compsAuto.push({
        id: 'auto-comp-' + Date.now(),
        categoria: 'PROFILO_COMPENSATORE',
        nome: 'Profilo compensatore ' + (Math.ceil(fs.max_fuori_squadro_mm / 10) * 10) + 'mm (auto)',
        quantita: Math.ceil(fs.max_fuori_squadro_mm / 10),
        obbligatorio: true, incluso_serie: false, auto: true
      });
    }
    M.state.bom = compsAuto;

    const piattoMod = M.state.piatto.modalita;
    const sc = M.state.scarico;
    const rad = (n, v, l, sel) => '<label><input type="radio" name="' + n + '" value="' + v + '"' + (sel === v ? ' checked' : '') + '> ' + l + '</label>';

    host.innerHTML = '<div class="bd-wizard-shell">' +
      shellHead(9, 'Piatto · Scarico · BOM', 8) +
      '<div class="bd-step-body">' +
      '<h3>Piatto doccia</h3>' +
      '<div class="bd-radio-row">' +
        rad('piatto-mod', 'standard', 'Standard catalogo', piattoMod) +
        rad('piatto-mod', 'fuori_misura', 'Fuori misura preset', piattoMod) +
        rad('piatto-mod', 'su_misura', 'Su misura libero', piattoMod) +
      '</div>' +
      '<div class="bd-row">' +
        '<label>W cm <input type="number" id="piatto-w" value="' + (M.state.piatto.w_cm || M.state.misure.piatto.w || '') + '"></label>' +
        '<label>D cm <input type="number" id="piatto-d" value="' + (M.state.piatto.d_cm || M.state.misure.piatto.d || '') + '"></label>' +
        '<label>Spessore <input type="number" id="piatto-h" value="' + (M.state.piatto.h_cm || 4) + '"></label>' +
        '<label>Colore <select id="piatto-colore">' +
          '<option value="bianco_opaco">Bianco opaco</option>' +
          '<option value="grigio_opaco">Grigio opaco</option>' +
          '<option value="nero_opaco">Nero opaco</option>' +
          '<option value="tortora">Tortora</option>' +
        '</select></label>' +
      '</div>' +
      '<h3>Scarico</h3>' +
      '<div class="bd-radio-row">' +
        rad('scarico', 'centrale', 'Centrale', sc) +
        rad('scarico', 'laterale', 'Laterale', sc) +
        rad('scarico', 'lineare', 'Lineare (canalina)', sc) +
      '</div>' +
      '<h3>Distinta materiali (auto)</h3>' +
      '<div class="bd-bom">' + buildBomRows(compsAuto) + '</div>' +
      '<button class="bd-btn-ghost" onclick="MastroBoxDoccia.aggiungiComponenteManuale()">+ Aggiungi componente</button>' +
      '<div class="bd-recap"><h3>Riepilogo</h3>' + buildRecap(fs) + '</div>' +
      '</div>' +
      '<footer class="bd-wizard-foot"><button class="bd-btn-primary bd-btn-save" onclick="MastroBoxDoccia.salva()">✓ Salva configurazione</button></footer>' +
      '</div>';

    host.querySelector('#piatto-colore').value = M.state.piatto.colore;
    host.querySelectorAll('input[name="piatto-mod"]').forEach(r => r.addEventListener('change', e => M.state.piatto.modalita = e.target.value));
    host.querySelector('#piatto-w').addEventListener('input', e => M.state.piatto.w_cm = Number(e.target.value));
    host.querySelector('#piatto-d').addEventListener('input', e => M.state.piatto.d_cm = Number(e.target.value));
    host.querySelector('#piatto-h').addEventListener('input', e => M.state.piatto.h_cm = Number(e.target.value));
    host.querySelector('#piatto-colore').addEventListener('change', e => M.state.piatto.colore = e.target.value);
    host.querySelectorAll('input[name="scarico"]').forEach(r => r.addEventListener('change', e => M.state.scarico = e.target.value));
  }

  M.steps = M.steps || {};
  M.steps.s7 = renderStep7;
  M.steps.s8 = renderStep8;
  M.steps.s9 = renderStep9;

  // ============ API PUBBLICA ============
  window.MastroBoxDoccia = {
    open(opts) {
      opts = opts || {};
      if (opts.azienda_id) window.MASTRO_AZIENDA_ID = opts.azienda_id;
      M.state.step = 1;
      M.steps.s1();
    },
    close() { const el = document.getElementById('mastro-bd-wizard'); if (el) el.remove(); },
    goStep(n) { M.state.step = n; M.steps['s' + n](); },
    goToImpostazioni() { window.location.href = '/impostazioni/box-doccia'; },
    selFornitore(id, nome) { M.state.fornitore = { id: id, nome: nome }; this.goStep(2); },
    selSerie(s) { M.state.serie = s; this.goStep(3); },
    selConfig(id) { M.state.configurazione = id; this.goStep(4); },
    selModello(m) {
      M.state.modello = m;
      if (m.w_min_cm && !M.state.misure.piatto.w) M.state.misure.piatto.w = m.w_min_cm;
      if (m.d_min_cm && !M.state.misure.piatto.d) M.state.misure.piatto.d = m.d_min_cm;
      this.goStep(5);
    },
    selApertura(id) { M.state.apertura = id; this.goStep(6); },
    tabMisure(tab) {
      document.querySelectorAll('.bd-tab').forEach(t => t.classList.toggle('bd-tab-active', t.dataset.tab === tab));
      document.querySelectorAll('.bd-tab-pane').forEach(p => p.classList.toggle('bd-tab-pane-active', p.id === 'bd-tab-' + tab));
      if (window.MastroBoxDocciaCanvasInit && tab !== '3punti') window.MastroBoxDocciaCanvasInit(tab, M.state);
    },
    selFinitura(f) {
      M.state.profili = { finitura_id: f.id, finitura_nome: f.nome, hex: f.hex_color, supplemento: f.prezzo_supplemento || 0 };
      this.goStep(8);
    },
    selCristalloBase(c) {
      M.state.cristallo.id = c.id;
      M.state.cristallo.codice = c.codice_articolo;
      M.state.cristallo.spessore_mm = c.spessore_mm;
      M.state.cristallo.materiale = c.materiale;
      M.steps.s8();
    },
    aggiungiComponenteManuale() {
      const nome = prompt('Nome componente:');
      if (!nome) return;
      const qty = Number(prompt('Quantità:', '1')) || 1;
      M.state.bom.push({ id: 'manual-' + Date.now(), categoria: 'ALTRO', nome: nome, quantita: qty, obbligatorio: false, incluso_serie: false, auto: false });
      M.steps.s9();
    },
    async salva() {
      const fs = M.calcolaFuoriSquadro(M.state.misure);
      const config = {
        fornitore_id: M.state.fornitore.id, fornitore_nome: M.state.fornitore.nome,
        serie_id: M.state.serie.id, serie_nome: M.state.serie.nome,
        modello_id: M.state.modello.id, codice_articolo_fornitore: M.state.modello.codice_articolo,
        configurazione: M.state.configurazione, tipo_apertura: M.state.apertura,
        profili: M.state.profili, cristallo: M.state.cristallo,
        piatto: M.state.piatto, scarico: M.state.scarico,
        bom_componenti: M.state.bom.map(c => ({
          componente_id: c.id, categoria: c.categoria, nome: c.nome,
          qty: c.quantita, auto: !!c.auto, incluso_serie: !!c.incluso_serie
        }))
      };
      const misure = Object.assign({}, M.state.misure, { fuori_squadro_calcolato: fs });
      if (window.MastroBoxDocciaOnSave) {
        try { await window.MastroBoxDocciaOnSave({ config: config, misure: misure }); }
        catch (e) { console.error(e); alert('Errore salvataggio: ' + e.message); return; }
      } else {
        console.log('[BD] config:', config); console.log('[BD] misure:', misure);
        alert('Demo: implementare MastroBoxDocciaOnSave per persistenza Supabase.');
      }
      this.close();
    },
    _state: M.state
  };
})();
