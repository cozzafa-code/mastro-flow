// lib/integrations/cnc-emmegi.ts
// Integrazione CNC Emmegi Centro 2 - generazione programmi taglio
// Format supportati: ENEA-XML, ISO G-Code, formato proprietario Emmegi (.emm)

export interface VanoTaglio {
  vano_id: string;
  vano_codice: string;        // es. "V01-Soggiorno"
  sistema: string;             // es. "Aluplast IDEAL 7000"
  larghezza_mm: number;
  altezza_mm: number;
  profili: ProfiloTaglio[];
}

export interface ProfiloTaglio {
  codice: string;              // es. "AL-T70-1"
  descrizione: string;
  lunghezza_mm: number;
  quantita: number;
  angolo_sx_deg: number;       // tipico 45° per telai
  angolo_dx_deg: number;
  lavorazioni?: Lavorazione[]; // forature, fresature
}

export interface Lavorazione {
  tipo: 'foro' | 'fresatura' | 'tasca';
  posizione_mm: number;        // distanza dall'inizio del profilo
  diametro_mm?: number;
  profondita_mm?: number;
  utensile?: string;           // es. "T01_FRESA_8mm"
}

export interface CncEmmegiConfig {
  endpoint_url: string;        // es. http://192.168.1.50:8080/api
  api_token?: string;
  formato: 'enea-xml' | 'gcode' | 'emm-native';
  postazione_default?: string; // es. "CENTRO2-01"
}

// ==================== GENERAZIONE PROGRAMMA ====================

/**
 * Genera programma di taglio per la macchina CNC.
 * Output: stringa nel formato richiesto dalla macchina.
 */
export function generaProgrammaTaglio(
  vani: VanoTaglio[],
  formato: CncEmmegiConfig['formato'],
  meta: { commessa_numero: string; data: string; operatore?: string }
): string {
  switch (formato) {
    case 'enea-xml':
      return generaEneaXml(vani, meta);
    case 'gcode':
      return generaGCode(vani, meta);
    case 'emm-native':
      return generaEmmNative(vani, meta);
    default:
      throw new Error(`Formato non supportato: ${formato}`);
  }
}

// ----------- ENEA-XML (standard industria serramenti) -----------

function generaEneaXml(vani: VanoTaglio[], meta: any): string {
  const items: string[] = [];

  vani.forEach((v) => {
    v.profili.forEach((p) => {
      for (let i = 0; i < p.quantita; i++) {
        items.push(`
    <CutItem>
      <Code>${escapeXml(p.codice)}</Code>
      <Description>${escapeXml(p.descrizione)}</Description>
      <Length>${p.lunghezza_mm}</Length>
      <AngleStart>${p.angolo_sx_deg}</AngleStart>
      <AngleEnd>${p.angolo_dx_deg}</AngleEnd>
      <Quantity>1</Quantity>
      <VanoRef>${escapeXml(v.vano_codice)}</VanoRef>
      ${(p.lavorazioni || []).map((l) => `
      <Operation type="${l.tipo}" pos="${l.posizione_mm}" ${l.diametro_mm ? `dia="${l.diametro_mm}"` : ''} ${l.profondita_mm ? `depth="${l.profondita_mm}"` : ''} ${l.utensile ? `tool="${l.utensile}"` : ''} />`).join('')}
    </CutItem>`);
      }
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<CutList xmlns="http://enea.it/schema/cutlist/v1">
  <Header>
    <CommessaNumero>${escapeXml(meta.commessa_numero)}</CommessaNumero>
    <Data>${meta.data}</Data>
    ${meta.operatore ? `<Operatore>${escapeXml(meta.operatore)}</Operatore>` : ''}
    <GeneratedBy>MASTRO Suite</GeneratedBy>
  </Header>
  <Items>${items.join('')}
  </Items>
</CutList>`;
}

// ----------- ISO G-Code (compatibile macchine generiche) -----------

function generaGCode(vani: VanoTaglio[], meta: any): string {
  const lines: string[] = [
    '%',
    `(MASTRO - Commessa ${meta.commessa_numero})`,
    `(Data: ${meta.data})`,
    'G21 G90 G94', // mm, assoluto, feed mm/min
    'G17',         // piano XY
    'M03 S6000',   // rotazione mandrino
    '',
  ];

  let progN = 100;

  vani.forEach((v) => {
    lines.push(`(=== Vano ${v.vano_codice} ===)`);
    v.profili.forEach((p) => {
      for (let i = 0; i < p.quantita; i++) {
        lines.push(`(${p.codice} - ${p.descrizione} - L=${p.lunghezza_mm}mm)`);
        lines.push(`N${progN} G00 X0 Y0`);
        progN += 10;
        lines.push(`N${progN} G01 X${p.lunghezza_mm} F2000`);
        progN += 10;

        // Lavorazioni
        (p.lavorazioni || []).forEach((l) => {
          if (l.tipo === 'foro' && l.posizione_mm && l.profondita_mm) {
            lines.push(`N${progN} G00 X${l.posizione_mm} Y0`);
            progN += 10;
            lines.push(`N${progN} G81 R5 Z-${l.profondita_mm} F500`);
            progN += 10;
            lines.push(`N${progN} G80`);
            progN += 10;
          }
        });
        lines.push('');
      }
    });
  });

  lines.push('M05'); // stop mandrino
  lines.push('M30'); // fine programma
  lines.push('%');
  return lines.join('\n');
}

// ----------- Formato proprietario Emmegi (.emm) -----------

function generaEmmNative(vani: VanoTaglio[], meta: any): string {
  // Formato semplificato (la specifica esatta varia per modello)
  const rows: string[] = [
    `[HEADER]`,
    `MACHINE=EMMEGI_CENTRO_2`,
    `JOB=${meta.commessa_numero}`,
    `DATE=${meta.data}`,
    `[CUTS]`,
  ];

  vani.forEach((v) => {
    v.profili.forEach((p) => {
      for (let i = 0; i < p.quantita; i++) {
        rows.push(
          `${p.codice};${p.lunghezza_mm};${p.angolo_sx_deg};${p.angolo_dx_deg};${v.vano_codice}`
        );
      }
    });
  });

  rows.push('[END]');
  return rows.join('\r\n');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ==================== INVIO ALLA MACCHINA ====================

export async function inviaProgrammaACnc(
  config: CncEmmegiConfig,
  programma: string,
  filename: string
): Promise<{ success: boolean; job_id?: string; message?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', new Blob([programma], { type: 'text/plain' }), filename);
    if (config.postazione_default) {
      formData.append('postazione', config.postazione_default);
    }

    const headers: HeadersInit = {};
    if (config.api_token) {
      headers['Authorization'] = `Bearer ${config.api_token}`;
    }

    const res = await fetch(`${config.endpoint_url}/jobs`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      return {
        success: false,
        message: `CNC respinge programma: HTTP ${res.status}`,
      };
    }

    const data = await res.json().catch(() => ({}));
    return {
      success: true,
      job_id: data.job_id || data.id,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message ?? 'Errore di rete con CNC',
    };
  }
}
