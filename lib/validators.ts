import { z } from 'zod';

// ── PIN ──────────────────────────────────────────────────────────────────
export const PinActionSchema = z.object({
  action: z.enum(['set', 'verify', 'remove', 'unlock']),
  memberId: z.string().uuid(),
  azId: z.string().uuid(),
  pin: z.string().regex(/^\d{6}$/, 'PIN deve essere 6 cifre numeriche').optional(),
});

// ── GMAIL SEND ────────────────────────────────────────────────────────────
export const GmailSendSchema = z.object({
  to: z.string().email('Email destinatario non valida'),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
  replyTo: z.string().email().optional(),
  azId: z.string().uuid().optional(),
});

// ── MASTRO ROUTE (generica) ───────────────────────────────────────────────
export const MastroRouteBaseSchema = z.object({
  azId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
}).passthrough(); // passthrough: altri campi permessi, validazione base

// ── Sanitize string (rimuove tag HTML) ───────────────────────────────────
export function sanitizeString(s: unknown): string {
  if (typeof s !== 'string') return '';
  return s
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/javascript:/gi, '')       // strip javascript: protocol
    .replace(/on\w+\s*=/gi, '')         // strip event handlers
    .trim()
    .slice(0, 10000);                   // max length
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') result[k] = sanitizeString(v);
    else if (typeof v === 'object' && v !== null && !Array.isArray(v))
      result[k] = sanitizeObject(v as Record<string, unknown>);
    else result[k] = v;
  }
  return result as T;
}
