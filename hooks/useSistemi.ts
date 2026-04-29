// hooks/useSistemi.ts
// Hook centrale modulo SISTEMI. Fetch + mutations su sistemi_profilo,
// azienda_sistemi_attivi, profili_catalogo, colori_sistemi, catalogo_vetri_sistema.

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  Sistema,
  AziendaSistemaAttivo,
  ProfiloCatalogo,
  ColoreSistema,
  ColoreCatalogo,
  VetroSistema,
  SistemaConStats,
} from '@/lib/types/sistemi';

interface UseSistemiReturn {
  sistemi: SistemaConStats[];
  loading: boolean;
  reload: () => Promise<void>;

  // Attivazione/preferito/prezzi per azienda
  toggleAttivo: (sistema_id: string) => Promise<{ ok: boolean; error?: string }>;
  togglePreferito: (sistema_id: string) => Promise<{ ok: boolean; error?: string }>;
  setPrezzoKg: (
    sistema_id: string,
    listino: number | null,
    netto: number | null,
    sconto: number | null
  ) => Promise<{ ok: boolean; error?: string }>;

  // CRUD sistema (admin master catalog)
  saveSistema: (s: Partial<Sistema>) => Promise<{ ok: boolean; error?: string }>;
  deleteSistema: (id: string) => Promise<{ ok: boolean; error?: string }>;

  // Sub-tabelle (lazy per sistema selezionato)
  profili: ProfiloCatalogo[];
  coloriSistema: ColoreSistema[];
  coloriCatalogo: ColoreCatalogo[];
  vetri: VetroSistema[];
  loadDettaglio: (sistema_id: string) => Promise<void>;

  // CRUD profili
  saveProfilo: (p: Partial<ProfiloCatalogo>) => Promise<{ ok: boolean; error?: string }>;
  deleteProfilo: (id: number) => Promise<{ ok: boolean; error?: string }>;

  // CRUD colori (associazione sistema <-> colore)
  attivaColore: (sistema_id: string, colore_id: number) => Promise<{ ok: boolean; error?: string }>;
  disattivaColore: (id: number) => Promise<{ ok: boolean; error?: string }>;

