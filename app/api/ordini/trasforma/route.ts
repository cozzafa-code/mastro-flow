import { NextRequest, NextResponse } from 'next/server';
import { trasformaOrdine } from '@/lib/order-transformer';
import { requireAuth } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const { testo, formato, fornitore } = await req.json();
    if (!testo) return NextResponse.json({ error: 'testo obbligatorio' }, { status: 400 });

    const risultato = trasformaOrdine(testo, formato);
    if (fornitore) risultato.fornitore = fornitore;

    return NextResponse.json(risultato);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
