import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Hostnames that don't follow the {slug}.simplegym.fit pattern
const HOSTNAME_SLUG_MAP: Record<string, string> = {
  'kulmagym.app': 'kulma-gym',
  'kulmagym.simplegym.fit': 'kulma-gym',
}

function slugFromHostname(hostname: string): string {
  const bare = hostname.split(':')[0] // strip port in dev
  if (HOSTNAME_SLUG_MAP[bare]) return HOSTNAME_SLUG_MAP[bare]
  const m = bare.match(/^([^.]+)\.simplegym\.fit$/)
  if (m) return m[1]
  return 'kulma-gym' // fallback: local dev or Vercel preview URLs
}

export async function middleware(req: NextRequest) {
  const slug = slugFromHostname(req.headers.get('host') ?? '')

  // Forward gym slug to server components via request header
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-gym-slug', slug)

  // Refresh Supabase session so it doesn't expire mid-visit
  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  response.headers.set('x-gym-slug', slug)
  return response
}

export const config = {
  matcher: [
    /*
     * Skip static files and Next.js internals; run on everything else.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
