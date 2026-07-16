'use client'

import { useState } from 'react'

const WHATSAPP_NUMBER = '542477221589'
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Quiero%20más%20info%20sobre%20SimpleGym`

const antes = [
  'Excel que se pierde o se rompe',
  'WhatsApp para avisar vencimientos uno por uno',
  'Sin saber cuántos alumnos vinieron este mes',
  'Cobros anotados en papel o en la cabeza',
]

const ahora = [
  'Panel digital con todo centralizado',
  'Alertas automáticas a cada alumno',
  'Estadísticas mes a mes en segundos',
  'Control total de cobros desde el celular',
]

const features = [
  {
    title: 'Gestión de alumnos',
    desc: 'Cada alumno con su historial, membresía y rutina en un solo lugar.',
  },
  {
    title: 'Control de membresías',
    desc: 'Alertas automáticas antes de que venzan. Nunca más perder un cobro.',
  },
  {
    title: 'Rutinas personalizadas',
    desc: 'Asigná rutinas con fecha de vencimiento. Tus alumnos las ven desde la app.',
  },
  {
    title: 'App instalable para alumnos',
    desc: 'Sin tienda de apps. Tus alumnos entran al link y la guardan en el celular.',
  },
  {
    title: 'Comunicados instantáneos',
    desc: 'Publicá un aviso y todos tus alumnos lo ven al instante en su app.',
  },
  {
    title: 'Mensajería directa',
    desc: 'Tus alumnos te escriben desde la app. Vos respondés desde el panel.',
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
      <circle cx="8" cy="8" r="8" fill="#ffffff" fillOpacity="0.06"/>
      <line x1="5.5" y1="5.5" x2="10.5" y2="10.5" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="10.5" y1="5.5" x2="5.5" y2="10.5" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

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
        <a href="/" className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 56" width="40" height="26" style={{position:'relative', top:'-1px'}}>
            <rect x="0"  y="14" width="7"  height="28" rx="4" fill="#F97316"/>
            <rect x="9"  y="8"  width="12" height="40" rx="6" fill="#F97316"/>
            <polyline points="25,37 37,47 63,22" stroke="#ffffff" strokeWidth="7" fill="none" strokeLinecap="butt" strokeLinejoin="miter"/>
            <rect x="67" y="8"  width="12" height="40" rx="6" fill="#F97316"/>
            <rect x="81" y="14" width="7"  height="28" rx="4" fill="#F97316"/>
          </svg>
          <span className="text-xl font-extrabold tracking-tight leading-none">
            <span className="font-light text-white">Simple</span><span className="text-[#F97316]">Gym</span>
          </span>
        </a>
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

      {/* ANTES / AHORA */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">El cambio real</p>
          <h2 className="text-3xl font-extrabold text-center mb-12">¿Cómo manejás tu gimnasio hoy?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* ANTES */}
            <div className="bg-white/4 rounded-2xl p-8 border border-white/8">
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-6">Antes</p>
              <ul className="space-y-4">
                {antes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <XIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-white/40 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* AHORA */}
            <div className="bg-[#F97316]/8 rounded-2xl p-8 border border-[#F97316]/20">
              <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest mb-6">Con SimpleGym</p>
              <ul className="space-y-4">
                {ahora.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckIcon className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-white text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FUNDADOR */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-12">Por qué existe SimpleGym</p>
          <div className="flex flex-col sm:flex-row gap-10 items-start">
            <div className="shrink-0 flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-[#F97316]/20 border-2 border-[#F97316]/30 flex items-center justify-center">
                <span className="text-3xl font-extrabold text-[#F97316]">L</span>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-sm">Luis</p>
                <p className="text-white/40 text-xs">Fundador · Pergamino</p>
              </div>
            </div>
            <div className="space-y-4 text-white/70 text-base leading-relaxed">
              <p>
                Trabajé años en gimnasios como empleado y viví en carne propia el caos administrativo: las planillas, los olvidos, los cobros que se perdían.
              </p>
              <p>
                A los 24 abrí mi propio gimnasio en una esquina de dos bulevares en Pergamino. Ahí entendí que ser profe no alcanza — también tenés que ser administrador, contador y comunicador al mismo tiempo.
              </p>
              <p>
                Cuando mis alumnos empezaron a crecer en número, decidí crear la herramienta que yo hubiera querido tener desde el primer día. Una que entienda cómo funciona un gimnasio de verdad.
              </p>
              <p className="text-white font-semibold">
                Te lo prometo: para tu gimnasio va a ser un antes y un después.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white/5 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Funcionalidades</p>
          <h2 className="text-3xl font-extrabold text-center mb-12">Todo lo que necesitás, sin lo que no</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/8 rounded-2xl overflow-hidden">
            {features.map((f, i) => (
              <div key={f.title} className={`bg-[#0D1B2A] p-7 ${i === 0 ? 'rounded-tl-2xl' : ''} ${i === 2 ? 'rounded-tr-2xl' : ''} ${i === 3 ? 'rounded-bl-2xl' : ''} ${i === 5 ? 'rounded-br-2xl' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-[#F97316]/15 flex items-center justify-center mb-4">
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                    <polyline points="2.5,9 6,12.5 13.5,3.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
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
                <h3 className="text-xl font-extrabold mb-1">{p.name}</h3>
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
              <div className="w-14 h-14 rounded-full bg-[#F97316]/15 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                  <polyline points="4,13 9,18 20,6" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
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
            <span className="font-light">Simple</span><span className="text-[#F97316]">Gym</span> © {new Date().getFullYear()}
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
