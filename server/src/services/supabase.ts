import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

/**
 * Lazily creates and caches the admin Supabase client.
 * Reading env vars only on first call guarantees that load-env.ts
 * (which runs dotenv.config) has already populated process.env.
 */
const getInstance = (): SupabaseClient => {
  if (_client) return _client

  const url = (process.env.SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

  if (!url || !key) {
    throw new Error(
      'Missing Supabase credentials.\n' +
      'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env\n' +
      'Get them from: Supabase Dashboard → Project Settings → API'
    )
  }

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return _client
}

/**
 * Service-role Supabase client — bypasses RLS. Server-only, never expose to frontend.
 *
 * Uses a Proxy so every property access (e.g. supabase.from, supabase.auth)
 * triggers lazy initialisation. createClient() is never called at module load
 * time, only on the first real DB operation.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getInstance(), prop as keyof SupabaseClient)
  },
})
