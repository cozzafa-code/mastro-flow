// app/api/v1/leads/route.ts
// MASTRO API v1 - Crea lead da fonte esterna (sito, landing, scraping)
// Header: Authorization: Bearer mk_live_xxx
// Scope richiesto: leads:write

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth } from '@/lib/api/auth-middleware';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// CORS headers per chiamate da siti web esterni
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export const POST = withApiAuth(async (req, ctx) => {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', message: 'Body non valido' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const {
    nome,
    cognome,
    telefono,
    email,
    indirizzo,
    comune,
    provincia,
    richiesta,
    fonte,
    fonte_ref,
    note,
  } = body;

  // Validazione minima: serve almeno nome o telefono o email
  if (!nome && !telefono && !email) {
    return NextResponse.json(
      { error: 'missing_contact', message: 'Almeno uno tra nome, telefono o email è obbligatorio' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('lead_esterni')
    .insert({
      azienda_id: ctx.aziendaId,
      nome: nome || null,
      cognome: cognome || null,
      telefono: telefono || null,
      email: email || null,
      indirizzo: indirizzo || null,
      comune: comune || null,
      provincia: provincia || null,
      richiesta: richiesta || null,
      fonte: fonte || 'api',
      fonte_ref: fonte_ref || null,
      note: note || null,
      stato: 'nuovo',
      creato_il: new Date().toISOString(),
    })
    .select('id, nome, cognome, telefono, email, fonte, stato, creato_il')
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'db_error', message: error.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data,
      message: 'Lead creato con successo',
    },
    { status: 201, headers: CORS_HEADERS }
  );
}, { scope: 'leads:write' });
