import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingPage from './landing/page'

export default async function Home() {
  const headersList = await headers()
  const gymSlug = headersList.get('x-gym-slug')

  if (gymSlug === 'landing') {
    return <LandingPage />
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const isStudent = user.email?.endsWith('@kulmagym.app') ||
    user.email?.endsWith('.simplegym.app') ||
    user.email?.endsWith('.simplegym.fit')

  if (isStudent) redirect('/dashboard')
  redirect('/admin')
}
