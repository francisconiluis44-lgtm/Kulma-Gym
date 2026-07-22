import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSuperadminSession } from '@/lib/superadmin-auth'
import { toggleGimnasioActivo } from './actions'

export default async function SuperadminPage() {
  await getSuperadminSession()
  const adminSupabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = adminSupabase as any

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
  const primerDiaMes = hoy.slice(0, 7) + '-01'

  const [{ data: gimnasios }, { data: alumnos }, { data: gymAdmins }, { data: aiMes }, { data: aiHoy }] = await Promise.all([
    adminSupabase.from('gimnasios').select('*').order('created_at', { ascending: true }),
    adminSupabase.from('alumnos').select('id, gimnasio_id'),
    adminSupabase.from('gym_admins').select('gimnasio_id'),
    adminAny.from('ai_usage').select('gimnasio_id, estimated_cost').gte('created_at', primerDiaMes),
    adminAny.from('ai_usage').select('gimnasio_id').gte('created_at', hoy),
  ])

  function countFor(gimnasioId: string, list: { gimnasio_id: string | null }[]) {
    return list.filter((r) => r.gimnasio_id === gimnasioId).length
  }

  type AiMesRow = { gimnasio_id: string; estimated_cost: number }
  type AiHoyRow = { gimnasio_id: string }

  function aiStatsFor(gimnasioId: string) {
    const rowsMes = (aiMes ?? []).filter((r: AiMesRow) => r.gimnasio_id === gimnasioId)
    const rowsHoy = (aiHoy ?? []).filter((r: AiHoyRow) => r.gimnasio_id === gimnasioId)
    const consultasMes = rowsMes.length
    const consultasHoy = rowsHoy.length
    const costoMes = rowsMes.reduce((sum: number, r: AiMesRow) => sum + Number(r.estimated_cost), 0)
    const costoPorPregunta = consultasMes > 0 ? costoMes / consultasMes : null
    return { consultasMes, consultasHoy, costoMes, costoPorPregunta }
  }

  const totalConsultasMes = (aiMes ?? []).length
  const totalConsultasHoy = (aiHoy ?? []).length
  const totalCostoMes = (aiMes ?? []).reduce((sum: number, r: AiMesRow) => sum + Number(r.estimated_cost), 0)

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-white">Gimnasios</h2>
          <p className="text-sm text-white/40 font-body mt-0.5">{gimnasios?.length ?? 0} registrados</p>
        </div>
        <Link
          href="/superadmin/gimnasios/nuevo"
          className="bg-orange text-white text-sm font-semibold font-body px-4 py-2.5 rounded-xl hover:bg-orange/90 active:scale-95 transition-all"
        >
          + Nuevo gimnasio
        </Link>
      </div>

      <div className="space-y-3 mb-10">
        {!gimnasios || gimnasios.length === 0 ? (
          <p className="text-white/30 font-body text-sm text-center py-16">No hay gimnasios todavía.</p>
        ) : (
          gimnasios.map((g) => {
            const nAlumnos = countFor(g.id, alumnos ?? [])
            const nAdmins = countFor(g.id, gymAdmins ?? [])
            return (
              <div
                key={g.id}
                className={`bg-gray-900 border rounded-2xl px-5 py-4 flex items-center gap-4 ${
                  g.activo ? 'border-gray-800' : 'border-gray-700 opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-heading font-bold text-white text-base">{g.nombre}</p>
                    <span className={`text-xs font-semibold font-body px-2 py-0.5 rounded-full ${
                      g.plan === 'pro' ? 'bg-orange/20 text-orange' : 'bg-gray-700 text-gray-400'
                    }`}>
                      {g.plan}
                    </span>
                    {!g.activo && (
                      <span className="text-xs font-semibold font-body px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">
                        inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 font-body">/{g.slug}</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs font-body text-white/50">
                      <span className="text-white font-semibold">{nAlumnos}</span> alumnos
                    </span>
                    <span className="text-xs font-body text-white/50">
                      <span className="text-white font-semibold">{nAdmins}</span> admins
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/superadmin/gimnasios/${g.id}`}
                    className="text-xs font-semibold font-body text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                  >
                    Gestionar
                  </Link>
                  <form
                    action={async () => {
                      'use server'
                      await toggleGimnasioActivo(g.id, !g.activo)
                    }}
                  >
                    <button
                      type="submit"
                      className={`text-xs font-semibold font-body px-3 py-1.5 rounded-lg transition-colors ${
                        g.activo
                          ? 'text-red-400 hover:bg-red-900/20'
                          : 'text-green-400 hover:bg-green-900/20'
                      }`}
                    >
                      {g.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </form>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* IA Usage */}
      <div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h3 className="text-lg font-heading font-bold text-white">SimpleGym IA</h3>
            <p className="text-xs text-white/40 font-body mt-0.5">Uso del mes actual</p>
          </div>
          <div className="flex gap-6 text-right">
            <div>
              <p className="text-xs text-white/40 font-body">Consultas hoy</p>
              <p className="text-lg font-heading font-bold text-white">{totalConsultasHoy}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 font-body">Consultas mes</p>
              <p className="text-lg font-heading font-bold text-white">{totalConsultasMes}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 font-body">Costo mes</p>
              <p className="text-lg font-heading font-bold text-orange">USD {totalCostoMes.toFixed(4)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-xs text-white/40 font-semibold px-5 py-3">Gimnasio</th>
                <th className="text-right text-xs text-white/40 font-semibold px-4 py-3">Hoy</th>
                <th className="text-right text-xs text-white/40 font-semibold px-4 py-3">Este mes</th>
                <th className="text-right text-xs text-white/40 font-semibold px-4 py-3">Costo mes</th>
                <th className="text-right text-xs text-white/40 font-semibold px-5 py-3">Costo/consulta</th>
              </tr>
            </thead>
            <tbody>
              {(gimnasios ?? []).map((g, i) => {
                const ai = aiStatsFor(g.id)
                const isLast = i === (gimnasios?.length ?? 0) - 1
                return (
                  <tr key={g.id} className={!isLast ? 'border-b border-gray-800/60' : ''}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-white">{g.nombre}</p>
                      <p className="text-xs text-white/30">/{g.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${ai.consultasHoy > 0 ? 'text-white' : 'text-white/20'}`}>
                        {ai.consultasHoy}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${ai.consultasMes > 0 ? 'text-white' : 'text-white/20'}`}>
                        {ai.consultasMes}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ai.costoMes > 0
                        ? <span className="font-semibold text-orange">USD {ai.costoMes.toFixed(4)}</span>
                        : <span className="text-white/20">—</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-right">
                      {ai.costoPorPregunta !== null
                        ? <span className="text-white/60">USD {ai.costoPorPregunta.toFixed(4)}</span>
                        : <span className="text-white/20">—</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
