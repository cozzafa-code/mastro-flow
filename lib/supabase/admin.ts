import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Client con service_role — bypassa RLS
// SOLO usare lato server (API routes, Server Components)
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
