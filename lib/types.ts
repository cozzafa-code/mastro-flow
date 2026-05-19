// Aggiungere a lib/types.ts (NON sovrascrivere il file esistente)

export type ApiKey = {
  id: string;
  azienda_id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  rate_limit_per_min: number;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type ApiKeyStats = {
  callsMonth: number;
  activeKeys: number;
  expiringKeys: number;
  planLimit: number;
  planName: string;
};
