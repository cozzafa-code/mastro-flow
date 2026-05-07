// lib/home/useHomeCardState.ts
// Riusa cloudSave/cloudLoadAll esistenti in components/mastro-constants.tsx
// Schema user_data: id, user_id, azienda_id, key, data (jsonb), updated_at
// Upsert gestito a monte da cloudSave con onConflict: user_id,azienda_id,key
import { useState, useEffect, useCallback, useRef } from 'react';
import { cloudSave, cloudLoadAll } from '@/components/mastro-constants';

const STORAGE_KEY = 'mastro_home_mobile_state';

export type HomeCardState = {
  order: string[];
  expanded: string[];
};

export const DEFAULT_ORDER = [
  'oggi-operativo', 'team-live', 'commesse-critiche', 'problemi',
  'agenda-live', 'produzione', 'carico-lavoro', 'cassa', 'azioni-rapide',
];

export const DEFAULT_EXPANDED = ['oggi-operativo'];

export function useHomeCardState(userId: string | null) {
  const [state, setState] = useState<HomeCardState>({
    order: DEFAULT_ORDER,
    expanded: DEFAULT_EXPANDED,
  });
  const [loaded, setLoaded] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!userId || initialized.current) { if (!userId) setLoaded(true); return; }
    initialized.current = true;
    let cancelled = false;
    (async () => {
      try {
        const all = await cloudLoadAll(userId);
        if (cancelled) return;
        const saved = all?.[STORAGE_KEY];
        if (saved?.order && Array.isArray(saved.order)) {
          const validOrder = saved.order.filter((id: string) => DEFAULT_ORDER.includes(id));
          const missing = DEFAULT_ORDER.filter(id => !validOrder.includes(id));
          setState({
            order: [...validOrder, ...missing],
            expanded: Array.isArray(saved.expanded) ? saved.expanded : DEFAULT_EXPANDED,
          });
        }
      } catch (e) {
        console.warn('[useHomeCardState] load failed', e);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const persist = useCallback((next: HomeCardState) => {
    if (!userId) return;
    cloudSave(userId, STORAGE_KEY, next);
  }, [userId]);

  const setOrder = useCallback((newOrder: string[]) => {
    setState(prev => { const next = { ...prev, order: newOrder }; persist(next); return next; });
  }, [persist]);

  const toggleExpanded = useCallback((id: string) => {
    setState(prev => {
      const isOpen = prev.expanded.includes(id);
      const next = {
        ...prev,
        expanded: isOpen ? prev.expanded.filter(x => x !== id) : [...prev.expanded, id],
      };
      persist(next); return next;
    });
  }, [persist]);

  const expandAll = useCallback(() => {
    setState(prev => { const next = { ...prev, expanded: [...prev.order] }; persist(next); return next; });
  }, [persist]);

  const collapseAll = useCallback(() => {
    setState(prev => { const next = { ...prev, expanded: [] }; persist(next); return next; });
  }, [persist]);

  const navigateTo = useCallback((currentId: string, direction: 'next' | 'prev') => {
    setState(prev => {
      const idx = prev.order.indexOf(currentId);
      const target = direction === 'next' ? idx + 1 : idx - 1;
      if (target < 0 || target >= prev.order.length) return prev;
      const next = { ...prev, expanded: [prev.order[target]] };
      persist(next); return next;
    });
  }, [persist]);

  const reset = useCallback(() => {
    const next = { order: DEFAULT_ORDER, expanded: DEFAULT_EXPANDED };
    setState(next); persist(next);
  }, [persist]);

  return {
    order: state.order,
    expanded: state.expanded,
    isExpanded: (id: string) => state.expanded.includes(id),
    setOrder, toggleExpanded, expandAll, collapseAll, navigateTo, reset, loaded,
  };
}
