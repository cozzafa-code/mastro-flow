// app/dev/page.tsx
// MASTRO Dev Console - tester live API
// Accesso: solo loggato + ruolo admin/owner/titolare
// Indipendente dalla home, dal modal Settings, da tutto il resto

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// fliwoX palette
const C = {
  navy: '#1E3A5F',
  navyDark: '#0F1B2D',
  navyMute: '#B8C5D6',
  cream: '#F5F0E8',
  white: '#FFFFFF',
  amber: '#E89F3F',
  red: '#C44545',
  greenBg: '#E8F0E5',
  greenText: '#2D5F3F',
  borderWarm: '#d8cfc0',
  textMuted: '#6b6358',
};

const ALL_SCOPES = [
  'commesse:read', 'commesse:write',
  'fatture:read', 'fatture:write',
  'clienti:read', 'clienti:write',
  'vani:read', 'vani:write',
  'cnc:write',
  'leads:write',
  'webhook:receive',
];

const ENDPOINTS = [
  { method: 'GET',  path: '/api/v1/status',       scope: '(pubblico)', body: null },
  { method: 'GET',  path: '/api/v1/commesse',     scope: 'commesse:read', body: null },
  { method: 'GET',  path: '/api/v1/fatture',      scope: 'fatture:read',  body: null },
  { method: 'POST', path: '/api/v1/leads',        scope: 'leads:write',   body: { nome: 'Mario Rossi', email: 'mario@test.it', telefono: '3331234567', note: 'Test da MASTRO Dev Console' } },
];

