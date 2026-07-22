'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthHashRedirect() {
  const router = useRouter()
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    if (hash.includes('type=recovery')) {
      router.replace('/auth/reset-password' + hash)
      return
    }

    const params = new URLSearchParams(hash.slice(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (accessToken && refreshToken) {
      const supabase = createClient()
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data }) => {
          const email = data.user?.email ?? ''
          const isStudent =
            email.endsWith('@kulmagym.app') ||
            email.endsWith('.simplegym.app') ||
            email.endsWith('.simplegym.fit')
          router.replace(isStudent ? '/dashboard' : '/admin')
        })
    }
  }, [router])
  return null
}
