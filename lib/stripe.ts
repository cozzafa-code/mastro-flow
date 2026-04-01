import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const STRIPE_PLANS = {
  base: {
    name: 'BASE',
    price: 9,
    priceId: process.env.STRIPE_PRICE_BASE!,
    description: '1 utente · 20 commesse · Funzioni core',
    features: ['ERP base', '20 commesse', '1 operatore', 'PDF preventivi'],
    color: '#6B7280',
  },
  start: {
    name: 'START',
    price: 29,
    priceId: process.env.STRIPE_PRICE_START!,
    description: '3 utenti · Commesse illimitate',
    features: ['ERP completo', 'Commesse illimitate', '3 operatori', 'MESSAGGI', 'MONTAGGI'],
    color: '#3B7FE0',
    bestSeller: true,
  },
  pro: {
    name: 'PRO',
    price: 59,
    priceId: process.env.STRIPE_PRICE_PRO!,
    description: '10 utenti · Add-on settore incluso',
    features: ['Tutto START', '10 operatori', 'RETE agenti', 'Add-on settore', 'Assistente AI'],
    color: '#D08008',
  },
  titan: {
    name: 'TITAN',
    price: 89,
    priceId: process.env.STRIPE_PRICE_TITAN!,
    description: 'Utenti illimitati · CNC incluso',
    features: ['Tutto PRO', 'Operatori illimitati', 'CNC', 'ADMIN', 'API access', 'Priorità supporto'],
    color: '#1A1A1C',
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;

export async function createOrRetrieveCustomer(
  aziendaId: string,
  email: string,
  nomeAzienda: string
): Promise<string> {
  // Cerca customer esistente tramite metadata
  const existing = await stripe.customers.search({
    query: `metadata['azienda_id']:'${aziendaId}'`,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  const customer = await stripe.customers.create({
    email,
    name: nomeAzienda,
    metadata: { azienda_id: aziendaId },
  });

  return customer.id;
}

export function getPlanFromPriceId(priceId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.priceId === priceId) return key as PlanKey;
  }
  return null;
}

// SQL da eseguire in Supabase:
// CREATE TABLE subscriptions (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   azienda_id uuid REFERENCES aziende(id) ON DELETE CASCADE,
//   stripe_customer_id text UNIQUE,
//   stripe_subscription_id text UNIQUE,
//   plan text CHECK (plan IN ('base','start','pro','titan')),
//   status text CHECK (status IN ('active','trialing','past_due','canceled','incomplete')),
//   trial_ends_at timestamptz,
//   current_period_end timestamptz,
//   created_at timestamptz DEFAULT now(),
//   updated_at timestamptz DEFAULT now()
// );
// ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "tenant_isolation" ON subscriptions
//   USING (azienda_id = (SELECT azienda_id FROM operatori WHERE auth_id = auth.uid()));
