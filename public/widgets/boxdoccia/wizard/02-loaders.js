/* MASTRO Box Doccia - Module: catalog data loaders
   File: public/widgets/boxdoccia/wizard/02-loaders.js
*/
(function () {
  'use strict';
  const M = window.MastroBD;
  const fetchTable = M.fetchTable;

  async function loadFornitori() {
    if (M.cache.fornitori) return M.cache.fornitori;
    M.cache.fornitori = await fetchTable(
      'boxdoccia_catalogo_fornitore',
      'azienda_id=eq.' + M.getAziendaId() + '&attivo=eq.true&order=nome.asc'
    );
    return M.cache.fornitori;
  }

  async function loadSerie(fornitoreId) {
    M.cache.serie = await fetchTable(
      'boxdoccia_catalogo_serie',
      'azienda_id=eq.' + M.getAziendaId() + '&fornitore_id=eq.' + fornitoreId + '&attivo=eq.true&order=ordine.asc'
    );
    return M.cache.serie;
  }

  async function loadModelli(serieId, configurazione) {
    let q = 'azienda_id=eq.' + M.getAziendaId() + '&serie_id=eq.' + serieId + '&attivo=eq.true';
    if (configurazione) q += '&configurazione=eq.' + configurazione;
    M.cache.modelli = await fetchTable('boxdoccia_catalogo_modello', q + '&order=nome.asc');
    return M.cache.modelli;
  }

  async function loadFiniture(modelloId) {
    const link = await fetchTable('boxdoccia_catalogo_modello_finitura', 'modello_id=eq.' + modelloId);
    if (!link.length) {
      return await fetchTable(
        'boxdoccia_catalogo_finitura',
        'azienda_id=eq.' + M.getAziendaId() + '&attivo=eq.true&order=nome.asc'
      );
    }
    const ids = link.map(l => l.finitura_id).join(',');
    return await fetchTable(
      'boxdoccia_catalogo_finitura',
      'id=in.(' + ids + ')&attivo=eq.true&order=nome.asc'
    );
  }

  async function loadCristalli(modelloId) {
    const link = await fetchTable('boxdoccia_catalogo_modello_cristallo', 'modello_id=eq.' + modelloId);
    if (!link.length) {
      return await fetchTable(
        'boxdoccia_catalogo_cristallo',
        'azienda_id=eq.' + M.getAziendaId() + '&attivo=eq.true&order=nome.asc'
      );
    }
    const ids = link.map(l => l.cristallo_id).join(',');
    return await fetchTable(
      'boxdoccia_catalogo_cristallo',
      'id=in.(' + ids + ')&attivo=eq.true&order=nome.asc'
    );
  }

  async function loadComponentiAuto(modelloId) {
    const link = await fetchTable('boxdoccia_modello_componente', 'modello_id=eq.' + modelloId);
    if (!link.length) return [];
    const ids = link.map(l => l.componente_id).join(',');
    const comps = await fetchTable('boxdoccia_componente', 'id=in.(' + ids + ')&attivo=eq.true');
    return comps.map(c => {
      const l = link.find(x => x.componente_id === c.id);
      return Object.assign({}, c, {
        quantita: l.quantita, obbligatorio: l.obbligatorio, incluso_serie: l.incluso_serie
      });
    });
  }

  M.loaders = {
    fornitori: loadFornitori,
    serie: loadSerie,
    modelli: loadModelli,
    finiture: loadFiniture,
    cristalli: loadCristalli,
    componentiAuto: loadComponentiAuto
  };
})();
