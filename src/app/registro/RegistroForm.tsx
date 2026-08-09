'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  gymNombre: string
  emailDomain: string
}

type FormState = {
  nombre_completo: string
  dni: string
  whatsapp: string
  email: string
  fecha_nacimiento: string
  password: string
  confirmPassword: string
}

const initialForm: FormState = {
  nombre_completo: '',
  dni: '',
  whatsapp: '',
  email: '',
  fecha_nacimiento: '',
  password: '',
  confirmPassword: '',
}

const inputCn =
  'w-full px-4 py-3 rounded-xl border border-navy/12 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange/60 text-navy font-body placeholder:text-navy/25 bg-white transition-all'

export default function RegistroForm({ gymNombre, emailDomain }: Props) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre_completo: form.nombre_completo,
        dni: form.dni,
        whatsapp: form.whatsapp,
        email: form.email,
        fecha_nacimiento: form.fecha_nacimiento,
        password: form.password,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al registrarse.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: `${form.dni.trim()}@${emailDomain}`,
      password: form.password,
    })

    if (loginError) {
      setError('Cuenta creada, pero no se pudo iniciar sesión. Intentá desde el login.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div
      className="min-h-[100dvh] flex items-center justify-center px-4 py-10"
      style={{
        background: `radial-gradient(ellipse 90% 45% at 50% 0%, color-mix(in srgb, var(--color-orange) 10%, var(--color-cream)), var(--color-cream))`,
      }}
    >
      <div className="w-full max-w-sm">
        {/* ── Header ── */}
        <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '0ms' }}>
          <p className="text-[10px] font-semibold tracking-[0.22em] text-orange uppercase mb-2 font-body">
            Unite a
          </p>
          <h1
            className="text-3xl font-heading font-black tracking-tight bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(160deg, var(--color-navy) 40%, var(--color-orange) 100%)' }}
          >
            {gymNombre}
          </h1>
        </div>

        {/* ── Card ── */}
        <div
          className="bg-white rounded-2xl px-8 py-8 animate-fade-in"
          style={{
            animationDelay: '80ms',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.08)',
            borderTop: '3px solid var(--color-orange)',
          }}
        >
          <h2 className="text-lg font-heading font-semibold text-navy mb-6">Crear cuenta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nombre completo" delay={140}>
              <input
                name="nombre_completo"
                type="text"
                value={form.nombre_completo}
                onChange={handleChange}
                placeholder="Juan Pérez"
                required
                autoComplete="name"
                className={inputCn}
              />
            </Field>

            <Field label="DNI" delay={170}>
              <input
                name="dni"
                type="text"
                inputMode="numeric"
                value={form.dni}
                onChange={handleChange}
                placeholder="12345678"
                required
                autoComplete="off"
                className={inputCn}
              />
            </Field>

            <Field label="WhatsApp" delay={200}>
              <input
                name="whatsapp"
                type="tel"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="+54 9 11 1234-5678"
                required
                autoComplete="tel"
                className={inputCn}
              />
            </Field>

            <Field label="Email (opcional)" delay={230}>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="juan@ejemplo.com"
                autoComplete="email"
                className={inputCn}
              />
            </Field>

            <Field label="Fecha de nacimiento (opcional)" delay={260}>
              <input
                name="fecha_nacimiento"
                type="date"
                value={form.fecha_nacimiento}
                onChange={handleChange}
                className={inputCn}
              />
            </Field>

            <Field label="Contraseña" delay={290}>
              <div className="relative">
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                  className={inputCn + ' pr-12'}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/30 hover:text-navy/60 transition-colors p-1"
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </Field>

            <Field label="Confirmar contraseña" delay={320}>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPass ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repetí tu contraseña"
                  required
                  autoComplete="new-password"
                  className={inputCn + ' pr-12'}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  aria-label={showConfirmPass ? 'Ocultar' : 'Mostrar'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy/30 hover:text-navy/60 transition-colors p-1"
                >
                  <EyeIcon open={showConfirmPass} />
                </button>
              </div>
            </Field>

            {error && (
              <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2.5 rounded-lg border border-red-100">
                {error}
              </p>
            )}

            <div className="animate-fade-in" style={{ animationDelay: '350ms' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-shine w-full py-3.5 mt-1 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
                style={{ boxShadow: '0 0 24px color-mix(in srgb, var(--color-orange) 28%, transparent)' }}
              >
                {loading ? 'Registrando...' : 'Crear mi cuenta'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-navy/55 font-body animate-fade-in" style={{ animationDelay: '400ms' }}>
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-orange font-semibold hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  delay = 0,
  children,
}: {
  label: string
  delay?: number
  children: React.ReactNode
}) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <label className="block text-[11px] font-semibold text-navy/45 mb-2 font-body tracking-widest uppercase">
        {label}
      </label>
      {children}
    </div>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
