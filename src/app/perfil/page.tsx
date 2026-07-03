import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import DatosForm from './DatosForm'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminSupabase = createAdminClient()
  const { data: alumno } = await adminSupabase
    .from('alumnos')
    .select('nombre_completo, dni, whatsapp, fecha_alta, peso, altura, lesiones, objetivo, fecha_nacimiento')
    .eq('id', user.id)
    .single()

  if (!alumno) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy text-white px-4 py-4 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm font-body text-white/70 hover:text-white transition-colors"
          >
            ← Volver
          </Link>
          <p className="text-xl font-heading font-extrabold text-white tracking-wide">Mi perfil</p>
          <div className="w-14" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-4">
            Datos personales
          </p>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs text-navy/50 font-body mb-0.5">Nombre</dt>
              <dd className="font-body font-medium text-navy">{alumno.nombre_completo}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy/50 font-body mb-0.5">DNI</dt>
              <dd className="font-body font-medium text-navy">{alumno.dni}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy/50 font-body mb-0.5">WhatsApp</dt>
              <dd className="font-body font-medium text-navy">{alumno.whatsapp ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-navy/50 font-body mb-0.5">Fecha de alta</dt>
              <dd className="font-body font-medium text-navy">
                {new Date(alumno.fecha_alta).toLocaleDateString('es-AR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-4">
            Mis datos
          </p>
          <p className="text-xs text-navy/50 font-body mb-4">
            Esta información es opcional y ayuda a tu profe a personalizar tu entrenamiento.
          </p>
          <DatosForm
            peso={alumno.peso ?? null}
            altura={alumno.altura ?? null}
            lesiones={alumno.lesiones ?? null}
            objetivo={alumno.objetivo ?? null}
            fecha_nacimiento={alumno.fecha_nacimiento ?? null}
          />
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}
