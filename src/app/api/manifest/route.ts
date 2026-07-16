import { NextResponse } from 'next/server'
import { getGymContext } from '@/lib/gym-context'

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
    icons: gym.logo_url
      ? [
          { src: gym.logo_url, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: gym.logo_url, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ]
      : [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
  }

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
