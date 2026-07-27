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

  const [{ data: cobrosMes }, { data: cobrosAnt }, { data: cobrosExtMes }, { data: cobrosExtAnt }] = await Promise.all([
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
    supabase.from('cobros_externos')
      .select('monto')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMes)
      .neq('estado', 'anulado'),
    supabase.from('cobros_externos')
      .select('monto')
      .eq('gimnasio_id', gimnasioId)
      .gte('fecha', primerDiaMesAnt)
      .lt('fecha', primerDiaMes)
      .neq('estado', 'anulado'),
  ])

  const totalMesReg = (cobrosMes ?? []).reduce((s, c) => s + c.monto, 0)
  const totalMesExt = (cobrosExtMes ?? []).reduce((s, c) => s + c.monto, 0)
  const totalMes = totalMesReg + totalMesExt

  const totalAntReg = (cobrosAnt ?? []).reduce((s, c) => s + c.monto, 0)
  const totalAntExt = (cobrosExtAnt ?? []).reduce((s, c) => s + c.monto, 0)
  const totalAnt = totalAntReg + totalAntExt

  const cantidadCobros = (cobrosMes?.length ?? 0) + (cobrosExtMes?.length ?? 0)
  const renovaciones = new Set((cobrosMes ?? []).map(c => c.alumno_id)).size
  const ticketPromedio = cantidadCobros > 0 ? Math.round(totalMes / cantidadCobros) : 0

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
    registrados: { total: totalMesReg, cantidad: cobrosMes?.length ?? 0 },
    externos: { total: totalMesExt, cantidad: cobrosExtMes?.length ?? 0 },
    cantidadCobros,
    renovaciones,
    ticketPromedio,
    ticketPromedioFormateado: `$${ticketPromedio.toLocaleString('es-AR')}`,
    comparacion,
    mesCorriente: `${String(mes).padStart(2, '0')}/${anio}`,
  }
}
