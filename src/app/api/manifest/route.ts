import { NextResponse } from 'next/server'
import { getGymContext } from '@/lib/gym-context'


function buildIcons() {
  return [
    { src: '/api/icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/api/icon/192', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/api/icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/api/icon/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
    icons: buildIcons(),
  }

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