export default function DevConsole() {
  const [user, setUser] = useState<any>(null);
  const [keys, setKeys] = useState<any[]>([]);
  const [stats, setStats] = useState({ keysAttive: 0, chiamate24h: 0, logTotali: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Generatore inline
  const [showGen, setShowGen] = useState(false);
  const [genName, setGenName] = useState('Test ' + new Date().toLocaleDateString('it-IT'));
  const [genScopes, setGenScopes] = useState<string[]>(['commesse:read', 'fatture:read', 'leads:write']);
  const [genExpiry, setGenExpiry] = useState(30);
  const [generated, setGenerated] = useState<{ plaintext: string; prefix: string } | null>(null);

  // Tester
  const [selectedKey, setSelectedKey] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // ==================== LOAD ====================
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setErrorMsg('Non sei loggato. Vai su mastro-erp.vercel.app/login.');
          setLoading(false);
          return;
        }
        setUser(session.user);

        // Profilo
        const { data: profile } = await supabase
          .from('profiles')
          .select('azienda_id, ruolo')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile?.azienda_id) {
          setErrorMsg('Profilo senza azienda associata.');
          setLoading(false);
          return;
        }

        // Carica keys
        const { data: keysData } = await supabase
          .from('api_keys')
          .select('id, name, key_prefix, scopes, created_at, expires_at, revoked_at, last_used_at')
          .eq('azienda_id', profile.azienda_id)
          .order('created_at', { ascending: false });

        setKeys(keysData || []);

        // Stats
        const attive = (keysData || []).filter(k => !k.revoked_at).length;
        const { count: chiamate24h } = await supabase
          .from('api_logs')
          .select('*', { count: 'exact', head: true })
          .eq('azienda_id', profile.azienda_id)
          .gte('created_at', new Date(Date.now() - 86400000).toISOString());
        const { count: logTotali } = await supabase
          .from('api_logs')
          .select('*', { count: 'exact', head: true })
          .eq('azienda_id', profile.azienda_id);

        setStats({
          keysAttive: attive,
          chiamate24h: chiamate24h || 0,
          logTotali: logTotali || 0,
        });
      } catch (e: any) {
        setErrorMsg(e?.message || 'Errore caricamento');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ==================== GENERA KEY ====================
  async function generaKey() {
    setErrorMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg('Sessione scaduta. Rifai login.');
        return;
      }

      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: genName,
          scopes: genScopes,
          expiresInDays: genExpiry,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || data.error || 'Errore generazione');
        return;
      }

      setGenerated({ plaintext: data.plaintext, prefix: data.key_prefix });
      // Refresh lista
      setKeys([data, ...keys]);
      setStats(s => ({ ...s, keysAttive: s.keysAttive + 1 }));
    } catch (e: any) {
      setErrorMsg(e?.message || 'Errore rete');
    }
  }

  function toggleScope(scope: string) {
    setGenScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  }

  // ==================== TESTER ====================
  async function testEndpoint(idx: number) {
    const ep = ENDPOINTS[idx];
    const apiKey = selectedKey || customKey || generated?.plaintext;

    if (!apiKey && ep.scope !== '(pubblico)') {
      setTestResults(r => ({ ...r, [idx]: { error: 'Nessuna API key selezionata' } }));
      return;
    }

    setTestResults(r => ({ ...r, [idx]: { loading: true } }));

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKey && ep.scope !== '(pubblico)') {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const t0 = performance.now();
      const res = await fetch(ep.path, {
        method: ep.method,
        headers,
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      const ms = Math.round(performance.now() - t0);

      let body: any;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('json')) {
        body = await res.json();
      } else {
        body = await res.text();
      }

      setTestResults(r => ({
        ...r,
        [idx]: { status: res.status, ok: res.ok, ms, body },
      }));
    } catch (e: any) {
      setTestResults(r => ({ ...r, [idx]: { error: e?.message || 'Errore rete' } }));
    }
  }

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}>
        <p style={{ color: C.navy, fontSize: 14 }}>Caricamento...</p>
      </div>
    );
  }

  if (errorMsg && !user) {
    return (
      <div style={{ minHeight: '100vh', background: C.cream, padding: 40, fontFamily: 'Inter,sans-serif' }}>
        <div style={{ maxWidth: 480, margin: '40px auto', background: C.white, padding: 32, borderRadius: 16, border: `1px solid ${C.borderWarm}` }}>
          <h1 style={{ color: C.red, fontSize: 20, margin: 0 }}>⚠️ {errorMsg}</h1>
          <a href="/" style={{ color: C.navy, fontSize: 14, marginTop: 16, display: 'inline-block' }}>← Torna alla home</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Inter,sans-serif', padding: '32px 16px 80px' }}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>

        {/* HEADER */}
        <header style={{ marginBottom: 32 }}>
          <p style={{ margin: 0, color: C.amber, fontSize: 11, fontWeight: 700, letterSpacing: 2 }}>MASTRO DEV CONSOLE</p>
          <h1 style={{ margin: '8px 0 4px', fontSize: 32, fontWeight: 800, color: C.navy, letterSpacing: '-0.5px' }}>
            API Keys & Tester
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted }}>
            {user.email} · genera, testa, e monitora in 1 schermata
          </p>
        </header>

        {/* STATS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
          <Stat label="CHIAVI ATTIVE" value={stats.keysAttive} accent={C.navy} />
          <Stat label="CHIAMATE 24H" value={stats.chiamate24h} accent={C.greenText} />
          <Stat label="LOG TOTALI" value={stats.logTotali} accent={C.amber} />
        </div>

        {/* GENERATORE */}
        <Section title="1. Genera nuova API Key">
          {!showGen ? (
            <button onClick={() => setShowGen(true)} style={btnPrimary}>+ NUOVA API KEY</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={lblSmall}>NOME</label>
                <input
                  value={genName}
                  onChange={e => setGenName(e.target.value)}
                  style={inputStyle}
                  placeholder="es. Sito web produzione"
                />
              </div>

              <div>
                <label style={lblSmall}>SCOPE</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 6 }}>
                  {ALL_SCOPES.map(s => (
                    <label key={s} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px',
                      background: genScopes.includes(s) ? C.greenBg : C.white,
                      border: `1px solid ${genScopes.includes(s) ? C.greenText : C.borderWarm}`,
                      borderRadius: 8, cursor: 'pointer', fontSize: 12,
                    }}>
                      <input
                        type="checkbox"
                        checked={genScopes.includes(s)}
                        onChange={() => toggleScope(s)}
                        style={{ margin: 0 }}
                      />
                      <code style={{ fontFamily: "'JetBrains Mono', monospace", color: genScopes.includes(s) ? C.greenText : C.navy }}>{s}</code>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={lblSmall}>SCADENZA (giorni)</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[30, 90, 365, 0].map(d => (
                    <button key={d} onClick={() => setGenExpiry(d)} style={{
                      flex: 1, padding: '8px 12px',
                      background: genExpiry === d ? C.navy : C.white,
                      color: genExpiry === d ? C.cream : C.navy,
                      border: `1px solid ${C.navy}`, borderRadius: 8,
                      cursor: 'pointer', fontWeight: 700, fontSize: 12,
                    }}>
                      {d === 0 ? 'MAI' : d}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div style={{ padding: 10, background: '#FFE5E5', color: C.red, borderRadius: 8, fontSize: 12 }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={generaKey} style={{ ...btnPrimary, flex: 1 }} disabled={!genName || genScopes.length === 0}>
                  GENERA
                </button>
                <button onClick={() => { setShowGen(false); setGenerated(null); setErrorMsg(''); }} style={btnGhost}>
                  ANNULLA
                </button>
              </div>

              {generated && (
                <div style={{
                  background: '#FFF8E5', border: `2px solid ${C.amber}`,
                  borderRadius: 10, padding: 16, marginTop: 8,
                }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.amber, letterSpacing: 1 }}>
                    ⚠️ COPIA SUBITO — NON SARÀ PIÙ MOSTRATA
                  </p>
                  <code style={{
                    display: 'block', marginTop: 8, padding: 12,
                    background: C.navyDark, color: C.cream,
                    borderRadius: 8, fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12, wordBreak: 'break-all',
                  }}>
                    {generated.plaintext}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(generated.plaintext); }}
                    style={{ ...btnGhost, marginTop: 8, width: '100%' }}
                  >
                    📋 COPIA NEGLI APPUNTI
                  </button>
                </div>
              )}
            </div>
          )}
        </Section>

        {/* LISTA KEYS */}
        <Section title={`2. Le tue API Keys (${keys.length})`}>
          {keys.length === 0 ? (
            <p style={{ color: C.textMuted, fontSize: 13, margin: 0 }}>
              Nessuna chiave ancora. Genera la prima sopra.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {keys.map(k => (
                <div key={k.id} style={{
                  padding: 12,
                  background: k.revoked_at ? '#F5F5F5' : C.white,
                  border: `1px solid ${C.borderWarm}`,
                  borderRadius: 10,
                  opacity: k.revoked_at ? 0.6 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <strong style={{ color: C.navy, fontSize: 14 }}>{k.name}</strong>
                      <code style={{
                        display: 'block', marginTop: 2, fontSize: 11,
                        color: C.textMuted, fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        {k.key_prefix}••••••••••
                      </code>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      {(k.scopes || []).slice(0, 3).map((s: string) => (
                        <span key={s} style={{
                          fontSize: 9, padding: '2px 6px',
                          background: C.greenBg, color: C.greenText,
                          borderRadius: 4, fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {s}
                        </span>
                      ))}
                      {(k.scopes || []).length > 3 && (
                        <span style={{ fontSize: 10, color: C.textMuted }}>+{k.scopes.length - 3}</span>
                      )}
                      <span style={{
                        fontSize: 9, padding: '3px 7px',
                        background: k.revoked_at ? C.red : C.greenText, color: C.white,
                        borderRadius: 4, fontWeight: 700, letterSpacing: 0.5,
                      }}>
                        {k.revoked_at ? 'REVOCATA' : 'ATTIVA'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* TESTER */}
        <Section title="3. Tester endpoint">
          <div style={{ marginBottom: 12 }}>
            <label style={lblSmall}>API KEY DA USARE</label>
            <input
              value={customKey}
              onChange={e => { setCustomKey(e.target.value); setSelectedKey(''); }}
              placeholder={generated?.plaintext ? "Usa la key appena generata" : "mk_live_xxxxx (incolla qui)"}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
            />
            {generated && (
              <button
                onClick={() => setCustomKey(generated.plaintext)}
                style={{ ...btnGhost, marginTop: 6, fontSize: 11, padding: '6px 10px' }}
              >
                ↑ Usa la chiave appena generata
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ENDPOINTS.map((ep, idx) => {
              const r = testResults[idx];
              return (
                <div key={idx} style={{ background: C.white, border: `1px solid ${C.borderWarm}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 4,
                      background: ep.method === 'GET' ? C.navy : C.amber,
                      color: ep.method === 'GET' ? C.cream : C.navyDark,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {ep.method}
                    </span>
                    <code style={{ fontSize: 12, color: C.navy, fontFamily: "'JetBrains Mono', monospace" }}>
                      {ep.path}
                    </code>
                    <code style={{ fontSize: 10, color: C.textMuted, marginLeft: 'auto' }}>
                      {ep.scope}
                    </code>
                    <button onClick={() => testEndpoint(idx)} style={{
                      ...btnPrimary, padding: '6px 12px', fontSize: 11,
                    }}>
                      TESTA
                    </button>
                  </div>

                  {r && (
                    <div style={{ marginTop: 10 }}>
                      {r.loading && <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>Chiamata in corso...</p>}
                      {r.error && <p style={{ fontSize: 11, color: C.red, margin: 0 }}>❌ {r.error}</p>}
                      {r.status && (
                        <>
                          <div style={{ fontSize: 11, marginBottom: 6 }}>
                            <strong style={{ color: r.ok ? C.greenText : C.red }}>
                              {r.status} {r.ok ? '✓' : '✗'}
                            </strong>
                            <span style={{ color: C.textMuted, marginLeft: 8 }}>· {r.ms}ms</span>
                          </div>
                          <pre style={{
                            background: C.navyDark, color: C.cream,
                            padding: 10, borderRadius: 6, fontSize: 10,
                            margin: 0, overflowX: 'auto', maxHeight: 200,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            {typeof r.body === 'string' ? r.body : JSON.stringify(r.body, null, 2)}
                          </pre>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        {/* LINKS */}
        <Section title="4. Risorse">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="/api-docs" target="_blank" style={btnGhost as any}>📘 Documentazione API</a>
            <a href="/integrazioni" target="_blank" style={btnGhost as any}>🔌 Integrazioni</a>
          </div>
        </Section>
      </div>
    </div>
  );
}

// ==================== UI HELPERS ====================
function Stat({ label, value, accent }: any) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.borderWarm}`,
      borderRadius: 12, padding: 16,
    }}>
      <p style={{ margin: 0, fontSize: 9, color: C.textMuted, fontWeight: 700, letterSpacing: 1 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700, color: accent, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{
        fontSize: 13, fontWeight: 700, color: C.navy,
        textTransform: 'uppercase', letterSpacing: 1,
        margin: '0 0 12px',
      }}>
        {title}
      </h2>
      <div style={{
        background: C.white, border: `1px solid ${C.borderWarm}`,
        borderRadius: 14, padding: 16,
      }}>
        {children}
      </div>
    </section>
  );
}

const inputStyle: any = {
  width: '100%', padding: '10px 12px',
  border: `1px solid ${C.borderWarm}`, borderRadius: 8,
  fontSize: 13, background: C.white, color: C.navy,
  fontFamily: 'inherit',
};

const lblSmall: any = {
  display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: 1,
  color: C.textMuted, marginBottom: 4,
};

const btnPrimary: any = {
  background: C.navy, color: C.cream,
  border: 'none', borderRadius: 10,
  padding: '10px 18px', fontWeight: 700, fontSize: 12,
  letterSpacing: 0.5, cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnGhost: any = {
  background: C.white, color: C.navy,
  border: `1px solid ${C.navy}`, borderRadius: 10,
  padding: '10px 16px', fontWeight: 700, fontSize: 12,
  letterSpacing: 0.5, cursor: 'pointer',
  textDecoration: 'none', display: 'inline-block',
  fontFamily: 'inherit',
};