  // CRUD vetri sistema
  attivaVetro: (v: Partial<VetroSistema>) => Promise<{ ok: boolean; error?: string }>;
  disattivaVetro: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

export function useSistemi(azienda_id: string): UseSistemiReturn {
  const [sistemi, setSistemi] = useState<SistemaConStats[]>([]);
  const [attivazioni, setAttivazioni] = useState<AziendaSistemaAttivo[]>([]);
  const [loading, setLoading] = useState(false);

  const [profili, setProfili] = useState<ProfiloCatalogo[]>([]);
  const [coloriSistema, setColoriSistema] = useState<ColoreSistema[]>([]);
  const [coloriCatalogo, setColoriCatalogo] = useState<ColoreCatalogo[]>([]);
  const [vetri, setVetri] = useState<VetroSistema[]>([]);

  const reload = useCallback(async () => {
    setLoading(true);
    const [sx, ax, prCount, coCount, veCount] = await Promise.all([
      supabase.from('sistemi_profilo').select('*').order('marca').order('sistema'),
      supabase.from('azienda_sistemi_attivi').select('*').eq('azienda_id', azienda_id),
      supabase.from('profili_catalogo').select('sistema_id'),
      supabase.from('colori_sistemi').select('sistema_id'),
      supabase.from('catalogo_vetri_sistema').select('sistema_id'),
    ]);

    const baseSist = (sx.data ?? []) as Sistema[];
    const att = (ax.data ?? []) as AziendaSistemaAttivo[];
    setAttivazioni(att);

    const countBy = (arr: any[]) => {
      const m: Record<string, number> = {};
      for (const r of arr ?? []) {
        const k = r.sistema_id as string;
        if (!k) continue;
        m[k] = (m[k] ?? 0) + 1;
      }
      return m;
    };
    const cntPr = countBy(prCount.data ?? []);
    const cntCo = countBy(coCount.data ?? []);
    const cntVe = countBy(veCount.data ?? []);

    const merged: SistemaConStats[] = baseSist.map((s) => {
      const a = att.find((x) => x.sistema_id === s.id);
      return {
        ...s,
        attivo_azienda: a?.attivo ?? false,
        preferito: a?.preferito ?? false,
        attivazione_id: a?.id ?? null,
        n_profili: cntPr[s.id] ?? 0,
        n_colori: cntCo[s.id] ?? 0,
        n_vetri: cntVe[s.id] ?? 0,
      };
    });

    setSistemi(merged);
    setLoading(false);
  }, [azienda_id]);

  // -------- Attivazione/preferito/prezzi --------
  const upsertAttivazione = useCallback(
    async (sistema_id: string, patch: Partial<AziendaSistemaAttivo>) => {
      const existing = attivazioni.find((a) => a.sistema_id === sistema_id);
      const op = existing
        ? supabase.from('azienda_sistemi_attivi').update(patch).eq('id', existing.id)
        : supabase
            .from('azienda_sistemi_attivi')
            .insert({ azienda_id, sistema_id, ...patch });
      const { error } = await op;
      if (error) return { ok: false, error: error.message };
      await reload();
      return { ok: true };
    },
    [attivazioni, azienda_id, reload]
  );

  const toggleAttivo = useCallback(
    async (sistema_id: string) => {
      const cur = attivazioni.find((a) => a.sistema_id === sistema_id);
      return upsertAttivazione(sistema_id, { attivo: !(cur?.attivo ?? false) });
    },
    [attivazioni, upsertAttivazione]
  );

  const togglePreferito = useCallback(
    async (sistema_id: string) => {
      const cur = attivazioni.find((a) => a.sistema_id === sistema_id);
      return upsertAttivazione(sistema_id, {
        preferito: !(cur?.preferito ?? false),
        attivo: cur?.attivo ?? true,
      });
    },
    [attivazioni, upsertAttivazione]
  );

  const setPrezzoKg = useCallback(
    async (sistema_id: string, listino: number | null, netto: number | null, sconto: number | null) =>
      upsertAttivazione(sistema_id, {
        prezzo_kg_listino: listino,
        prezzo_kg_netto: netto,
        sconto_perc: sconto,
      }),
    [upsertAttivazione]
  );

  // -------- CRUD master sistema --------
  const saveSistema = useCallback(
    async (s: Partial<Sistema>) => {
      const { id, ...rest } = s;
      const op = id
        ? supabase.from('sistemi_profilo').update(rest).eq('id', id)
        : supabase.from('sistemi_profilo').insert(s);
      const { error } = await op;
      if (error) return { ok: false, error: error.message };
      await reload();
      return { ok: true };
    },
    [reload]
  );

  const deleteSistema = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('sistemi_profilo').delete().eq('id', id);
      if (error) return { ok: false, error: error.message };
      await reload();
      return { ok: true };
    },
    [reload]
  );

  // -------- Lazy load dettaglio sistema --------
  const loadDettaglio = useCallback(async (sistema_id: string) => {
    const [pr, cs, vc, cc] = await Promise.all([
      supabase
        .from('profili_catalogo')
        .select('*')
        .eq('sistema_id', sistema_id)
        .order('codice'),
      supabase.from('colori_sistemi').select('*').eq('sistema_id', sistema_id),
      supabase.from('catalogo_vetri_sistema').select('*').eq('sistema_id', sistema_id),
      supabase.from('colori_catalogo').select('*').order('nome'),
    ]);
    setProfili((pr.data ?? []) as ProfiloCatalogo[]);
    setColoriSistema((cs.data ?? []) as ColoreSistema[]);
    setVetri((vc.data ?? []) as VetroSistema[]);
    setColoriCatalogo((cc.data ?? []) as ColoreCatalogo[]);
  }, []);

  // -------- CRUD profili --------
  const saveProfilo = useCallback(
    async (p: Partial<ProfiloCatalogo>) => {
      const { id, ...rest } = p;
      const op = id
        ? supabase.from('profili_catalogo').update(rest).eq('id', id)
        : supabase.from('profili_catalogo').insert(rest);
      const { error } = await op;
      if (error) return { ok: false, error: error.message };
      if (p.sistema_id) await loadDettaglio(p.sistema_id);
      return { ok: true };
    },
    [loadDettaglio]
  );

  const deleteProfilo = useCallback(
    async (id: number) => {
      const target = profili.find((p) => p.id === id);
      const { error } = await supabase.from('profili_catalogo').delete().eq('id', id);
      if (error) return { ok: false, error: error.message };
      if (target?.sistema_id) await loadDettaglio(target.sistema_id);
      return { ok: true };
    },
    [profili, loadDettaglio]
  );

  // -------- Attiva/disattiva colori --------
  const attivaColore = useCallback(
    async (sistema_id: string, colore_id: number) => {
      const { error } = await supabase
        .from('colori_sistemi')
        .insert({ sistema_id, colore_id });
      if (error) return { ok: false, error: error.message };
      await loadDettaglio(sistema_id);
      return { ok: true };
    },
    [loadDettaglio]
  );

  const disattivaColore = useCallback(
    async (id: number) => {
      const target = coloriSistema.find((c) => c.id === id);
      const { error } = await supabase.from('colori_sistemi').delete().eq('id', id);
      if (error) return { ok: false, error: error.message };
      if (target?.sistema_id) await loadDettaglio(target.sistema_id);
      return { ok: true };
    },
    [coloriSistema, loadDettaglio]
  );

  // -------- Attiva/disattiva vetri --------
  const attivaVetro = useCallback(
    async (v: Partial<VetroSistema>) => {
      const { error } = await supabase.from('catalogo_vetri_sistema').insert(v);
      if (error) return { ok: false, error: error.message };
      if (v.sistema_id) await loadDettaglio(v.sistema_id);
      return { ok: true };
    },
    [loadDettaglio]
  );

  const disattivaVetro = useCallback(
    async (id: string) => {
      const target = vetri.find((x) => x.id === id);
      const { error } = await supabase
        .from('catalogo_vetri_sistema')
        .delete()
        .eq('id', id);
      if (error) return { ok: false, error: error.message };
      if (target?.sistema_id) await loadDettaglio(target.sistema_id);
      return { ok: true };
    },
    [vetri, loadDettaglio]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return useMemo(
    () => ({
      sistemi,
      loading,
      reload,
      toggleAttivo,
      togglePreferito,
      setPrezzoKg,
      saveSistema,
      deleteSistema,
      profili,
      coloriSistema,
      coloriCatalogo,
      vetri,
      loadDettaglio,
      saveProfilo,
      deleteProfilo,
      attivaColore,
      disattivaColore,
      attivaVetro,
      disattivaVetro,
    }),
    [
      sistemi,
      loading,
      reload,
      toggleAttivo,
      togglePreferito,
      setPrezzoKg,
      saveSistema,
      deleteSistema,
      profili,
      coloriSistema,
      coloriCatalogo,
      vetri,
      loadDettaglio,
      saveProfilo,
      deleteProfilo,
      attivaColore,
      disattivaColore,
      attivaVetro,
      disattivaVetro,
    ]
  );
}
