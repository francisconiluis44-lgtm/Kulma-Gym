import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Only import this in Server Components / Server Actions — never in client code.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
