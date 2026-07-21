import { createAdminClient } from '@/lib/supabase/admin'

function hoyAR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

export async function getFacturacionMesActual(gimnasioId: string) {
  const supabase = createAdminClient()
  const hoy = hoyAR()
  const anio = parseInt(hoy.slice(0, 4))
  const mes = parseInt(hoy.slice(5, 7))
  const primerDiaMes = `${anio}-${String(mes).padStart(2, '0')}-01`

  const mesAnt = mes === 1 ? 12 : mes - 1
  const anioAnt = mes === 1 ? anio - 1 : anio
  const primerDiaMesAnt = `${anioAnt}-${String(mesAnt).padStart(2, '0')}-01`

  const [{ data: cobrosMes }, { data: cobrosAnt }] = await Promise.all([
    supabase.from('cobros')
      .select('monto, alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMes)
      .neq('estado', 'anulado'),
    supabase.from('cobros')
      .select('monto')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMesAnt)
      .lt('fecha', primerDiaMes)
      .neq('estado', 'anulado'),
  ])

  const totalMes = (cobrosMes ?? []).reduce((s, c) => s + c.monto, 0)
  const totalAnt = (cobrosAnt ?? []).reduce((s, c) => s + c.monto, 0)
  const renovaciones = new Set((cobrosMes ?? []).map(c => c.alumno_id)).size

  let comparacion: string | null = null
  if (totalAnt > 0) {
    const pct = Math.round(((totalMes - totalAnt) / totalAnt) * 100)
    comparacion = pct >= 0
      ? `+${pct}% respecto al mes anterior ($${totalAnt.toLocaleString('es-AR')})`
      : `${pct}% respecto al mes anterior ($${totalAnt.toLocaleString('es-AR')})`
  }

  return {
    totalMes,
    totalMesFormateado: `$${totalMes.toLocaleString('es-AR')}`,
    cantidadCobros: cobrosMes?.length ?? 0,
    renovaciones,
    comparacion,
    mesCorriente: `${String(mes).padStart(2, '0')}/${anio}`,
  }
}
