import { cache } from 'react'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Gimnasio } from '@/types/database'

// Cached per-request — safe to call from multiple server components
export const getGymContext = cache(async (): Promise<Gimnasio> => {
  const h = await headers()
  const slug = h.get('x-gym-slug') ?? 'kulma-gym'

  const adminSupabase = createAdminClient()
  const { data: gym } = await adminSupabase
    .from('gimnasios')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!gym) {
    const { data: fallback } = await adminSupabase
      .from('gimnasios')
      .select('*')
      .eq('slug', 'kulma-gym')
      .single()
    return fallback!
  }

  return gym
})
