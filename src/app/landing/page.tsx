import { StudentAppSection } from './StudentAppSection'
import { ComparisonSection } from './ComparisonSection'

const WHATSAPP_NUMBER = '542477221589'
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Quiero%20más%20info%20sobre%20SimpleGym`
const WHATSAPP_CTA     = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Quiero%20probar%20SimpleGym%20durante%203%20meses.`
const WHATSAPP_CONSULTA = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola!%20Tengo%20una%20consulta%20sobre%20SimpleGym.`

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
  { title: 'Todo bajo control',           desc: 'Abrís el panel y en menos de 5 segundos sabés qué requiere tu atención hoy.' },
  { title: 'Cobros organizados',          desc: 'Sabé quién pagó, quién debe y qué membresías vencen pronto.' },
  { title: 'App para tus alumnos',        desc: 'Cada alumno consulta su información desde su celular, con la identidad de tu gimnasio.' },
  { title: 'Menos WhatsApp',             desc: 'Los alumnos encuentran la información que necesitan en la app y vos dejás de responder las mismas preguntas todos los días.' },
  { title: 'Rutinas siempre disponibles', desc: 'Las actualizás una vez y el alumno las encuentra cuando las necesita.' },
  { title: 'Desde cualquier lugar',       desc: 'Usalo desde la computadora o el celular sin instalar programas.' },
]

const convicciones = [
  {
    title: 'Si no resuelve algo real, no existe.',
    desc: 'Cada pantalla tiene que ganarse su lugar. Sin funciones de relleno ni opciones que nadie termina usando.',
  },
  {
    title: 'Nació en la cancha, no en una oficina.',
    desc: 'Las decisiones del producto parten de lo que sucede todos los días entre profesores, alumnos y mostrador.',
  },
  {
    title: 'Mejorar no es agregar por agregar.',
    desc: 'SimpleGym evoluciona a partir de necesidades reales de los gimnasios, manteniendo siempre la misma prioridad: hacer el trabajo más simple.',
  },
]

const planes = [
  { rango: 'Hasta 50 alumnos',     precio: '15.000' },
  { rango: 'De 50 a 100 alumnos',  precio: '20.000' },
  { rango: 'De 100 a 250 alumnos', precio: '25.000' },
  { rango: 'Más de 250 alumnos',   precio: '30.000' },
]

const planesFeatures = [
  'Dashboard de gestión completo',
  'Gestión de alumnos y membresías',
  'Cobros y seguimiento de pagos',
  'App para alumnos',
  'Rutinas y comunicados',
  'Soporte directo con el creador',
]

const fundadorParrafos = [
  'Abrí mi gimnasio a los 24 años. Con el tiempo entendí que entrenar alumnos era solo una parte del trabajo: también había que controlar pagos, asistencias, rutinas, vencimientos y mensajes durante todo el día.',
  'Probé distintas formas de organizarlo, pero siempre terminaba entre planillas, cuadernos y WhatsApp. Por eso empecé a crear SimpleGym: una herramienta pensada desde la experiencia real de administrar un gimnasio.',
  'No para agregar más tecnología al trabajo, sino para sacar del medio todo lo que hace perder tiempo.',
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

      {/* TODO CONECTADO — Block 4 */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Todo conectado</p>
          <h2 className="text-3xl font-extrabold text-center mb-4 text-balance">
            Un sistema. Dos experiencias.
          </h2>
          <p className="text-white/40 text-sm text-center mb-14 max-w-lg mx-auto">
            Lo que vos hacés en el panel, el alumno lo ve en su app al instante. Sin llamadas, sin mensajes, sin fricción.
          </p>

          <div className="space-y-5">

            {/* Historia 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_36px_1fr] gap-3 items-center">
              <div className="rounded-2xl bg-white/3 border border-white/8 p-5 sm:p-6">
                <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-3">Panel · Profe</p>
                <p className="text-white font-semibold text-sm mb-1.5">Cobrás una vez.</p>
                <p className="text-white/50 text-sm leading-relaxed">Registrás el pago y el estado del alumno se actualiza al instante.</p>
              </div>
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#F97316]/40 rotate-90 sm:rotate-0">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="rounded-2xl bg-[#F97316]/8 border border-[#F97316]/20 p-5 sm:p-6">
                <p className="text-[#F97316]/60 text-[10px] font-bold uppercase tracking-widest mb-3">App · Alumno</p>
                <p className="text-white/80 text-sm leading-relaxed">Ve que su cuota está al día sin mandarte un solo WhatsApp.</p>
              </div>
            </div>

            {/* Historia 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_36px_1fr] gap-3 items-center">
              <div className="rounded-2xl bg-white/3 border border-white/8 p-5 sm:p-6">
                <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-3">Panel · Profe</p>
                <p className="text-white font-semibold text-sm mb-1.5">Actualizás una rutina.</p>
                <p className="text-white/50 text-sm leading-relaxed">La modificás una sola vez en el panel.</p>
              </div>
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#F97316]/40 rotate-90 sm:rotate-0">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="rounded-2xl bg-[#F97316]/8 border border-[#F97316]/20 p-5 sm:p-6">
                <p className="text-[#F97316]/60 text-[10px] font-bold uppercase tracking-widest mb-3">App · Alumno</p>
                <p className="text-white/80 text-sm leading-relaxed">La encuentra automáticamente en su celular.</p>
              </div>
            </div>

            {/* Historia 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_36px_1fr] gap-3 items-center">
              <div className="rounded-2xl bg-white/3 border border-white/8 p-5 sm:p-6">
                <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest mb-3">Panel · Profe</p>
                <p className="text-white font-semibold text-sm mb-1.5">Seguís a tus alumnos.</p>
                <p className="text-white/50 text-sm leading-relaxed">Detectás quién dejó de venir y necesitás contactar.</p>
              </div>
              <div className="flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#F97316]/40 rotate-90 sm:rotate-0">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="rounded-2xl bg-[#F97316]/8 border border-[#F97316]/20 p-5 sm:p-6">
                <p className="text-[#F97316]/60 text-[10px] font-bold uppercase tracking-widest mb-3">App · Alumno</p>
                <p className="text-white/80 text-sm leading-relaxed">Consulta sus asistencias y mantiene su entrenamiento organizado.</p>
              </div>
            </div>

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
                Próximamente · SimpleGym IA
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold mb-5 leading-tight text-balance">
                No muestra datos.<br className="hidden sm:block" />
                <span className="text-[#F97316]">Te dice qué hacer.</span>
              </h2>

              <p className="text-white/55 max-w-xl mb-10 leading-relaxed">
                Lo que hoy te lleva varios minutos entre pantallas y planillas, mañana lo vas a resolver con una sola pregunta.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-white/70"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-[#F97316] font-bold shrink-0">→</span>
                  <span>&ldquo;¿Quiénes debería contactar hoy?&rdquo;</span>
                </div>
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-white/70"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-[#F97316] font-bold shrink-0">→</span>
                  <span>&ldquo;¿Qué alumnos dejaron de venir?&rdquo;</span>
                </div>
                <div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-white/70"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-[#F97316] font-bold shrink-0">→</span>
                  <span>&ldquo;¿Cómo viene la facturación este mes?&rdquo;</span>
                </div>
              </div>

              <p className="text-white/80 text-sm font-semibold mt-10 mb-3">
                SimpleGym IA consulta y analiza. Vos decidís.
              </p>
              <p className="text-white/25 text-xs">
                Complemento opcional disponible próximamente para todos los planes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="bg-white/5 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Herramientas de cancha</p>
          <h2 className="text-3xl font-extrabold text-center mb-4 text-balance">Cada función nació para resolver un problema real del gimnasio.</h2>
          <p className="text-white/40 text-sm text-center mb-14 max-w-lg mx-auto">Sin funciones de relleno. Solo lo que necesitás para trabajar mejor todos los días.</p>
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
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Por qué SimpleGym</p>
          <h2 className="text-3xl font-extrabold text-center mb-4 text-balance">
            No busca tener más funciones.<br className="hidden sm:block" /> Busca entender mejor cómo funciona un gimnasio.
          </h2>
          <p className="text-white/40 text-sm text-center mb-14 max-w-lg mx-auto leading-relaxed">
            Cualquier software puede sumar herramientas. SimpleGym nació dentro de un gimnasio real, y esa experiencia define cada decisión del producto.
          </p>
          <div className="space-y-6">
            {convicciones.map((c) => (
              <div key={c.title} className="flex gap-5 p-6 rounded-2xl border border-white/8 bg-white/3">
                <div className="w-[3px] shrink-0 rounded-full bg-[#F97316]/50 self-stretch" />
                <div>
                  <h3 className="font-bold text-white text-base mb-1.5">{c.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-white/55 text-center text-sm leading-relaxed mt-12 max-w-lg mx-auto">
            Porque un sistema bien hecho no es el que tiene todo.<br className="hidden sm:block" /> Es el que te deja trabajar sin pensar en él.
          </p>
        </div>
      </section>

      {/* PLANES */}
      <section className="bg-white/5 py-24" id="planes">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-3">Planes</p>
          <h2 className="text-3xl font-extrabold text-center mb-4 text-balance">
            Todas las funciones. Pagás según el tamaño de tu gimnasio.
          </h2>
          <p className="text-white/40 text-sm text-center mb-10 max-w-xl mx-auto leading-relaxed">
            No bloqueamos herramientas según el plan. Todos tienen acceso a la experiencia completa de SimpleGym.
            La única diferencia es la cantidad de alumnos activos que administrás.
          </p>

          {/* Trial banner */}
          <div className="rounded-2xl bg-[#F97316]/10 border border-[#F97316]/25 px-6 py-5 text-center mb-10">
            <p className="text-[#F97316] font-bold mb-1.5">3 meses gratis para que construyas el historial de tu gimnasio.</p>
            <p className="text-white/50 text-sm leading-relaxed max-w-xl mx-auto">
              Cargás tus alumnos, empezás a trabajar y al tercer mes ya tenés 90 días de asistencias,
              pagos y movimientos reales. Ahí es cuando SimpleGym muestra todo su valor. Sin compromiso.
            </p>
          </div>

          {/* Pricing tiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {planes.map((p) => (
              <div
                key={p.rango}
                className="rounded-2xl bg-[#0D1B2A] border border-white/10 p-6 flex flex-col items-center text-center hover:border-[#F97316]/30 transition-colors"
              >
                <p className="text-white/45 text-xs font-semibold mb-5 leading-snug">{p.rango}</p>
                <p className="text-[2rem] font-extrabold text-white leading-none mb-1">${p.precio}</p>
                <p className="text-white/30 text-xs mb-6">ARS / mes</p>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center bg-[#F97316] text-white font-bold py-2.5 rounded-xl hover:bg-[#ea6a0a] transition-colors text-sm"
                >
                  Empezar gratis
                </a>
              </div>
            ))}
          </div>

          {/* Features incluidas en todos */}
          <div className="rounded-2xl border border-white/8 bg-white/3 px-6 py-5 mb-6">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest text-center mb-4">Todos los planes incluyen</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
              {planesFeatures.map((f) => (
                <span key={f} className="flex items-center gap-2 text-white/60 text-sm">
                  <span className="text-[#F97316] shrink-0">✓</span>{f}
                </span>
              ))}
            </div>
          </div>

          {/* IA — nota pequeña */}
          <p className="text-white/25 text-xs text-center mb-8">
            SimpleGym IA estará disponible próximamente como complemento opcional para cualquier plan.
          </p>

          {/* Internacional */}
          <p className="text-white/35 text-sm text-center">
            ¿Tu gimnasio está fuera de Argentina?{' '}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F97316]/70 hover:text-[#F97316] underline underline-offset-2 transition-colors"
            >
              Consultá el precio disponible para tu país
            </a>
          </p>
        </div>
      </section>

      {/* FUNDADOR */}
      <section className="py-24 border-t border-white/10">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest text-center mb-4">Desde adentro del gimnasio</p>
          <h2 className="text-3xl font-extrabold text-center mb-12 text-balance">
            Primero vino el gimnasio.<br className="hidden sm:block" /> Después nació SimpleGym.
          </h2>

          <div className="space-y-5 text-white/60 leading-relaxed mb-10">
            {fundadorParrafos.map((p, i) => (
              <p key={i} className="text-base">{p}</p>
            ))}
          </div>

          {/* Firma */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-11 h-11 rounded-full bg-[#F97316]/20 border border-[#F97316]/30 flex items-center justify-center shrink-0">
              <span className="text-lg font-extrabold text-[#F97316]">L</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Luis Francisconi</p>
              <p className="text-white/40 text-xs">Profesor de Educación Física y fundador de Kulma Gym</p>
            </div>
          </div>

          {/* Remate */}
          <blockquote className="border-l-[3px] border-[#F97316] pl-5">
            <p className="text-white/80 text-sm leading-relaxed">
              Hoy sigo administrando mi gimnasio. Por eso SimpleGym sigue construyéndose desde la realidad de quienes lo usan.
            </p>
          </blockquote>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-28 border-t border-white/10 bg-[#F97316]/5">
        <div className="max-w-xl mx-auto px-6 text-center">
          <p className="text-[#F97316] text-xs font-bold uppercase tracking-widest mb-5">Empezá hoy</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 text-balance leading-tight">
            Tu gimnasio ya cambió.<br className="hidden sm:block" />
            <span className="text-[#F97316]">Ahora falta la forma de administrarlo.</span>
          </h2>
          <p className="text-white/50 mb-12 text-lg leading-relaxed max-w-lg mx-auto">
            Probá SimpleGym gratis durante 3 meses. Te ayudamos a dejar tu gimnasio listo para que empieces a organizar alumnos, cobros, asistencias y rutinas desde un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={WHATSAPP_CTA}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#1ebe5c] transition-colors text-base shadow-[0_12px_40px_rgba(37,211,102,0.45)]"
            >
              <WaIcon className="w-5 h-5" />
              Quiero probar SimpleGym
            </a>
            <a
              href={WHATSAPP_CONSULTA}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 border border-white/20 text-white font-semibold px-8 py-4 rounded-2xl hover:border-white/40 transition-colors text-base"
            >
              <WaIcon className="w-4 h-4 text-white/60" />
              Hablar por WhatsApp
            </a>
          </div>
          <p className="text-white/25 text-xs mt-8">3 meses gratis · Sin tarjeta · Sin compromiso · Con acompañamiento desde el primer día</p>
          <p className="text-white/20 text-xs mt-5 font-semibold tracking-wide">
            SimpleGym. Menos administración. Más gimnasio.
          </p>
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
