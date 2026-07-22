import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSuperadminSession } from '@/lib/superadmin-auth'
import { toggleGimnasioActivo } from './actions'

export default async function SuperadminPage() {
  await getSuperadminSession()
  const adminSupabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = adminSupabase as any

  const primerDiaMes = new Date().toISOString().slice(0, 7) + '-01'

  const [{ data: gimnasios }, { data: alumnos }, { data: gymAdmins }, { data: aiUsage }] = await Promise.all([
    adminSupabase.from('gimnasios').select('*').order('created_at', { ascending: true }),
    adminSupabase.from('alumnos').select('id, gimnasio_id'),
    adminSupabase.from('gym_admins').select('gimnasio_id'),
    adminAny.from('ai_usage').select('gimnasio_id, input_tokens, output_tokens, estimated_cost').gte('created_at', primerDiaMes),
  ])

  function countFor(gimnasioId: string, list: { gimnasio_id: string | null }[]) {
    return list.filter((r) => r.gimnasio_id === gimnasioId).length
  }

  type AiRow = { gimnasio_id: string; input_tokens: number; output_tokens: number; estimated_cost: number }
  function aiStatsFor(gimnasioId: string) {
    const rows = (aiUsage ?? []).filter((r: AiRow) => r.gimnasio_id === gimnasioId)
    const consultas = rows.length
    const costo = rows.reduce((sum: number, r: AiRow) => sum + Number(r.estimated_cost), 0)
    const tokens = rows.reduce((sum: number, r: AiRow) => sum + r.input_tokens + r.output_tokens, 0)
    return { consultas, costo, tokens }
  }

  const totalCostoMes = (aiUsage ?? []).reduce((sum: number, r: AiRow) => sum + Number(r.estimated_cost), 0)
  const totalConsultasMes = (aiUsage ?? []).length

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

      <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 mb-6 flex gap-6">
        <div>
          <p className="text-xs text-white/40 font-body mb-0.5">IA — consultas este mes</p>
          <p className="text-xl font-heading font-bold text-white">{totalConsultasMes}</p>
        </div>
        <div className="w-px bg-gray-800" />
        <div>
          <p className="text-xs text-white/40 font-body mb-0.5">Costo total este mes</p>
          <p className="text-xl font-heading font-bold text-orange">USD {totalCostoMes.toFixed(4)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {!gimnasios || gimnasios.length === 0 ? (
          <p className="text-white/30 font-body text-sm text-center py-16">No hay gimnasios todavía.</p>
        ) : (
          gimnasios.map((g) => {
            const nAlumnos = countFor(g.id, alumnos ?? [])
            const nAdmins = countFor(g.id, gymAdmins ?? [])
            const ai = aiStatsFor(g.id)
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
                  <div className="flex gap-4 mt-2 flex-wrap">
                    <span className="text-xs font-body text-white/50">
                      <span className="text-white font-semibold">{nAlumnos}</span> alumnos
                    </span>
                    <span className="text-xs font-body text-white/50">
                      <span className="text-white font-semibold">{nAdmins}</span> admins
                    </span>
                    <span className="text-xs font-body text-white/50">
                      IA: <span className="text-white font-semibold">{ai.consultas}</span> consultas
                      {ai.consultas > 0 && (
                        <span className="text-orange font-semibold"> · USD {ai.costo.toFixed(4)}</span>
                      )}
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
    </>
  )
}
