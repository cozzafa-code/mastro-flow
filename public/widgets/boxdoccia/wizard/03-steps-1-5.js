/* MASTRO Box Doccia - Module: render steps 1-5
   File: public/widgets/boxdoccia/wizard/03-steps-1-5.js
*/
(function () {
  'use strict';
  const M = window.MastroBD;
  const HOST_ID = 'mastro-bd-wizard';

  function ensureHost() {
    let el = document.getElementById(HOST_ID);
    if (!el) {
      el = document.createElement('div');
      el.id = HOST_ID;
      el.className = 'mastro-bd-wizard';
      document.body.appendChild(el);
    }
    return el;
  }

  function escape(s) { return String(s == null ? '' : s).replace(/'/g, '&#39;').replace(/"/g, '&quot;'); }
  function shellHead(stepNum, title, backStep) {
    return '<header class="bd-wizard-head">' +
      (backStep ? '<button class="bd-back" onclick="MastroBoxDoccia.goStep(' + backStep + ')">&lsaquo;</button>' : '') +
      '<span class="bd-step-num">' + stepNum + ' / 9</span>' +
      '<h2>' + title + '</h2>' +
      '<button class="bd-close" onclick="MastroBoxDoccia.close()">&times;</button>' +
    '</header>';
  }

  async function renderStep1() {
    const host = ensureHost();
    host.innerHTML = '<div class="bd-loading">Caricamento fornitori...</div>';
    let fornitori = [];
    try { fornitori = await M.loaders.fornitori(); } catch (e) { console.error(e); fornitori = []; }
    let body;
    if (!fornitori.length) {
      body = '<div class="bd-empty"><p>Nessun fornitore in catalogo.</p>' +
        '<button class="bd-btn-primary" onclick="MastroBoxDoccia.goToImpostazioni()">+ Aggiungi fornitore</button></div>';
    } else {
      body = fornitori.map(f =>
        '<button class="bd-card" onclick="MastroBoxDoccia.selFornitore(\'' + f.id + '\',\'' + escape(f.nome) + '\')">' +
        (f.logo_url ? '<img src="' + escape(f.logo_url) + '" alt="">' : '<div class="bd-card-noimg">' + (f.nome || '?')[0] + '</div>') +
        '<span class="bd-card-name">' + escape(f.nome) + '</span></button>'
      ).join('');
    }
    host.innerHTML = '<div class="bd-wizard-shell">' +
      shellHead(1, 'Fornitore', null) +
      '<div class="bd-step-body"><div class="bd-grid">' + body + '</div></div>' +
      '<footer class="bd-wizard-foot"><button class="bd-btn-ghost" onclick="MastroBoxDoccia.goToImpostazioni()">+ Aggiungi fornitore</button></footer>' +
    '</div>';
  }

  async function renderStep2() {
    const host = ensureHost();
    host.innerHTML = '<div class="bd-loading">Caricamento serie...</div>';
    const serie = await M.loaders.serie(M.state.fornitore.id);
    let body;
    if (!serie.length) {
      body = '<div class="bd-empty"><p>Nessuna serie per questo fornitore.</p>' +
        '<button class="bd-btn-primary" onclick="MastroBoxDoccia.goToImpostazioni()">+ Aggiungi serie</button></div>';
    } else {
      body = serie.map(s => {
        const json = escape(JSON.stringify(s));
        const tags = (s.spessore_cristallo_mm || []).map(sp => '<li>' + sp + 'mm</li>').join('') +
          (s.altezza_max_speciale_cm ? '<li>fino ' + s.altezza_max_speciale_cm + 'cm</li>' : '') +
          (s.tipo_chiusura || []).map(t => '<li>' + t.replace(/_/g, ' ') + '</li>').join('') +
          (s.realizzazione === 'SU_MISURA' ? '<li class="bd-tag-ok">su misura</li>' : '');
        return '<button class="bd-card bd-card-lg" onclick="MastroBoxDoccia.selSerie(JSON.parse(this.dataset.s))" data-s="' + json + '">' +
          (s.immagine_url ? '<img src="' + escape(s.immagine_url) + '">' : '<div class="bd-card-noimg">' + (s.nome || '?')[0] + '</div>') +
          '<div class="bd-card-meta"><strong>' + escape(s.nome) + '</strong>' +
          (s.descrizione ? '<small>' + escape(s.descrizione) + '</small>' : '') +
          '<ul class="bd-card-tags">' + tags + '</ul></div></button>';
      }).join('');
    }
    host.innerHTML = '<div class="bd-wizard-shell">' +
      shellHead(2, 'Serie · ' + escape(M.state.fornitore.nome), 1) +
      '<div class="bd-step-body"><div class="bd-grid">' + body + '</div></div></div>';
  }

  function renderStep3() {
    const host = ensureHost();
    const configs = [
      ['NICCHIA', 'Nicchia', '▢'], ['NICCHIA_PANNELLO', 'Nicchia + pannello', '▢|'],
      ['ANGOLO', 'Angolo', '⌐'], ['ANGOLO_PANNELLO', 'Angolo + pannello', '⌐|'],
      ['WALK_IN', 'Walk-in', '|'], ['TRE_LATI', 'Tre lati', '⊐'],
      ['DOPPIA_PORTA', 'Doppia porta', '|+|'], ['TONDO', 'Tondo', '◯'],
      ['SEMICIRCOLARE', 'Semicircolare', '◗'], ['SEMICIRCOLARE_ASIMMETRICO', 'Semicirc. asim.', '◐'],
      ['PENTAGONALE', 'Pentagonale', '⬠'], ['GRANDI_LASTRE', 'Grandi lastre', '▮'],
      ['SOPRAVASCA', 'Sopravasca', '⊑'], ['PARETE_VASCA', 'Parete vasca', '|⊑'],
      ['PARETE_DIVISORIA_SOFFITTO', 'Divisoria soffitto', '⊓'], ['CABINA_ATTREZZATA', 'Cabina attrezzata', '⊞']
    ];
    const body = configs.map(c =>
      '<button class="bd-config-tile" onclick="MastroBoxDoccia.selConfig(\'' + c[0] + '\',\'' + c[1] + '\')">' +
      '<span class="bd-config-icon">' + c[2] + '</span>' +
      '<span class="bd-config-label">' + c[1] + '</span></button>'
    ).join('');
    host.innerHTML = '<div class="bd-wizard-shell">' +
      shellHead(3, 'Configurazione', 2) +
      '<div class="bd-step-body"><div class="bd-grid bd-grid-config">' + body + '</div></div></div>';
  }

  async function renderStep4() {
    const host = ensureHost();
    host.innerHTML = '<div class="bd-loading">Caricamento modelli...</div>';
    const modelli = await M.loaders.modelli(M.state.serie.id, M.state.configurazione);
    let body;
    if (!modelli.length) {
      body = '<div class="bd-empty"><p>Nessun modello per questa configurazione.</p></div>';
    } else {
      body = '<div class="bd-list">' + modelli.map(m => {
        const json = escape(JSON.stringify(m));
        const sub = (m.w_min_cm ? 'w ' + m.w_min_cm + '-' + m.w_max_cm + 'cm' : '') +
          (m.d_min_cm ? ' · d ' + m.d_min_cm + '-' + m.d_max_cm + 'cm' : '') +
          ' · h ' + (m.h_min_cm || 200) + 'cm' +
          (m.tipo_apertura ? ' · ' + m.tipo_apertura.toLowerCase() : '');
        return '<button class="bd-list-row" onclick="MastroBoxDoccia.selModello(JSON.parse(this.dataset.m))" data-m="' + json + '">' +
          '<div class="bd-list-main"><strong>' + escape((m.codice_articolo || '') + ' · ' + m.nome) + '</strong>' +
          '<small>' + sub + '</small></div>' +
          (m.prezzo_vendita ? '<span class="bd-list-price">€ ' + m.prezzo_vendita + '</span>' : '') +
          '</button>';
      }).join('') + '</div>';
    }
    host.innerHTML = '<div class="bd-wizard-shell">' +
      shellHead(4, 'Modello', 3) +
      '<div class="bd-step-body">' + body + '</div></div>';
  }

  function renderStep5() {
    if (M.state.modello.tipo_apertura && M.state.modello.tipo_apertura !== 'MISTO') {
      M.state.apertura = M.state.modello.tipo_apertura;
      return window.MastroBoxDoccia.goStep(6);
    }
    const host = ensureHost();
    const aperture = [
      ['BATTENTE', 'Battente'], ['SCORREVOLE', 'Scorrevole'], ['PIVOT', 'Pivot'],
      ['SOFFIETTO', 'Soffietto'], ['PIEGHEVOLE', 'Pieghevole'], ['SALOON', 'Saloon'],
      ['BILICO', 'Bilico'], ['TRASLANTE', 'Traslante'], ['GIREVOLE_90', 'Girevole 90°'],
      ['FISSO', 'Fisso (walk-in)']
    ];
    const body = aperture.map(a =>
      '<button class="bd-config-tile" onclick="MastroBoxDoccia.selApertura(\'' + a[0] + '\')">' +
      '<span class="bd-config-label">' + a[1] + '</span></button>'
    ).join('');
    host.innerHTML = '<div class="bd-wizard-shell">' +
      shellHead(5, 'Apertura', 4) +
      '<div class="bd-step-body"><div class="bd-grid bd-grid-config">' + body + '</div></div></div>';
  }

  M.steps = M.steps || {};
  M.steps.s1 = renderStep1;
  M.steps.s2 = renderStep2;
  M.steps.s3 = renderStep3;
  M.steps.s4 = renderStep4;
  M.steps.s5 = renderStep5;
  M.ensureHost = ensureHost;
  M.escape = escape;
  M.shellHead = shellHead;
})();
