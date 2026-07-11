import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function extractGymSlug(host: string): string {
  if (host === 'simplegym.fit' || host === 'www.simplegym.fit') {
    return 'landing'
  }
  if (host.endsWith('.simplegym.fit')) {
    return host.replace('.simplegym.fit', '')
  }
  if (host.endsWith('.simplegym.app')) {
    return host.replace('.simplegym.app', '')
  }
  if (host === 'kulmagym.app' || host.startsWith('www.kulmagym.')) {
    return 'kulma-gym'
  }
  return 'kulma-gym'
}

export async function proxy(request: NextRequest) {
  const slug = extractGymSlug(request.headers.get('host') ?? '')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-gym-slug', slug)

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Landing page: no redirect logic, serve as-is
  if (slug === 'landing') {
    return supabaseResponse
  }

  // Alumnos: email ends with @kulmagym.app or @{slug}.simplegym.app
  const isStudent = user?.email?.endsWith('@kulmagym.app') ||
    user?.email?.endsWith(`.simplegym.app`) ||
    user?.email?.endsWith(`.simplegym.fit`) || false
  const isLoggedIn = user !== null
  const isAdmin = isLoggedIn && !isStudent

  // Protect admin panel — layouts do the gym-specific auth check
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && pathname !== '/admin/solicitar') {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Protect superadmin — layout handles the superadmins table check
  if (pathname.startsWith('/superadmin')) {
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  // Protect student dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!isStudent) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Protect checkin — redirect to login if not authenticated
  if (pathname === '/checkin') {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect logged-in students away from login/registro
  if ((pathname === '/login' || pathname === '/registro') && isStudent) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect logged-in admins away from login page
  if (pathname === '/admin/login' && isAdmin) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
