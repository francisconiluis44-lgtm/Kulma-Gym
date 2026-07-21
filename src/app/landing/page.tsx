import { StudentAppSection } from './StudentAppSection'
import { ComparisonSection } from './ComparisonSection'

const WHATSAPP_NUMBER = '542477221589'
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Quiero%20más%20info%20sobre%20SimpleGym`

const problemaBefore = [
  { title: 'El gimnasio te administra a vos.', desc: 'Pasás más tiempo resolviendo problemas que entrenando con tus alumnos.' },
  { title: 'Los alumnos te escriben todo el día.', desc: 'Cuándo vence la cuota, la rutina o si registraste un pago.' },
  { title: 'Tenés que investigar quién debe.', desc: 'Revisás Mercado Pago, planillas y WhatsApp para reconstruir qué pasó.' },
  { title: 'Las rutinas terminan perdidas.', desc: 'En papel, PDF o conversaciones viejas de chat.' },
]

const problemaAfter = [
  { title: 'Vos volvés a administrar el gimnasio.', desc: 'La administración deja de marcar tu día y vuelve a estar bajo control.' },
  { title: 'Cada alumno tiene su propia app.', desc: 'Consulta rutinas, vencimientos y asistencias sin preguntarte.' },
  { title: 'Lo sabés en menos de 5 segundos.', desc: 'Abrís el dashboard y ves quién debe, quién pagó y qué necesita atención.' },
  { title: 'Las rutinas siempre están disponibles.', desc: 'Las actualizás una vez y el alumno las consulta desde su app cuando las necesita.' },
]

const pasos = [
  {
    n: '01',
    title: 'Nos contás cómo funciona tu gimnasio.',
    desc: 'Horarios, planes, forma de cobrar y cualquier detalle importante. Nosotros nos ocupamos del resto.',
  },
  {
    n: '02',
    title: 'Dejamos todo preparado.',
    desc: 'Creamos tu gimnasio, configuramos la plataforma con tu logo, tus colores y dejamos todo listo para empezar.',
  },
  {
    n: '03',
    title: 'Empezás a trabajar.',
    desc: 'Desde el primer día administrás tu gimnasio desde el panel mientras tus alumnos ya usan su propia app.',
  },
]

const beneficios = [
  { title: 'Dashboard inteligente',       desc: 'Entrás y entendés el estado del gimnasio en menos de cinco segundos.' },
  { title: 'Cobros organizados',          desc: 'Sabé quién pagó, quién debe y qué membresías vencen pronto.' },
  { title: 'App para alumnos',            desc: 'Una experiencia moderna que mantiene conectado al alumno con el gimnasio.' },
  { title: 'Comunicación simple',         desc: 'Comunicados, mensajes y acceso directo por WhatsApp cuando hace falta.' },
  { title: 'Rutinas siempre disponibles', desc: 'El alumno consulta su entrenamiento cuando quiera, desde su celular.' },
  { title: 'Desde cualquier lugar',       desc: 'Usalo desde la computadora o el celular sin instalar programas.' },
]

const diferencias = [
  { title: 'Hecho por un profesor',           desc: 'Cada pantalla nació de necesidades reales de un gimnasio, no de una oficina.' },
  { title: 'Todo tiene un porqué',            desc: 'Cada dato que ves sirve para tomar una decisión. No hay funciones de relleno.' },
  { title: 'Pensado para usar todos los días', desc: 'No necesitás aprender un sistema complejo para hacer tareas simples.' },
  { title: 'Evoluciona con los gimnasios',    desc: 'SimpleGym mejora constantemente escuchando a quienes lo usan todos los días.' },
]

const planes = [
  {
    name: 'Starter',
    desc: 'Hasta 50 alumnos.',
    features: ['Dashboard completo', 'Gestión de alumnos', 'Cobros y membresías', 'App para alumnos', 'Soporte'],
  },
  {
    name: 'Pro',
    highlight: true,
    desc: 'Hasta 200 alumnos.',
    features: ['Todo lo de Starter', 'Estadísticas avanzadas', 'Comunicación con alumnos', 'Rutinas', 'Más capacidad para crecer'],
  },
  {
    name: 'Premium',
    desc: 'Alumnos ilimitados.',
    features: ['Todas las funciones', 'Sin límite de alumnos', 'Prioridad en nuevas funciones', 'Soporte prioritario', 'Preparado para grandes gimnasios'],
  },
]

const fundadorParrafos = [
  'A los 24 años abrí mi propio gimnasio en Pergamino. Como muchos profes, empecé administrando todo a mano y probé distintos sistemas que siempre me sobraban o faltaban en algo.',
  'Decidí hacer el software que a mí me hubiera gustado tener desde el primer día. Cada pantalla nació mientras atendía alumnos, cobraba cuotas y organizaba rutinas.',
  'Hoy SimpleGym sigue creciendo con esa misma idea: que otros profes puedan trabajar más tranquilos y dedicar más tiempo al gimnasio.',
]

function SmallCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <circle cx="8" cy="8" r="8" fill="#F97316" fillOpacity="0.15"/>
      <polyline points="4.5,8.5 7,11 11.5,5.5" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function WaIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function TileIcon() {
  return (
    <div className="w-10 h-10 rounded-xl bg-[#F97316]/15 flex items-center justify-center mb-5 shrink-0">
      <svg viewBox="0 0 16 16" fill="none" className="w-5 h-5">
        <polyline points="2.5,9 6,12.5 13.5,3.5" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <rect x="7" y="2" width="10" height="20" rx="3"/>
      <circle cx="12" cy="18" r="1" fill="#F97316" stroke="none"/>
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <circle cx="12" cy="8" r="4"/>
      <path d="M5 21a7 7 0 0 1 14 0"/>
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
      <path d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z"/>
    </svg>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0D1B2A] text-white font-sans">

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-[#0D1B2A]/90 backdrop-blur-md border-b border-white/5">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#F97316] text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-[#ea6a0a] transition-colors shadow-[0_4px_16px_rgba(249,115,22,0.35)]"
          >
            Probar gratis
          </a>
        </nav>
      </header>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-10 text-center">
        <span className="inline-block bg-[#F97316]/15 text-[#F97316] text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-7">
          Hecho por un profesor, para profesores
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6 text-balance">
          Menos administración.<br />
          <span className="text-[#F97316]">Más gimnasio.</span>
        </h1>
        <p className="text-white/60 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Dejá de perder tiempo entre planillas, cuadernos y WhatsApp. SimpleGym reúne todo en un solo lugar para que en menos de 5 segundos sepas qué está pasando en tu gimnasio, mientras tus alumnos gestionan su día a día desde su propia app.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#F97316] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#ea6a0a] transition-colors text-base shadow-[0_8px_28px_rgba(249,115,22,0.4)]"
          >
            Probar gratis →
          </a>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/20 text-white font-semibold px-8 py-4 rounded-xl hover:border-white/40 transition-colors text-base flex items-center justify-center gap-2"
          >
            <WaIcon className="w-4 h-4 text-[#25D366]" />
            Hablar por WhatsApp
          </a>
        </div>
      </section>

      {/* DOS EXPERIENCIAS — dashboard 70% + celular 30% con badges */}
      <div className="max-w-5xl mx-auto px-6 pb-10 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-[4fr_2fr] gap-6 items-start">

          {/* Panel del Profesor */}
          <div>
            <p className="text-center text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
              Panel del Profesor
            </p>
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(249,115,22,0.15)]">
              <div className="bg-[#141e2e] px-4 py-2.5 flex items-center gap-3 border-b border-white/8">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
                </div>
                <div className="flex-1 bg-white/5 rounded px-3 py-0.5 text-xs text-white/25 font-mono truncate">
                  app.simplegym.com.ar/admin
                </div>
              </div>
              <div
                className="h-[300px] sm:h-[420px] lg:h-[540px]"
                style={{
                  backgroundImage: 'url(/dashboard-bueno.png.jpeg)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'top',
                }}
              />
            </div>
          </div>

          {/* App del Alumno + floating badges */}
          <div className="flex flex-col items-center">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
              App del Alumno
            </p>
            <div
              className="relative"
              style={{
                width: 210 + 16,
                background: '#1C1C2E',
                borderRadius: 40,
                padding: 8,
                boxShadow: '0 0 0 1.5px rgba(255,255,255,0.12), 0 24px 60px rgba(0,0,0,0.55)',
              }}
            >
              {/* Notch */}
              <div className="absolute top-[18px] left-1/2 -translate-x-1/2 z-10"
                style={{ width: 48, height: 5, background: '#2a2a3e', borderRadius: 999 }}
              />
              {/* Pantalla */}
              <div style={{ borderRadius: 32, overflow: 'hidden', background: '#F7F4EF', maxHeight: 460 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/student-app-demo-v2.png"
                  alt="App del alumno SimpleGym"
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
              {/* Floating callout badges — solo visible en desktop */}
              <div className="absolute right-full mr-3 top-10 hidden lg:flex flex-col gap-2.5 items-end">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap"
                  style={{ background: 'rgba(13,27,42,0.92)', border: '1px solid rgba(249,115,22,0.3)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                >
                  <SmallCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-white/80">Asistencia registrada</span>
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap"
                  style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                >
                  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 shrink-0">
                    <rect x="1" y="2" width="12" height="11" rx="2" stroke="#F97316" strokeWidth="1.2"/>
                    <line x1="1" y1="5" x2="13" y2="5" stroke="#F97316" strokeWidth="1.2"/>
                    <line x1="4" y1="1" x2="4" y2="3.5" stroke="#F97316" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="10" y1="1" x2="10" y2="3.5" stroke="#F97316" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-[#F97316]/90">Membresía al día</span>
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap"
                  style={{ background: 'rgba(13,27,42,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                >
                  <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 shrink-0">
                    <path d="M7 1.5a4.5 4.5 0 0 1 4.5 4.5c0 2-1 3.5-1 4.5H3.5c0-1-1-2.5-1-4.5A4.5 4.5 0 0 1 7 1.5Z" stroke="#93c5fd" strokeWidth="1.2"/>
                    <line x1="5.5" y1="11" x2="8.5" y2="11" stroke="#93c5fd" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <span className="text-blue-300/80">Nuevo comunicado</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3 DIFERENCIALES */}
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="flex flex-col items-center text-center px-6 py-8 rounded-2xl bg-white/3 border border-white/8 hover:border-[#F97316]/20 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#F97316]/15 flex items-center justify-center mb-5">
              <PhoneIcon />
            </div>
            <h3 className="font-bold text-white mb-2 text-sm">App para tus alumnos</h3>
            <p className="text-white/50 text-sm leading-relaxed">Cada alumno tiene su propia experiencia con la identidad de tu gimnasio.</p>
          </div>

          <div className="flex flex-col items-center text-center px-6 py-8 rounded-2xl bg-white/3 border border-white/8 hover:border-[#F97316]/20 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#F97316]/15 flex items-center justify-center mb-5">
              <PersonIcon />
            </div>
            <h3 className="font-bold text-white mb-2 text-sm">Diseñado desde adentro</h3>
            <p className="text-white/50 text-sm leading-relaxed">Cada función nació administrando un gimnasio real, no en una oficina.</p>
          </div>

          <div className="flex flex-col items-center text-center px-6 py-8 rounded-2xl bg-white/3 border border-white/8 hover:border-[#F97316]/20 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-[#F97316]/15 flex items-center justify-center mb-5">
              <SparkleIcon />
            </div>
            <h3 className="font-bold text-white mb-2 text-sm">IA integrada (próximamente)</h3>
            <p className="text-white/50 text-sm leading-relaxed">Muy pronto vas a poder preguntarle a SimpleGym quién debe la cuota o qué alumnos dejaron de venir.</p>
          </div>

        </div>
      </div>

      {/* EL PROBLEMA */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">El cambio real</p>
          <h2 className="text-3xl font-extrabold text-center mb-4 text-balance">
            Así cambia tu día cuando dejás de administrar a mano.
          </h2>
          <p className="text-white/40 text-sm text-center mb-12 max-w-lg mx-auto">
            No se trata de trabajar más. Se trata de dejar de perder tiempo en tareas que deberían resolverse solas.
          </p>
          <ComparisonSection before={problemaBefore} after={problemaAfter} />
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Empezar es fácil</p>
          <h2 className="text-3xl font-extrabold text-center mb-14 text-balance">
            Nosotros dejamos tu gimnasio listo.<br className="hidden sm:block" /> Vos empezás a usarlo.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {pasos.map((p) => (
              <div key={p.n} className="relative pl-6 border-l border-[#F97316]/30">
                <span className="text-[#F97316]/30 text-xs font-bold uppercase tracking-widest block mb-2">{p.n}</span>
                <h3 className="font-bold text-white text-lg mb-2 leading-snug">{p.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <p className="text-xl sm:text-2xl font-bold text-white max-w-2xl mx-auto leading-snug">
              &ldquo;No te entregamos un software.<br className="hidden sm:block" />
              Te entregamos tu gimnasio listo para trabajar desde el primer día.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* STUDENT APP DEMO */}
      <StudentAppSection />

      {/* IA — sección destacada */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6">
          <div
            className="relative rounded-3xl overflow-hidden px-8 py-12 sm:px-14 sm:py-16"
            style={{
              background: 'linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(13,27,42,0) 60%)',
              border: '1px solid rgba(249,115,22,0.22)',
            }}
          >
            {/* Decorative glow */}
            <div
              className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }}
            />

            <div className="relative">
              <span className="inline-block bg-[#F97316]/15 text-[#F97316] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
                Próximamente · IA integrada
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold mb-5 leading-tight text-balance">
                No muestra datos.<br className="hidden sm:block" />
                <span className="text-[#F97316]">Te dice qué hacer.</span>
              </h2>

              <p className="text-white/55 max-w-xl mb-10 leading-relaxed">
                Lo que hoy te lleva 20 minutos de revisar pantallas y planillas, lo sabés con una pregunta.
                SimpleGym incorporará IA que analiza tu gimnasio y te da respuestas al instante, sin que tengas que buscar nada.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-white/70"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-[#F97316] font-bold shrink-0">→</span>
                  <span>"¿Quiénes deben la cuota este mes?"</span>
                </div>
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-white/70"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-[#F97316] font-bold shrink-0">→</span>
                  <span>"¿Qué alumnos no vienen hace dos semanas?"</span>
                </div>
              </div>

              <p className="text-white/25 text-xs mt-8">
                Función en desarrollo · Avisanos si querés ser de los primeros en probarla
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="bg-white/5 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Todo pensado para el día a día</p>
          <h2 className="text-3xl font-extrabold text-center mb-14">Menos administración. Más gimnasio.</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/8 rounded-2xl overflow-hidden">
            {beneficios.map((b, i) => (
              <div
                key={b.title}
                className={`bg-[#0D1B2A] p-8 ${i === 0 ? 'rounded-tl-2xl' : ''} ${i === 2 ? 'rounded-tr-2xl' : ''} ${i === 3 ? 'rounded-bl-2xl' : ''} ${i === 5 ? 'rounded-br-2xl' : ''}`}
              >
                <TileIcon />
                <h3 className="font-bold text-white mb-2">{b.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* POR QUÉ SIMPLEGYM */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">La diferencia</p>
          <h2 className="text-3xl font-extrabold text-center mb-4 text-balance">
            No diseñamos un software.<br className="hidden sm:block" /> Diseñamos una forma más simple de trabajar.
          </h2>
          <p className="text-white/40 text-sm text-center mb-14 max-w-md mx-auto">
            La mayoría de las apps de gestión son para contadores. SimpleGym es para profes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {diferencias.map((d) => (
              <div key={d.title} className="flex gap-4 p-6 rounded-2xl border border-white/8 bg-white/3 hover:border-[#F97316]/25 transition-colors">
                <div className="w-1 shrink-0 rounded-full bg-[#F97316]/40 self-stretch" />
                <div>
                  <h3 className="font-bold text-white mb-1.5">{d.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section className="bg-white/5 py-24" id="planes">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Planes</p>
          <h2 className="text-3xl font-extrabold text-center mb-4">Elegí el plan que mejor se adapta a tu gimnasio.</h2>
          <p className="text-white/50 text-center mb-14 max-w-md mx-auto">Primer mes gratis. Sin permanencia.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {planes.map((p) => (
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
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-center font-bold py-3 rounded-xl transition-colors text-sm ${p.highlight ? 'bg-white text-[#F97316] hover:bg-white/90' : 'bg-[#F97316] text-white hover:bg-[#ea6a0a]'}`}
                >
                  Consultá precio
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNDADOR */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-12">Quién está detrás de SimpleGym</p>
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
            <div>
              <div className="space-y-4 text-white/65 leading-relaxed">
                {fundadorParrafos.map((p, i) => (
                  <p key={i} className="text-sm sm:text-base">{p}</p>
                ))}
              </div>
              <blockquote className="mt-8 border-l-[3px] border-[#F97316] pl-5">
                <p className="text-white font-semibold text-base leading-relaxed">
                  &ldquo;SimpleGym no nació para vender software.<br className="hidden sm:block" />
                  Nació para resolver los problemas reales de un gimnasio.&rdquo;
                </p>
                <footer className="text-[#F97316]/60 text-xs mt-2 font-medium">— Luis, Fundador</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-28 border-t border-white/10 bg-[#F97316]/5">
        <div className="max-w-xl mx-auto px-6 text-center">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest mb-5">Empezá hoy</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 text-balance leading-tight">
            Probalo en tu gimnasio<br className="hidden sm:block" /> y comprobalo vos mismo.
          </h2>
          <p className="text-white/50 mb-12 text-lg leading-relaxed">
            Escribime por WhatsApp y coordinamos una demostración. Sin compromiso.
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] text-white font-bold px-10 py-5 rounded-2xl hover:bg-[#1ebe5c] transition-colors text-lg shadow-[0_12px_40px_rgba(37,211,102,0.45)]"
          >
            <WaIcon className="w-5 h-5" />
            Quiero probar SimpleGym
          </a>
          <p className="text-white/25 text-xs mt-8">Primer mes gratis · Sin permanencia · Soporte directo con el creador</p>
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
