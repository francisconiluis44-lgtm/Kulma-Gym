import { createAdminClient } from '@/lib/supabase/admin'
import { getSuperadminSession } from '@/lib/superadmin-auth'
import { aprobarSolicitud, rechazarSolicitud } from './actions'

export default async function SolicitudesPage() {
  await getSuperadminSession()
  const adminSupabase = createAdminClient()

  const [{ data: solicitudes }, { data: gimnasios }] = await Promise.all([
    adminSupabase.from('solicitudes_admin').select('*').order('created_at', { ascending: false }),
    adminSupabase.from('gimnasios').select('id, nombre'),
  ])

  const gymMap = new Map((gimnasios ?? []).map((g) => [g.id, g.nombre]))

  const pendientes = (solicitudes ?? []).filter((s) => s.estado === 'pendiente')
  const resueltas = (solicitudes ?? []).filter((s) => s.estado !== 'pendiente')

  return (
    <>
      <h2 className="text-2xl font-heading font-bold text-white mb-6">
        Solicitudes de acceso
        {pendientes.length > 0 && (
          <span className="ml-3 text-sm font-body bg-orange/20 text-orange px-2.5 py-1 rounded-full">
            {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
          </span>
        )}
      </h2>

      {pendientes.length === 0 && resueltas.length === 0 && (
        <p className="text-white/30 font-body text-sm text-center py-16">No hay solicitudes todavía.</p>
      )}

      {pendientes.length > 0 && (
        <div className="space-y-3 mb-8">
          <p className="text-xs font-semibold font-body text-white/40 uppercase tracking-widest mb-3">Pendientes</p>
          {pendientes.map((s) => {
            const gymNombre = gymMap.get(s.gimnasio_id)
            return (
              <div key={s.id} className="bg-gray-900 border border-orange/30 rounded-2xl px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-white text-sm">{s.nombre}</p>
                  <p className="text-xs text-white/50 font-body">{s.email}</p>
                  <p className="text-xs text-orange font-body mt-0.5">{gymNombre}</p>
                </div>
                <p className="text-xs text-white/30 font-body tabular-nums shrink-0">
                  {new Date(s.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </p>
                <div className="flex gap-2 shrink-0">
                  <form action={async () => {
                    'use server'
                    await aprobarSolicitud(s.id, s.email, s.gimnasio_id)
                  }}>
                    <button type="submit" className="text-xs font-semibold font-body bg-green-800/40 text-green-300 hover:bg-green-800/60 px-3 py-1.5 rounded-lg transition-colors">
                      Aprobar
                    </button>
                  </form>
                  <form action={async () => {
                    'use server'
                    await rechazarSolicitud(s.id)
                  }}>
                    <button type="submit" className="text-xs font-semibold font-body bg-red-900/30 text-red-400 hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition-colors">
                      Rechazar
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {resueltas.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold font-body text-white/40 uppercase tracking-widest mb-3">Resueltas</p>
          {resueltas.map((s) => {
            const gymNombre = gymMap.get(s.gimnasio_id)
            return (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 flex items-center gap-4 opacity-60">
                <div className="flex-1 min-w-0">
                  <p className="font-body text-white text-sm">{s.nombre}</p>
                  <p className="text-xs text-white/40 font-body">{s.email} · {gymNombre}</p>
                </div>
                <span className={`text-xs font-semibold font-body px-2.5 py-1 rounded-full ${
                  s.estado === 'aprobado' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {s.estado}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
