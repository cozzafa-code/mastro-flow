// lib/excel-helpers.ts
// Wrapper xlsx (SheetJS) per download template e parse upload.

import * as XLSX from 'xlsx';

export interface SheetColumn {
  key: string;       // chiave interna del campo (es. 'codice')
  header: string;    // intestazione visibile (es. 'Codice articolo')
  width?: number;    // larghezza colonna (chars)
  example?: any;     // valore esempio nella riga 2 del template
  required?: boolean;
}

/**
 * Genera e scarica un file Excel-template con header + 1 riga esempio + 5 righe vuote.
 */
export function downloadTemplate(filename: string, sheetName: string, columns: SheetColumn[]) {
  const headerRow = columns.map(c => c.header + (c.required ? ' *' : ''));
  const exampleRow = columns.map(c => c.example ?? '');
  const emptyRows = Array.from({ length: 5 }, () => columns.map(() => ''));

  const data = [headerRow, exampleRow, ...emptyRows];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Larghezze colonne
  ws['!cols'] = columns.map(c => ({ wch: c.width ?? Math.max(12, c.header.length + 2) }));

  // Formato bold sulla riga header
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cellAddr = XLSX.utils.encode_cell({ r: 0, c: C });
    if (ws[cellAddr]) {
      ws[cellAddr].s = { font: { bold: true } };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/**
 * Legge un file Excel uploadato e lo trasforma in array di oggetti
 * basandosi sulla mappa columns. Skippa righe vuote o di esempio.
 */
export async function parseUpload<T extends Record<string, any>>(
  file: File,
  columns: SheetColumn[]
): Promise<{ rows: T[]; warnings: string[] }> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: null, raw: false });

  const headerToKey = new Map<string, string>();
  for (const col of columns) {
    headerToKey.set(col.header.toLowerCase().trim(), col.key);
    headerToKey.set((col.header + ' *').toLowerCase().trim(), col.key);
  }

  const rows: T[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < json.length; i++) {
    const raw = json[i];
    const obj: Record<string, any> = {};
    let hasAny = false;
    for (const k of Object.keys(raw)) {
      const mapped = headerToKey.get(k.toLowerCase().trim());
      if (!mapped) continue;
      const v = raw[k];
      if (v != null && v !== '') hasAny = true;
      obj[mapped] = v;
    }
    if (!hasAny) continue;

    // Verifica required
    for (const col of columns) {
      if (col.required && (obj[col.key] == null || obj[col.key] === '')) {
        warnings.push(`Riga ${i + 2}: manca campo obbligatorio "${col.header}"`);
      }
    }

    rows.push(obj as T);
  }

  return { rows, warnings };
}
