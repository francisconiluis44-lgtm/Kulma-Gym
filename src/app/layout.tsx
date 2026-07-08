import type { Metadata, Viewport } from 'next'
import { Poppins, Inter } from 'next/font/google'
import './globals.css'
import SwRegister from './SwRegister'
import OneSignalInit from './OneSignalInit'
import { getGymContext } from '@/lib/gym-context'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kulma Gym',
  description: 'Tu gimnasio de confianza',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kulma Gym',
  },
}

export const viewport: Viewport = {
  themeColor: '#0D1B2A',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const gym = await getGymContext()

  const gymStyles = {
    '--color-navy': gym.color_primario ?? '#0D1B3E',
    '--color-orange': gym.color_acento ?? '#F26419',
  } as React.CSSProperties

  return (
    <html lang="es" className={`${poppins.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-cream antialiased" style={gymStyles}>
        {children}
        <SwRegister />
        <OneSignalInit />
      </body>
    </html>
  )
}
