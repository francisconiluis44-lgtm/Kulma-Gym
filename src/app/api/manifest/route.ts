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
  const src192 = logoUrl ?? '/icon-192.png'
  const src512 = logoUrl ?? '/icon-512.png'
  const type = logoUrl ? detectMimeType(logoUrl) : 'image/png'
  return [
    { src: src192, sizes: '192x192', type, purpose: 'any' },
    { src: src192, sizes: '192x192', type, purpose: 'maskable' },
    { src: src512, sizes: '512x512', type, purpose: 'any' },
    { src: src512, sizes: '512x512', type, purpose: 'maskable' },
  ]
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
