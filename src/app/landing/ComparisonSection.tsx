'use client'

import { useRef, useCallback, useState } from 'react'

const SCROLL_H = 380

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="8" fill="#F97316" fillOpacity="0.15"/>
      <polyline points="4.5,8.5 7,11 11.5,5.5" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="8" fill="#ef4444" fillOpacity="0.12"/>
      <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" stroke="#ef4444" strokeOpacity="0.5" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" stroke="#ef4444" strokeOpacity="0.5" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

function ScrollHint({ color }: { color: string }) {
  return (
    <div
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 72,
        background: `linear-gradient(to bottom, transparent, ${color})`,
        pointerEvents: 'none',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10,
      }}
    >
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', fontWeight: 500 }}>
        ↕ deslizá para ver más
      </span>
    </div>
  )
}

export function ComparisonSection({
  before,
  after,
}: {
  before: string[]
  after: string[]
}) {
  const maloRef  = useRef<HTMLDivElement>(null)
  const buenoRef = useRef<HTMLDivElement>(null)
  const syncing  = useRef(false)
  const [scrolled, setScrolled] = useState(false)

  const onMaloScroll = useCallback(() => {
    if (syncing.current || !maloRef.current || !buenoRef.current) return
    syncing.current = true
    buenoRef.current.scrollTop = maloRef.current.scrollTop
    if (maloRef.current.scrollTop > 20) setScrolled(true)
    requestAnimationFrame(() => { syncing.current = false })
  }, [])

  const onBuenoScroll = useCallback(() => {
    if (syncing.current || !maloRef.current || !buenoRef.current) return
    syncing.current = true
    maloRef.current.scrollTop = buenoRef.current.scrollTop
    if (buenoRef.current.scrollTop > 20) setScrolled(true)
    requestAnimationFrame(() => { syncing.current = false })
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

      {/* ANTES */}
      <div className="bg-red-500/5 rounded-2xl border border-red-500/10 overflow-hidden">
        <div className="border-b border-red-500/8">
          <div className="bg-[#141e2e] px-3 py-2 flex items-center gap-2">
            <div className="flex gap-1 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
            </div>
            <div className="flex-1 bg-white/5 rounded px-2 py-0.5 text-[10px] text-white/20 font-mono truncate">
              Sin sistema de gestión
            </div>
          </div>
          <div className="relative">
            <div
              ref={maloRef}
              onScroll={onMaloScroll}
              style={{ height: SCROLL_H, overflowY: 'scroll', overflowX: 'hidden' }}
              className="hide-scrollbar"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/dashboard-malo.png.jpeg"
                alt="Gimnasio sin sistema"
                style={{ width: '150%', marginLeft: '-25%', maxWidth: 'none', display: 'block' }}
              />
            </div>
            {!scrolled && <ScrollHint color="rgba(20,10,10,0.95)" />}
          </div>
        </div>
        <div className="p-6">
          <p className="text-red-400/70 text-xs font-bold uppercase tracking-widest mb-4">Antes</p>
          <ul className="space-y-3">
            {before.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <XIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-white/50 text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CON SIMPLEGYM */}
      <div className="bg-[#F97316]/8 rounded-2xl border border-[#F97316]/20 overflow-hidden">
        <div className="border-b border-[#F97316]/15">
          <div className="bg-[#141e2e] px-3 py-2 flex items-center gap-2">
            <div className="flex gap-1 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
            </div>
            <div className="flex-1 bg-white/5 rounded px-2 py-0.5 text-[10px] text-white/20 font-mono truncate">
              app.simplegym.com.ar/admin
            </div>
          </div>
          <div className="relative">
            <div
              ref={buenoRef}
              onScroll={onBuenoScroll}
              style={{ height: SCROLL_H, overflowY: 'scroll' }}
              className="hide-scrollbar"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/dashboard-bueno.png.jpeg" alt="Panel admin SimpleGym" className="w-full block" />
            </div>
            {!scrolled && <ScrollHint color="rgba(13,27,42,0.95)" />}
          </div>
        </div>
        <div className="p-6">
          <p className="text-white text-xs font-bold uppercase tracking-widest mb-4">Con SimpleGym</p>
          <ul className="space-y-3">
            {after.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckIcon className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-white text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  )
}
