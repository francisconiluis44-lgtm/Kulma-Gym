'use client'

import { useState } from 'react'

const WHATSAPP_NUMBER = '542477221589'
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Quiero%20más%20info%20sobre%20SimpleGym`

const features = [
  {
    icon: '👥',
    title: 'Gestión de alumnos',
    desc: 'Cargá, editá y organizá todos tus alumnos en un solo lugar.',
  },
  {
    icon: '🏋️',
    title: 'Rutinas personalizadas',
    desc: 'Asigná rutinas a cada alumno con fecha de vencimiento.',
  },
  {
    icon: '💳',
    title: 'Control de membresías',
    desc: 'Seguimiento de vencimientos y alertas automáticas para tus alumnos.',
  },
  {
    icon: '📢',
    title: 'Comunicados',
    desc: 'Publicá novedades que tus alumnos ven al instante.',
  },
  {
    icon: '💬',
    title: 'Mensajería directa',
    desc: 'Recibí mensajes de tus alumnos y respondelos desde el panel.',
  },
  {
    icon: '📱',
    title: 'App instalable',
    desc: 'Tus alumnos instalan la app en su celular sin ir a ninguna tienda.',
  },
]

const plans = [
  {
    name: 'Starter',
    desc: 'Para gimnasios que están arrancando',
    features: ['Hasta 50 alumnos', 'Gestión de rutinas y membresías', 'Comunicados', 'App para alumnos', 'Soporte por WhatsApp'],
  },
  {
    name: 'Pro',
    highlight: true,
    desc: 'Para gimnasios en crecimiento',
    features: ['Hasta 200 alumnos', 'Todo lo de Starter', 'Mensajería directa', 'Estadísticas básicas', 'Soporte prioritario'],
  },
  {
    name: 'Premium',
    desc: 'Para gimnasios establecidos',
    features: ['Alumnos ilimitados', 'Todo lo de Pro', 'Control de asistencia', 'Estadísticas avanzadas', 'Onboarding personalizado'],
  },
]

const steps = [
  { n: '01', title: 'Creamos tu gimnasio', desc: 'Te configuramos la plataforma con tu nombre, logo y colores en menos de 24hs.' },
  { n: '02', title: 'Cargás tus alumnos', desc: 'Desde el panel admin agregás alumnos, rutinas y fechas de membresía.' },
  { n: '03', title: 'Ellos instalan la app', desc: 'Tus alumnos reciben un link, entran y guardan la app en su celular.' },
]

export default function LandingPage() {
  const [form, setForm] = useState({ nombre: '', nombre_gimnasio: '', email: '', whatsapp: '', plan_interes: '', mensaje: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setStatus(res.ok ? 'ok' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white font-sans">

      {/* NAV */}
      <nav className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <span className="text-xl font-extrabold tracking-tight">
          Simple<span className="text-[#F97316]">Gym</span>
        </span>
        <a
          href="#contacto"
          className="bg-[#F97316] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#ea6a0a] transition-colors"
        >
          Empezar gratis
        </a>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
        <span className="inline-block bg-[#F97316]/15 text-[#F97316] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
          Primer mes gratis
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6 text-balance">
          El sistema de gestión<br />
          <span className="text-[#F97316]">para tu gimnasio</span>
        </h1>
        <p className="text-white/60 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          Manejá alumnos, rutinas y membresías desde el celular. Tus alumnos tienen su propia app. Vos tenés el control total.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#contacto"
            className="bg-[#F97316] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#ea6a0a] transition-colors text-base"
          >
            Quiero empezar →
          </a>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:border-white/40 transition-colors text-base"
          >
            Consultá por WhatsApp
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white/5 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Funcionalidades</p>
          <h2 className="text-3xl font-extrabold text-center mb-12">Todo lo que necesitás, sin lo que no</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white/5 rounded-2xl p-6 hover:bg-white/8 transition-colors">
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Cómo funciona</p>
          <h2 className="text-3xl font-extrabold text-center mb-12">En 3 pasos estás listo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <span className="text-5xl font-extrabold text-[#F97316]/20 block mb-4">{s.n}</span>
                <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section className="bg-white/5 py-20" id="planes">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Planes</p>
          <h2 className="text-3xl font-extrabold text-center mb-4">El precio se adapta a tu gimnasio</h2>
          <p className="text-white/50 text-center mb-12 max-w-md mx-auto">Primer mes gratis para todos los planes. Sin permanencia, cancelás cuando quieras.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 flex flex-col ${p.highlight ? 'bg-[#F97316] text-white ring-2 ring-[#F97316]' : 'bg-white/5 text-white'}`}
              >
                <h3 className={`text-xl font-extrabold mb-1 ${p.highlight ? 'text-white' : 'text-white'}`}>{p.name}</h3>
                <p className={`text-sm mb-6 ${p.highlight ? 'text-white/80' : 'text-white/50'}`}>{p.desc}</p>
                <ul className="space-y-2 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className={`text-sm flex items-start gap-2 ${p.highlight ? 'text-white/90' : 'text-white/60'}`}>
                      <span className={p.highlight ? 'text-white' : 'text-[#F97316]'}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contacto"
                  className={`text-center font-bold py-3 rounded-xl transition-colors text-sm ${p.highlight ? 'bg-white text-[#F97316] hover:bg-white/90' : 'bg-[#F97316] text-white hover:bg-[#ea6a0a]'}`}
                >
                  Consultá precio
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="py-20" id="contacto">
        <div className="max-w-xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Contacto</p>
          <h2 className="text-3xl font-extrabold text-center mb-4">Empezá hoy, gratis</h2>
          <p className="text-white/50 text-center mb-10">Completá el formulario y te contactamos en menos de 24hs.</p>

          {status === 'ok' ? (
            <div className="bg-white/5 rounded-2xl p-10 text-center">
              <span className="text-4xl block mb-4">🎉</span>
              <h3 className="text-xl font-bold mb-2">¡Recibimos tu consulta!</h3>
              <p className="text-white/50 text-sm mb-6">Te contactamos en menos de 24hs.</p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1ebe5c] transition-colors text-sm"
              >
                <span>También podés escribirnos por WhatsApp</span>
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/5 rounded-2xl p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-widest font-semibold mb-1.5">Tu nombre *</label>
                  <input
                    required
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#F97316]"
                    placeholder="Luis Pérez"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-widest font-semibold mb-1.5">Nombre del gimnasio</label>
                  <input
                    type="text"
                    value={form.nombre_gimnasio}
                    onChange={(e) => setForm({ ...form, nombre_gimnasio: e.target.value })}
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#F97316]"
                    placeholder="Kulma Gym"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest font-semibold mb-1.5">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#F97316]"
                  placeholder="luis@tugym.com"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest font-semibold mb-1.5">WhatsApp *</label>
                <input
                  required
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#F97316]"
                  placeholder="1155667788"
                />
              </div>
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest font-semibold mb-1.5">Plan de interés</label>
                <select
                  value={form.plan_interes}
                  onChange={(e) => setForm({ ...form, plan_interes: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#F97316]"
                >
                  <option value="" className="bg-[#0D1B2A]">No sé todavía</option>
                  <option value="Starter" className="bg-[#0D1B2A]">Starter (hasta 50 alumnos)</option>
                  <option value="Pro" className="bg-[#0D1B2A]">Pro (hasta 200 alumnos)</option>
                  <option value="Premium" className="bg-[#0D1B2A]">Premium (ilimitado)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/40 uppercase tracking-widest font-semibold mb-1.5">Mensaje (opcional)</label>
                <textarea
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                  rows={3}
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#F97316] resize-none"
                  placeholder="Contanos un poco sobre tu gimnasio..."
                />
              </div>
              {status === 'error' && (
                <p className="text-red-400 text-xs">Hubo un error. Intentá de nuevo o escribinos por WhatsApp.</p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-[#F97316] text-white font-bold py-3.5 rounded-xl hover:bg-[#ea6a0a] transition-colors disabled:opacity-50"
              >
                {status === 'sending' ? 'Enviando…' : 'Quiero empezar →'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-white/30 text-sm mb-3">O si preferís, escribinos directo</p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#1ebe5c] transition-colors text-sm"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-white/40 text-sm">
            Simple<span className="text-[#F97316]">Gym</span> © {new Date().getFullYear()}
          </span>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 text-sm hover:text-white/60 transition-colors"
          >
            +54 2477 221589
          </a>
        </div>
      </footer>
    </div>
  )
}
