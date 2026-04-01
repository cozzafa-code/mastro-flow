import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const vanoId = formData.get('vano_id') as string;
    const didascalia = (formData.get('didascalia') as string) ?? '';

    if (!file || !vanoId) {
      return NextResponse.json({ error: 'file e vano_id obbligatori' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${auth.aziendaId}/vani/${vanoId}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('foto-vani')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (upErr) throw upErr;

    const { data: { publicUrl } } = supabase.storage
      .from('foto-vani')
      .getPublicUrl(path);

    const { data: foto, error: dbErr } = await supabase
      .from('vano_foto')
      .insert({
        vano_id: vanoId,
        azienda_id: auth.aziendaId,
        url: publicUrl,
        path,
        didascalia,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbErr) throw dbErr;

    return NextResponse.json({ foto });
  } catch (err: any) {
    console.error('[vano/foto]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { fotoId, path } = await req.json();

    await supabase.storage.from('foto-vani').remove([path]);
    await supabase.from('vano_foto').delete().eq('id', fotoId).eq('azienda_id', auth.aziendaId);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
