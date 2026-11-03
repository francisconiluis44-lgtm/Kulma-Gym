import { NextRequest, NextResponse } from 'next/server'
import { getGymContext } from '@/lib/gym-context'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params
  const px = size === '512' ? 512 : 192
  const gym = await getGymContext()

  if (gym.logo_url) {
    const resized = `https://images.weserv.nl/?url=${encodeURIComponent(gym.logo_url)}&w=${px}&h=${px}&fit=contain&output=png&bg=ffffff`
    return NextResponse.redirect(resized)
  }

  return NextResponse.redirect(new URL(`/icon-${px}.png`, req.url))
}
