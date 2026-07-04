'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

export default function RegistroPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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
      email: `${form.dni.trim()}@kulmagym.app`,
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
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-1">
            Unite a
          </p>
          <h1 className="text-4xl font-heading font-extrabold text-navy leading-tight">
            KULMA GYM
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg px-8 py-8">
          <h2 className="text-lg font-heading font-semibold text-navy mb-6">
            Crear cuenta
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nombre completo">
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

            <Field label="DNI">
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

            <Field label="WhatsApp">
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

            <Field label="Email (opcional)">
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

            <Field label="Fecha de nacimiento (opcional)">
              <input
                name="fecha_nacimiento"
                type="date"
                value={form.fecha_nacimiento}
                onChange={handleChange}
                className={inputCn}
              />
            </Field>

            <Field label="Contraseña">
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
                className={inputCn}
              />
            </Field>

            <Field label="Confirmar contraseña">
              <input
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repetí tu contraseña"
                required
                autoComplete="new-password"
                className={inputCn}
              />
            </Field>

            {error && (
              <p className="text-red-500 text-sm font-body bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 bg-orange text-white font-semibold rounded-xl hover:bg-orange/90 active:scale-[0.98] transition-all disabled:opacity-60 font-body"
            >
              {loading ? 'Registrando...' : 'Registrarme'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-navy/60 font-body">
          ¿Ya tenés cuenta?{' '}
          <Link
            href="/login"
            className="text-orange font-semibold hover:underline"
          >
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy/80 mb-1.5 font-body">
        {label}
      </label>
      {children}
    </div>
  )
}

const inputCn =
  'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors'
