// hooks/useNodi.ts

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { NodoTecnico } from '@/lib/types/nodi';

interface SistemaCanonico {
  id: string;
  nome: string;
  produttore: string;
  materiale: string;
}

interface ProfiloRef {
  codice: string;
  nome: string;
  tipo: string | null;
}

export function useNodi(azienda_id: string) {
  const [nodi, setNodi] = useState<NodoTecnico[]>([]);
  const [sistemi, setSistemi] = useState<SistemaCanonico[]>([]);
  const [profili, setProfili] = useState<ProfiloRef[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    const [n, s, p] = await Promise.all([
      supabase
        .from('catalogo_nodi_costruttivi')
        .select('*')
        .order('sistema_id')
        .order('nome'),
      supabase
        .from('catalogo_sistemi')
        .select('id, nome, produttore, materiale')
        .eq('attivo', true)
        .order('produttore')
        .order('nome'),
      supabase
        .from('catalogo_profili')
        .select('codice, nome, tipo')
        .order('codice'),
    ]);
    setNodi((n.data ?? []) as NodoTecnico[]);
    setSistemi((s.data ?? []) as SistemaCanonico[]);
    setProfili((p.data ?? []) as ProfiloRef[]);
    setLoading(false);
  }, []);

  const save = useCallback(
    async (nodo: Partial<NodoTecnico>) => {
      const { id, created_at, ...rest } = nodo;
      const payload = {
        ...rest,
        azienda_id: rest.azienda_id ?? azienda_id,
      };
      const op = id
        ? supabase.from('catalogo_nodi_costruttivi').update(payload).eq('id', id)
        : supabase.from('catalogo_nodi_costruttivi').insert(payload);
      const { error } = await op;
      if (error) return { ok: false, error: error.message };
      await reload();
      return { ok: true };
    },
    [azienda_id, reload]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('catalogo_nodi_costruttivi')
        .delete()
        .eq('id', id);
      if (error) return { ok: false, error: error.message };
      await reload();
      return { ok: true };
    },
    [reload]
  );

  const uploadAllegato = useCallback(
    async (file: File, kind: 'immagine' | 'dxf' | 'pdf'): Promise<string | null> => {
      const ext = file.name.split('.').pop() ?? 'bin';
      const path = `nodi/${kind}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from('profili-files')
        .upload(path, file, { upsert: true });
      if (error) {
        alert('Upload fallito: ' + error.message);
        return null;
      }
      const { data } = supabase.storage.from('profili-files').getPublicUrl(path);
      return data.publicUrl;
    },
    []
  );

  useEffect(() => { reload(); }, [reload]);

  return {
    nodi,
    sistemi,
    profili,
    loading,
    reload,
    save,
    remove,
    uploadAllegato,
  };
}
