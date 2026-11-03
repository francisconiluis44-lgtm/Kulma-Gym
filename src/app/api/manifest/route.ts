import { NextResponse } from 'next/server'
import { getGymContext } from '@/lib/gym-context'

function detectMimeType(url: string): string {
  const lower = url.toLowerCase().split('?')[0]
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  return 'image/png'
}

function buildIcons(logoUrl: string | null | undefined) {
  const icons = []
  if (logoUrl) {
    const type = detectMimeType(logoUrl)
    icons.push(
      { src: logoUrl, sizes: '192x192', type, purpose: 'any' },
      { src: logoUrl, sizes: '512x512', type, purpose: 'any' },
    )
  } else {
    icons.push(
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    )
  }
  // Always include PNG maskable fallbacks — required by PWABuilder / Play Store
  icons.push(
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  )
  return icons
}

export async function GET() {
  const gym = await getGymContext()

  const manifest = {
    name: gym.nombre,
    short_name: gym.nombre,
    description: 'Tu gimnasio de confianza',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#FAF7F2',
    theme_color: gym.color_primario ?? '#0D1B2A',
    orientation: 'portrait',
    icons: buildIcons(gym.logo_url),
  }

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
