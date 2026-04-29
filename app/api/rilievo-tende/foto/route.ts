import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Upload foto del rilievo tende (foto principale o particolare).
// Salva in bucket foto-vani con path dedicato: {azienda}/vani/{vanoId}/rilievo-tende/{ts}.{ext}
// Ritorna { url, path } da salvare nel jsonb del rilievo.
// Non scrive su tabella vano_foto: questa foto e' "tecnica", legata al disegno del rilievo.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const vanoId = formData.get('vano_id') as string;

    if (!file || !vanoId) {
      return NextResponse.json({ error: 'file e vano_id obbligatori' }, { status: 400 });
    }

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const path = `${auth.aziendaId}/vani/${vanoId}/rilievo-tende/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('foto-vani')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (upErr) throw upErr;

    const { data: { publicUrl } } = supabase.storage
      .from('foto-vani')
      .getPublicUrl(path);

    return NextResponse.json({ url: publicUrl, path });
  } catch (err: any) {
    console.error('[rilievo-tende/foto]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Cancella foto (best-effort: se fallisce non blocca il salvataggio)
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { path } = await req.json();
    if (!path) return NextResponse.json({ error: 'path obbligatorio' }, { status: 400 });

    // Verifica che il path appartenga all'azienda dell'utente (security)
    if (!path.startsWith(`${auth.aziendaId}/`)) {
      return NextResponse.json({ error: 'Path non autorizzato' }, { status: 403 });
    }

    await supabase.storage.from('foto-vani').remove([path]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
