import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { logAudit, getIpFromRequest } from "@/lib/audit-log";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SALT_ROUNDS = 12;
const MAX_ATTEMPTS = 5;
const PIN_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000; // 90 giorni

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const rl = rateLimit(ip, RATE_LIMITS.pin);
  if (!rl.success) return rateLimitResponse(rl);

  const { action, memberId, pin, azId } = await req.json();

  if (!memberId || !azId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  // Fetch member
  const { data: member, error: fetchErr } = await supabase
    .from('team')
    .select('id, pin_hash, pin_attempts, pin_locked_at, pin_set_at')
    .eq('id', memberId)
    .eq('azienda_id', azId)
    .single();

  if (fetchErr || !member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  // ── SET PIN ──────────────────────────────────────────────────
  if (action === 'set') {
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: 'PIN deve essere 6 cifre numeriche' }, { status: 400 });
    }
    const hash = await bcrypt.hash(pin, SALT_ROUNDS);
    await supabase.from('team').update({
      pin_hash: hash,
      pin_attempts: 0,
      pin_locked_at: null,
      pin_set_at: new Date().toISOString(),
    }).eq('id', memberId);
    await logAudit({ azienda_id: azId, user_id: memberId, action: 'pin_set', entity: 'team', entity_id: memberId, ip: getIpFromRequest(req) });
    return NextResponse.json({ ok: true });
  }

  // ── VERIFY PIN ───────────────────────────────────────────────
  if (action === 'verify') {
    if (!member.pin_hash) {
      return NextResponse.json({ error: 'PIN non impostato' }, { status: 400 });
    }

    // Check lock
    if (member.pin_locked_at) {
      const lockAge = Date.now() - new Date(member.pin_locked_at).getTime();
      if (lockAge < 15 * 60 * 1000) {
        await logAudit({ azienda_id: azId, user_id: memberId, action: 'pin_locked_attempt', entity: 'team', entity_id: memberId, ip: getIpFromRequest(req) });
        return NextResponse.json({ error: 'Account bloccato. Contatta l\'admin.', locked: true }, { status: 403 });
      }
      // Auto-unlock dopo 15min
      await supabase.from('team').update({ pin_locked_at: null, pin_attempts: 0 }).eq('id', memberId);
    }

    // Check scadenza 90 giorni
    if (member.pin_set_at) {
      const pinAge = Date.now() - new Date(member.pin_set_at).getTime();
      if (pinAge > PIN_EXPIRY_MS) {
        await logAudit({ azienda_id: azId, user_id: memberId, action: 'pin_expired', entity: 'team', entity_id: memberId, ip: getIpFromRequest(req) });
        return NextResponse.json({ error: 'PIN scaduto. Contatta l\'admin per reimpostarlo.', expired: true }, { status: 403 });
      }
    }

    const ok = await bcrypt.compare(pin, member.pin_hash);

    if (!ok) {
      const attempts = (member.pin_attempts || 0) + 1;
      const updateData: Record<string, unknown> = { pin_attempts: attempts };
      if (attempts >= MAX_ATTEMPTS) {
        updateData.pin_locked_at = new Date().toISOString();
        await logAudit({ azienda_id: azId, user_id: memberId, action: 'pin_locked', entity: 'team', entity_id: memberId, ip: getIpFromRequest(req) });
      }
      await supabase.from('team').update(updateData).eq('id', memberId);
      const remaining = MAX_ATTEMPTS - attempts;
      return NextResponse.json({
        error: remaining > 0 ? `PIN errato. Tentativi rimasti: ${remaining}` : 'Account bloccato dopo 5 tentativi.',
        locked: attempts >= MAX_ATTEMPTS,
        remaining: Math.max(0, remaining),
      }, { status: 401 });
    }

    // Success — reset attempts
    await supabase.from('team').update({ pin_attempts: 0 }).eq('id', memberId);
    await logAudit({ azienda_id: azId, user_id: memberId, action: 'pin_verify_ok', entity: 'team', entity_id: memberId, ip: getIpFromRequest(req) });
    return NextResponse.json({ ok: true });
  }

  // ── REMOVE PIN ───────────────────────────────────────────────
  if (action === 'remove') {
    await supabase.from('team').update({
      pin_hash: null,
      pin_attempts: 0,
      pin_locked_at: null,
      pin_set_at: null,
    }).eq('id', memberId);
    await logAudit({ azienda_id: azId, user_id: memberId, action: 'pin_removed', entity: 'team', entity_id: memberId, ip: getIpFromRequest(req) });
    return NextResponse.json({ ok: true });
  }

  // ── UNLOCK (admin) ───────────────────────────────────────────
  if (action === 'unlock') {
    await supabase.from('team').update({ pin_locked_at: null, pin_attempts: 0 }).eq('id', memberId);
    await logAudit({ azienda_id: azId, user_id: memberId, action: 'pin_unlocked_by_admin', entity: 'team', entity_id: memberId, ip: getIpFromRequest(req) });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
