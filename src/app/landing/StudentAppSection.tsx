'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// --- Medidas base (tomadas del mockup a 390px de ancho) ---
const ORIG_W = 390
const ORIG_H = 1544
const PHONE_W = 290        // ancho del viewport del celular en la landing
const VIEWPORT_H = 540     // altura visible del celular (ventana)
const SCALE = PHONE_W / ORIG_W
const IMG_H = Math.round(ORIG_H * SCALE)  // altura total de la imagen escalada

// Coordenadas de cada elemento en pixeles escalados
const s = (v: number) => Math.round(v * SCALE)

const EL = {
  header:    { top: 0,       h: s(104), left: 0,     w: PHONE_W },
  welcome:   { top: s(124),  h: s(110), left: s(16),  w: s(358) },
  checkin:   { top: s(366),  h: s(80),  left: s(16),  w: s(358) },
  membresia: { top: s(460),  h: s(105), left: s(16),  w: s(358) },
  rutina:    { top: s(579),  h: s(110), left: s(16),  w: s(358) },
  comunicado:{ top: s(927),  h: s(164), left: s(16),  w: s(358) },
  mensajes:  { top: s(1105), h: s(228), left: s(16),  w: s(358) },
}

type Highlight = typeof EL.header

const SCENES = [
  {
    scrollY: 0,
    highlights: [EL.header, EL.welcome] as Highlight[],
    eyebrow: 'Tu identidad, en cada pantalla',
    title: 'La app con la identidad de tu gimnasio',
    desc: 'Logo personalizado, colores propios y una bienvenida inteligente que reconoce a cada alumno.',
  },
  {
    scrollY: EL.checkin.top - 55,
    highlights: [EL.checkin, EL.membresia, EL.rutina] as Highlight[],
    eyebrow: 'Todo en un toque',
    title: 'Registrar asistencia, membresía y rutina desde el celular',
    desc: 'Sin llamadas, sin papeles. Cada alumno ve su estado actualizado en tiempo real.',
  },
  {
    scrollY: EL.comunicado.top - 55,
    highlights: [EL.comunicado, EL.mensajes] as Highlight[],
    eyebrow: 'Comunicación directa',
    title: 'Siempre conectado con el profesor',
    desc: 'Los alumnos reciben comunicados al instante y pueden escribirte directamente desde la app.',
  },
]

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function drawSpotlight(canvas: HTMLCanvasElement, highlights: Highlight[], scrollY: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width: w, height: h } = canvas

  ctx.clearRect(0, 0, w, h)

  // Overlay oscuro
  ctx.fillStyle = 'rgba(8, 16, 40, 0.72)'
  ctx.fillRect(0, 0, w, h)

  // Recortar las zonas iluminadas
  ctx.globalCompositeOperation = 'destination-out'
  for (const hl of highlights) {
    const vy = hl.top - scrollY
    if (vy > h || vy + hl.h < 0) continue
    roundRect(ctx, hl.left - 3, vy - 3, hl.w + 6, hl.h + 6, 14)
    ctx.fill()
  }
  ctx.globalCompositeOperation = 'source-over'

  // Borde naranja con sombra suave
  for (const hl of highlights) {
    const vy = hl.top - scrollY
    if (vy > h || vy + hl.h < 0) continue
    ctx.shadowColor = '#F26419'
    ctx.shadowBlur = 12
    ctx.strokeStyle = '#F26419'
    ctx.lineWidth = 1.5
    roundRect(ctx, hl.left - 3, vy - 3, hl.w + 6, hl.h + 6, 14)
    ctx.stroke()
  }
  ctx.shadowBlur = 0
}

export function StudentAppSection() {
  const [scene, setScene] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const current = SCENES[scene]

  const redraw = useCallback(() => {
    if (!canvasRef.current) return
    drawSpotlight(canvasRef.current, current.highlights, current.scrollY)
  }, [current])

  useEffect(() => { redraw() }, [redraw])

  useEffect(() => {
    intervalRef.current = setInterval(() => setScene(s => (s + 1) % SCENES.length), 4000)
    return () => clearInterval(intervalRef.current)
  }, [])

  function goTo(i: number) {
    clearInterval(intervalRef.current)
    setScene(i)
    intervalRef.current = setInterval(() => setScene(s => (s + 1) % SCENES.length), 4000)
  }

  return (
    <section className="py-24 border-t border-white/10">
      <div className="max-w-5xl mx-auto px-6">

        {/* Encabezado de sección */}
        <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">
          La experiencia del alumno
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center mb-4 leading-tight">
          Una app que tus alumnos<br className="hidden sm:block" /> realmente van a usar
        </h2>
        <p className="text-white/50 text-center max-w-lg mx-auto mb-16 text-sm leading-relaxed">
          Todo lo que necesitan para entrenar, comunicarse y seguir su membresía, desde el celular.
        </p>

        {/* Dos columnas */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Texto (derecha en desktop, abajo en mobile) */}
          <div className="flex-1 order-2 lg:order-1 text-center lg:text-left">
            <p
              key={`eyebrow-${scene}`}
              className="text-[#F97316] text-xs font-bold uppercase tracking-widest mb-3 animate-fade-in"
            >
              {current.eyebrow}
            </p>
            <h3
              key={`title-${scene}`}
              className="text-xl sm:text-2xl font-extrabold text-white mb-4 leading-snug animate-fade-in"
            >
              {current.title}
            </h3>
            <p
              key={`desc-${scene}`}
              className="text-white/55 leading-relaxed mb-10 text-sm animate-fade-in"
            >
              {current.desc}
            </p>

            {/* Indicadores de escena */}
            <div className="flex gap-2 justify-center lg:justify-start">
              {SCENES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Escena ${i + 1}`}
                  style={{ transition: 'width 0.3s ease, opacity 0.3s ease' }}
                  className={`h-1.5 rounded-full ${
                    i === scene
                      ? 'bg-[#F97316] w-8'
                      : 'bg-white/20 w-4 hover:bg-white/35'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Celular con scroll y spotlight */}
          <div className="order-1 lg:order-2 shrink-0">
            {/* Marco del celular */}
            <div
              className="relative"
              style={{
                width: PHONE_W + 16,
                height: VIEWPORT_H + 16,
                background: '#1C1C2E',
                borderRadius: 44,
                padding: 8,
                boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.6)',
              }}
            >
              {/* Notch / barra superior */}
              <div
                className="absolute top-[18px] left-1/2 -translate-x-1/2 z-20"
                style={{ width: 60, height: 6, background: '#2a2a3e', borderRadius: 999 }}
              />

              {/* Pantalla */}
              <div
                className="relative overflow-hidden"
                style={{
                  width: PHONE_W,
                  height: VIEWPORT_H,
                  borderRadius: 36,
                  background: '#F7F4EF',
                }}
              >
                {/* Screenshot con scroll animado */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/student-app-demo.png"
                  alt="App de alumnos SimpleGym"
                  style={{
                    display: 'block',
                    width: PHONE_W,
                    height: IMG_H,
                    transform: `translateY(-${current.scrollY}px)`,
                    transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
                    willChange: 'transform',
                  }}
                />

                {/* Canvas overlay con spotlight */}
                <canvas
                  ref={canvasRef}
                  width={PHONE_W}
                  height={VIEWPORT_H}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    borderRadius: 36,
                  }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
