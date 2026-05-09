// lib/integrations/fatture-in-cloud.ts
// Integrazione Fatture in Cloud per invio SDI automatico
// API docs: https://developers.fattureincloud.it/api-reference

const FIC_BASE = 'https://api-v2.fattureincloud.it';

export interface FicConfig {
  accessToken: string;       // OAuth2 token utente
  companyId: number;         // ID azienda Fatture in Cloud
}

export interface FicCustomer {
  name: string;
  vat_number?: string;
  tax_code?: string;
  email?: string;
  address_street?: string;
  address_postal_code?: string;
  address_city?: string;
  address_province?: string;
  ei_code?: string;          // Codice destinatario SDI
}

export interface FicInvoiceLine {
  product_id?: number;
  name: string;
  description?: string;
  qty: number;
  measure?: string;
  net_price: number;
  vat: { id: number };       // ID aliquota IVA (es. 22 = IVA 22%)
}

export interface FicInvoice {
  type: 'invoice';
  numeration?: string;
  date: string;              // ISO YYYY-MM-DD
  customer: FicCustomer | { id: number };
  items_list: FicInvoiceLine[];
  payment_method?: { id: number };
  payments_list?: Array<{
    amount: number;
    due_date: string;
    status: 'not_paid' | 'paid';
    payment_account?: { id: number };
  }>;
  e_invoice: boolean;        // true = invia a SDI
  ei_data?: {
    payment_method?: string;
  };
}

class FicError extends Error {
  constructor(public status: number, message: string, public detail?: any) {
    super(message);
  }
}

async function ficRequest<T>(
  config: FicConfig,
  method: string,
  path: string,
  body?: any
): Promise<T> {
  const url = `${FIC_BASE}/c/${config.companyId}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new FicError(res.status, errBody.error?.message ?? res.statusText, errBody);
  }

  return res.json();
}

// ==================== CUSTOMERS ====================

export async function findOrCreateCustomer(
  config: FicConfig,
  customer: FicCustomer
): Promise<{ id: number }> {
  // Cerca per VAT o tax_code
  const search = customer.vat_number || customer.tax_code;
  if (search) {
    const found = await ficRequest<{ data: any[] }>(
      config,
      'GET',
      `/entities/clients?q=${encodeURIComponent(search)}`
    );
    if (found.data && found.data.length > 0) {
      return { id: found.data[0].id };
    }
  }

  // Crea nuovo
  const created = await ficRequest<{ data: { id: number } }>(
    config,
    'POST',
    '/entities/clients',
    { data: customer }
  );
  return { id: created.data.id };
}

// ==================== INVOICES ====================

export async function createInvoice(
  config: FicConfig,
  invoice: FicInvoice
): Promise<{ id: number; number: string; pdf_url: string }> {
  const result = await ficRequest<{ data: any }>(
    config,
    'POST',
    '/issued_documents',
    { data: invoice }
  );

  return {
    id: result.data.id,
    number: result.data.number,
    pdf_url: result.data.url_attachment ?? '',
  };
}

export async function sendToSdi(
  config: FicConfig,
  invoiceId: number
): Promise<{ ok: boolean; sdi_status?: string }> {
  const result = await ficRequest<{ data: any }>(
    config,
    'POST',
    `/issued_documents/${invoiceId}/e_invoice`
  );

  return {
    ok: true,
    sdi_status: result.data?.status,
  };
}

// ==================== HIGH-LEVEL: MASTRO → FIC ====================

export async function pushMastroFatturaToFic(
  config: FicConfig,
  mastroFattura: {
    numero: string;
    data: string;
    cliente: FicCustomer;
    righe: Array<{
      descrizione: string;
      quantita: number;
      prezzo_unitario: number;
      iva_percent: number;
    }>;
    totale_imponibile: number;
    totale_iva: number;
    totale_documento: number;
    metodo_pagamento?: string;
  }
): Promise<{
  fic_invoice_id: number;
  fic_number: string;
  pdf_url: string;
  sdi_status: string;
}> {
  // 1. Trova/crea cliente
  const customer = await findOrCreateCustomer(config, mastroFattura.cliente);

  // 2. Mappa aliquote IVA (semplificata: solo 22%, 10%, 4%, 0%)
  const vatMap: Record<number, number> = { 22: 0, 10: 1, 4: 2, 0: 12 };

  // 3. Costruisci items_list
  const items = mastroFattura.righe.map((r) => ({
    name: r.descrizione,
    qty: r.quantita,
    net_price: r.prezzo_unitario,
    vat: { id: vatMap[r.iva_percent] ?? 0 },
  }));

  // 4. Crea fattura
  const invoice = await createInvoice(config, {
    type: 'invoice',
    numeration: '/M', // Numerazione separata MASTRO
    date: mastroFattura.data,
    customer: { id: customer.id },
    items_list: items,
    e_invoice: true,
    payments_list: [
      {
        amount: mastroFattura.totale_documento,
        due_date: mastroFattura.data,
        status: 'not_paid',
      },
    ],
  });

  // 5. Invia a SDI
  const sdi = await sendToSdi(config, invoice.id);

  return {
    fic_invoice_id: invoice.id,
    fic_number: invoice.number,
    pdf_url: invoice.pdf_url,
    sdi_status: sdi.sdi_status ?? 'queued',
  };
}
