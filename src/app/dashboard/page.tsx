import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email?.endsWith('@kulmagym.app')) {
    redirect('/login')
  }

  const adminSupabase = createAdminClient()
  const { data: alumno } = await adminSupabase
    .from('alumnos')
    .select('nombre_completo')
    .eq('id', user.id)
    .single()

  const nombreCompleto = alumno?.nombre_completo ?? 'Alumno'
  const firstName = nombreCompleto.split(' ')[0]

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy px-4 py-4 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-xl font-heading font-extrabold text-white">
            KULMA GYM
          </h1>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-4 py-1.5 rounded-xl transition-all font-body"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1.5 bg-orange" />
          <div className="px-8 py-10 text-center">
            <div className="w-20 h-20 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-4xl" aria-hidden="true">💪</span>
            </div>
            <h2 className="text-2xl font-heading font-bold text-navy mb-2">
              ¡Bienvenido/a, {firstName}!
            </h2>
            <p className="text-navy/60 font-body text-sm leading-relaxed">
              Estás en Kulma Gym. <br />
              Próximamente vas a poder ver tu rutina, asistencias y más.
            </p>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-navy/30 font-body">
          Más funcionalidades próximamente · Fase 1
        </p>
      </main>
    </div>
  )
}
