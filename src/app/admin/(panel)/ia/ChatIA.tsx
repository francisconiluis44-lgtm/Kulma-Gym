'use client'

import { useState, useRef, useEffect } from 'react'
import type { IAStatus } from './page'

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')
}

const SUGERENCIAS = [
  '¿Quiénes tienen la cuota vencida?',
  '¿Qué alumnos hace más de dos semanas que no vienen?',
  '¿Cómo viene la facturación este mes?',
  '¿Qué debería atender primero hoy?',
]

type Message = { role: 'user' | 'assistant'; content: string }

function StatusBadge({ status, restantes }: { status: IAStatus; restantes: number }) {
  if (status.tipo === 'trial') {
    return (
      <span className="text-xs font-semibold font-body px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
        Prueba · {status.diasRestantes}d · {restantes}/25
      </span>
    )
  }
  if (status.tipo === 'paid') {
    const [, mm, dd] = status.hasta.split('-')
    return (
      <span className="text-xs font-semibold font-body px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
        {restantes}/25 hoy · hasta {dd}/{mm}
      </span>
    )
  }
  return (
    <span className="text-xs font-semibold font-body px-2.5 py-1 rounded-full bg-orange/10 text-orange border border-orange/20">
      {restantes}/3 hoy
    </span>
  )
}

export default function ChatIA({ status }: { status: IAStatus }) {
  const [restantes, setRestantes] = useState(status.consultasRestantes)
  const [mensaje, setMensaje] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const agotado = restantes <= 0

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function enviar(pregunta: string) {
    const texto = pregunta.trim()
    if (!texto || loading || agotado) return

    const newMessages: Message[] = [...messages, { role: 'user', content: texto }]
    setMessages(newMessages)
    setLoading(true)
    setError(null)
    setMensaje('')

    const history = messages.slice(-6)

    let res: Response | null = null
    try {
      res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: texto, history }),
      })
    } catch {
      setError('No pude conectarme. Verificá tu conexión e intentá nuevamente.')
      setMessages(prev => prev.slice(0, -1))
      setLoading(false)
      return
    }

    let data: { error?: string; response?: string; consultasRestantes?: number } = {}
    try {
      data = await res.json()
    } catch {
      // Server returned a non-JSON response (e.g. timeout or crash)
      setError('El servidor no respondió correctamente. Intentá nuevamente en unos segundos.')
      setMessages(prev => prev.slice(0, -1))
      setLoading(false)
      return
    }

    if (!res.ok) {
      setError(data.error ?? 'No pude procesar tu consulta. Intentá nuevamente.')
      setMessages(prev => prev.slice(0, -1))
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: data.response ?? '' }])
      if (typeof data.consultasRestantes === 'number') {
        setRestantes(data.consultasRestantes)
      } else {
        setRestantes(prev => Math.max(0, prev - 1))
      }
    }
    setLoading(false)
  }

  function nuevaConversacion() {
    setMessages([])
    setError(null)
    setMensaje('')
  }

  return (
    <div className="space-y-4 max-w-lg">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-navy">SimpleGym IA</h2>
          <p className="text-sm text-navy/50 font-body">Preguntale a tu gimnasio</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          {messages.length > 0 && (
            <button
              onClick={nuevaConversacion}
              className="text-xs font-body text-navy/40 hover:text-orange transition-colors"
            >
              Nueva consulta
            </button>
          )}
          <StatusBadge status={status} restantes={restantes} />
        </div>
      </div>

      {/* Sugerencias */}
      {messages.length === 0 && !loading && !error && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase mb-3">
            Podés preguntarme
          </p>
          <div className="flex flex-col gap-1">
            {SUGERENCIAS.map(s => (
              <button
                key={s}
                onClick={() => enviar(s)}
                disabled={agotado}
                className="text-left text-sm font-body text-navy/70 hover:text-orange hover:bg-orange/5 px-3 py-2.5 rounded-xl transition-colors disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversación */}
      {messages.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
              {m.role === 'user' ? (
                <span className="inline-block bg-orange/10 text-navy font-body text-sm px-4 py-2 rounded-2xl rounded-tr-sm max-w-[85%] text-left">
                  {m.content}
                </span>
              ) : (
                <div
                  className="text-sm font-body text-navy leading-relaxed prose-ia"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                />
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm px-6 py-5 flex items-center gap-3">
          <div className="flex gap-1">
            {[0, 150, 300].map(delay => (
              <span
                key={delay}
                className="w-2 h-2 rounded-full bg-orange animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
          <p className="text-sm font-body text-navy/50">Analizando datos…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 rounded-2xl px-6 py-4 flex items-start gap-3">
          <span className="text-red-400 mt-0.5 shrink-0">⚠</span>
          <div>
            <p className="text-sm font-body text-red-600">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-xs font-body text-red-400 hover:text-red-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Input / Paywall */}
      {agotado ? (
        <div className="bg-orange/5 border border-orange/20 rounded-2xl px-6 py-5 space-y-1">
          {status.tipo === 'free' ? (
            <>
              <p className="text-sm font-heading font-bold text-navy">Alcanzaste el límite diario</p>
              <p className="text-sm font-body text-navy/60">
                El plan gratuito incluye 3 consultas por día. Activá el acceso completo por{' '}
                <strong className="text-navy">$5.000/mes</strong> y accedé a 25 consultas diarias.
              </p>
              <p className="text-xs font-body text-navy/40 mt-2">Contactá a SimpleGym para activarlo.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-heading font-bold text-navy">Usaste las 25 consultas de hoy</p>
              <p className="text-sm font-body text-navy/60">
                Volvé mañana para continuar. El límite se reinicia cada día.
              </p>
            </>
          )}
        </div>
      ) : (
        <form
          onSubmit={e => { e.preventDefault(); enviar(mensaje) }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            placeholder={messages.length > 0 ? 'Seguí preguntando…' : 'Escribí tu consulta…'}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 text-sm transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!mensaje.trim() || loading}
            className="px-5 py-3 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-40 font-body text-sm shrink-0"
          >
            Preguntar
          </button>
        </form>
      )}
    </div>
  )
}
