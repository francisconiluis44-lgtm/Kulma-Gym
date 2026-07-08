import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSuperadminSession } from '@/lib/superadmin-auth'
import AgregarAdminForm from './AgregarAdminForm'
import { quitarAdmin } from './actions'

export default async function GimnasioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await getSuperadminSession()
  const adminSupabase = createAdminClient()

  const [{ data: gym }, { data: gymAdmins }, { data: alumnos }] = await Promise.all([
    adminSupabase.from('gimnasios').select('*').eq('id', id).single(),
    adminSupabase.from('gym_admins').select('user_id, created_at').eq('gimnasio_id', id),
    adminSupabase.from('alumnos').select('id, nombre_completo, fecha_alta').eq('gimnasio_id', id).order('fecha_alta', { ascending: false }),
  ])

  if (!gym) notFound()

  // Resolve admin user emails
  const { data: usersData } = await adminSupabase.auth.admin.listUsers()
  const userMap = new Map(usersData?.users?.map((u) => [u.id, u.email ?? u.id]) ?? [])

  return (
    <>
      <div className="mb-6">
        <Link href="/superadmin" className="text-sm text-white/40 hover:text-white font-body transition-colors">
          ← Volver
        </Link>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-heading font-bold text-white">{gym.nombre}</h2>
            <span className={`text-xs font-semibold font-body px-2 py-0.5 rounded-full ${
              gym.plan === 'pro' ? 'bg-orange/20 text-orange' : 'bg-gray-700 text-gray-400'
            }`}>{gym.plan}</span>
            {!gym.activo && (
              <span className="text-xs font-semibold font-body px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">inactivo</span>
            )}
          </div>
          <p className="text-sm text-white/40 font-body mt-0.5">/{gym.slug} · {alumnos?.length ?? 0} alumnos</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Admins */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <p className="text-xs font-semibold font-body text-white/40 uppercase tracking-widest">Admins</p>
            <span className="text-xs text-white/40 font-body">{gymAdmins?.length ?? 0}</span>
          </div>
          <div className="divide-y divide-gray-800">
            {gymAdmins?.map((ga) => (
              <div key={ga.user_id} className="flex items-center gap-3 px-5 py-3">
                <p className="text-sm font-body text-white flex-1 truncate">
                  {userMap.get(ga.user_id) ?? ga.user_id}
                </p>
                <form action={async () => {
                  'use server'
                  await quitarAdmin(ga.user_id, id)
                }}>
                  <button type="submit" className="text-xs text-red-400 hover:text-red-300 font-body transition-colors">
                    Quitar
                  </button>
                </form>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-gray-800">
            <AgregarAdminForm gimnasioId={id} />
          </div>
        </div>

        {/* Alumnos recientes */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <p className="text-xs font-semibold font-body text-white/40 uppercase tracking-widest">Alumnos recientes</p>
            <span className="text-xs text-white/40 font-body">{alumnos?.length ?? 0}</span>
          </div>
          <div className="divide-y divide-gray-800 max-h-72 overflow-y-auto">
            {!alumnos || alumnos.length === 0 ? (
              <p className="px-5 py-6 text-center text-white/30 font-body text-sm">Sin alumnos.</p>
            ) : (
              alumnos.slice(0, 20).map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <p className="text-sm font-body text-white flex-1 truncate">{a.nombre_completo}</p>
                  <p className="text-xs text-white/30 font-body tabular-nums shrink-0">
                    {new Date(a.fecha_alta).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
