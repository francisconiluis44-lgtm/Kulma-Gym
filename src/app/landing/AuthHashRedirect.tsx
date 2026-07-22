'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthHashRedirect() {
  const router = useRouter()
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      router.replace('/auth/reset-password' + hash)
    }
  }, [router])
  return null
}
