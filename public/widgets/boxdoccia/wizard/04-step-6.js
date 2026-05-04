/* MASTRO Box Doccia - Module: render step 6 (misure professionali)
   File: public/widgets/boxdoccia/wizard/04-step-6.js
*/
(function () {
  'use strict';
  const M = window.MastroBD;
  const escape = M.escape;
  const shellHead = M.shellHead;

  function fld(path, val) {
    return '<input type="number" value="' + (val || '') + '" data-path="' + path + '">';
  }

  function buildSummary(fs) {
    const cls = fs.richiede_compensatori ? 'bd-summary-warn' : 'bd-summary-ok';
    const txt = fs.richiede_compensatori ? '⚠ Richiede profili compensatori (>15mm)' : '✓ Entro tolleranza standard';
    return '<div class="bd-summary ' + cls + '"><strong>Fuori squadro max: ' + fs.max_fuori_squadro_mm + 'mm</strong><span>' + txt + '</span></div>';
  }

  function buildTab3punti(m, fs) {
    return '<div id="bd-tab-3punti" class="bd-tab-pane bd-tab-pane-active">' +
      '<h3>Misurazione 3 punti (mm)</h3>' +
      '<div class="bd-3punti">' +
        '<div class="bd-col"><h4>Parete SX</h4>' +
        '<label>Alto ' + fld('parete_sx.alto', m.parete_sx.alto) + '</label>' +
        '<label>Medio ' + fld('parete_sx.medio', m.parete_sx.medio) + '</label>' +
        '<label>Basso ' + fld('parete_sx.basso', m.parete_sx.basso) + '</label>' +
        (fs.asimmetria_sx_mm > 0 ? '<small class="bd-warn">Δ ' + fs.asimmetria_sx_mm + 'mm</small>' : '') +
        '</div>' +
        '<div class="bd-col"><h4>Top</h4>' +
        '<label>SX ' + fld('top.sx', m.top.sx) + '</label>' +
        '<label>Centro ' + fld('top.centro', m.top.centro) + '</label>' +
        '<label>DX ' + fld('top.dx', m.top.dx) + '</label>' +
        (fs.asimmetria_top_mm > 0 ? '<small class="bd-warn">Δ ' + fs.asimmetria_top_mm + 'mm</small>' : '') +
        '</div>' +
        '<div class="bd-col"><h4>Parete DX</h4>' +
        '<label>Alto ' + fld('parete_dx.alto', m.parete_dx.alto) + '</label>' +
        '<label>Medio ' + fld('parete_dx.medio', m.parete_dx.medio) + '</label>' +
        '<label>Basso ' + fld('parete_dx.basso', m.parete_dx.basso) + '</label>' +
        (fs.asimmetria_dx_mm > 0 ? '<small class="bd-warn">Δ ' + fs.asimmetria_dx_mm + 'mm</small>' : '') +
        '</div>' +
      '</div>' +
      '<h3>Diagonali</h3>' +
      '<div class="bd-row">' +
        '<label>D1 ' + fld('diagonali.d1', m.diagonali.d1) + '</label>' +
        '<label>D2 ' + fld('diagonali.d2', m.diagonali.d2) + '</label>' +
        (fs.delta_diagonali_mm > 0 ? '<small class="' + (fs.squadrato ? 'bd-ok' : 'bd-warn') + '">Δ ' + fs.delta_diagonali_mm + 'mm ' + (fs.squadrato ? '✓' : '⚠') + '</small>' : '') +
      '</div>' +
      '<h3>Piatto (cm)</h3>' +
      '<div class="bd-row"><label>W ' + fld('piatto.w', m.piatto.w) + '</label><label>D ' + fld('piatto.d', m.piatto.d) + '</label></div>' +
      '<h3>Pavimento</h3>' +
      '<div class="bd-row">' +
        '<label>Inclinaz ° <input type="number" step="0.1" value="' + (m.pavimento.inclinazione_gradi || 0) + '" data-path="pavimento.inclinazione_gradi"></label>' +
        '<label>Verso scarico <select data-path="pavimento.verso_scarico">' +
          '<option value="centrale"' + (m.pavimento.verso_scarico === 'centrale' ? ' selected' : '') + '>Centrale</option>' +
          '<option value="sx"' + (m.pavimento.verso_scarico === 'sx' ? ' selected' : '') + '>SX</option>' +
          '<option value="dx"' + (m.pavimento.verso_scarico === 'dx' ? ' selected' : '') + '>DX</option>' +
          '<option value="lineare"' + (m.pavimento.verso_scarico === 'lineare' ? ' selected' : '') + '>Lineare</option>' +
        '</select></label>' +
      '</div>' +
      buildSummary(fs) +
      '<h3>Note</h3><textarea data-path="note_libere" rows="3">' + escape(m.note_libere) + '</textarea>' +
    '</div>';
  }

  function bindInputs(host) {
    host.querySelectorAll('[data-path]').forEach(inp => {
      inp.addEventListener('input', e => {
        const path = e.target.dataset.path;
        const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
        const parts = path.split('.');
        let obj = M.state.misure;
        for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
        obj[parts[parts.length - 1]] = val;
        const fs2 = M.calcolaFuoriSquadro(M.state.misure);
        const sum = host.querySelector('.bd-summary');
        if (sum) sum.outerHTML = buildSummary(fs2);
      });
    });
  }

  function renderStep6() {
    const host = M.ensureHost();
    const m = M.state.misure;
    const fs = M.calcolaFuoriSquadro(m);

    const tabs = '<div class="bd-tabs">' +
      '<button class="bd-tab bd-tab-active" data-tab="3punti" onclick="MastroBoxDoccia.tabMisure(\'3punti\')">3 punti</button>' +
      '<button class="bd-tab" data-tab="3d" onclick="MastroBoxDoccia.tabMisure(\'3d\')">3D</button>' +
      '<button class="bd-tab" data-tab="pianta" onclick="MastroBoxDoccia.tabMisure(\'pianta\')">Pianta</button>' +
      '<button class="bd-tab" data-tab="disegna" onclick="MastroBoxDoccia.tabMisure(\'disegna\')">Disegna</button>' +
      '<button class="bd-tab" data-tab="foto" onclick="MastroBoxDoccia.tabMisure(\'foto\')">Foto</button>' +
      '</div>';

    const altri =
      '<div id="bd-tab-3d" class="bd-tab-pane"><div id="bd-canvas-3d-host"></div></div>' +
      '<div id="bd-tab-pianta" class="bd-tab-pane"><div id="bd-canvas-pianta-host"></div></div>' +
      '<div id="bd-tab-disegna" class="bd-tab-pane"><div id="bd-canvas-disegna-host"></div></div>' +
      '<div id="bd-tab-foto" class="bd-tab-pane"><div id="bd-canvas-foto-host"></div></div>';

    const back = M.state.modello.tipo_apertura === 'MISTO' ? 5 : 4;
    host.innerHTML = '<div class="bd-wizard-shell">' +
      shellHead(6, 'Misure professionali', back) +
      '<div class="bd-step-body">' + tabs + buildTab3punti(m, fs) + altri + '</div>' +
      '<footer class="bd-wizard-foot"><button class="bd-btn-primary" onclick="MastroBoxDoccia.goStep(7)">Avanti ›</button></footer>' +
    '</div>';

    bindInputs(host);
  }

  M.steps = M.steps || {};
  M.steps.s6 = renderStep6;
})();
