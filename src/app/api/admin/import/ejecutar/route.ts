import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'
import { ResultadoMatch, ResultadoMatchCobro } from '@/services/importar'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()
  const { data: gymAdmin } = await adminSupabase
    .from('gym_admins').select('gimnasio_id')
    .eq('user_id', user.id).eq('gimnasio_id', gym.id).single()
  if (!gymAdmin) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const gimnasioId = gymAdmin.gimnasio_id
  const body = await req.json()
  const tipo: string = body.tipo ?? 'asistencias'
  const aliasNuevos: Array<{ alias: string; alumnoExternoId: string }> = body.aliasNuevos ?? []

  let asistenciasImportadas = 0
  let cobrosImportados = 0
  let alumnosCreados = 0
  let aliasGuardados = 0
  let duplicadosOmitidos = 0

  // Guardar alias confirmados por el admin (aplica a ambos tipos)
  for (const { alias, alumnoExternoId } of aliasNuevos) {
    const { error } = await adminSupabase.from('alias_alumnos_externos').upsert(
      { gimnasio_id: gimnasioId, alumno_externo_id: alumnoExternoId, alias, origen: 'importacion' },
      { onConflict: 'gimnasio_id,alias', ignoreDuplicates: true }
    )
    if (!error) aliasGuardados++
  }

  // ─── Cobros ───────────────────────────────────────────────────────────────
  if (tipo === 'cobros') {
    const confirmados: ResultadoMatchCobro[] = body.confirmados ?? []
    const nuevos: ResultadoMatchCobro[] = body.nuevos ?? []

    for (const match of confirmados) {
      const monto = match.monto
      if (monto === null || monto === undefined) { duplicadosOmitidos++; continue }
      const fecha = match.fecha ?? new Date().toISOString().slice(0, 10)
      const metodo = match.metodo || 'efectivo'
      const notas = match.notas || null

      if (match.alumnoId) {
        const { error } = await adminSupabase.from('cobros').insert({
          alumno_id: match.alumnoId,
          gimnasio_id: gimnasioId,
          monto,
          fecha,
          metodo,
          notas,
        })
        if (error) duplicadosOmitidos++
        else cobrosImportados++
      } else if (match.alumnoExternoId) {
        const { error } = await adminSupabase.from('cobros_externos').insert({
          alumno_externo_id: match.alumnoExternoId,
          gimnasio_id: gimnasioId,
          monto,
          fecha,
          metodo,
          notas,
        })
        if (error) duplicadosOmitidos++
        else cobrosImportados++
      }
    }

    for (const nuevo of nuevos) {
      const monto = nuevo.monto
      if (monto === null || monto === undefined) { duplicadosOmitidos++; continue }
      const { data: ext, error: errCreate } = await adminSupabase
        .from('alumnos_externos')
        .insert({ gimnasio_id: gimnasioId, nombre_completo: nuevo.nombre })
        .select('id')
        .single()
      if (errCreate || !ext) continue
      alumnosCreados++
      const { error } = await adminSupabase.from('cobros_externos').insert({
        alumno_externo_id: ext.id,
        gimnasio_id: gimnasioId,
        monto,
        fecha: nuevo.fecha ?? new Date().toISOString().slice(0, 10),
        metodo: nuevo.metodo || 'efectivo',
        notas: nuevo.notas || null,
      })
      if (!error) cobrosImportados++
    }

    return NextResponse.json({ asistenciasImportadas, cobrosImportados, alumnosCreados, aliasGuardados, duplicadosOmitidos })
  }

  // ─── Asistencias ──────────────────────────────────────────────────────────
  const confirmados: ResultadoMatch[] = body.confirmados ?? []
  const nuevos: ResultadoMatch[] = body.nuevos ?? []

  for (const match of confirmados) {
    for (const fecha of match.fechas) {
      if (match.alumnoId) {
        const { error } = await adminSupabase.from('asistencias').upsert(
          { alumno_id: match.alumnoId, gimnasio_id: gimnasioId, fecha, tipo: 'admin' },
          { onConflict: 'alumno_id,fecha', ignoreDuplicates: true }
        )
        if (error) duplicadosOmitidos++
        else asistenciasImportadas++
      } else if (match.alumnoExternoId) {
        const { error } = await adminSupabase.from('asistencias_externas').upsert(
          { alumno_externo_id: match.alumnoExternoId, gimnasio_id: gimnasioId, fecha },
          { onConflict: 'alumno_externo_id,fecha', ignoreDuplicates: true }
        )
        if (error) duplicadosOmitidos++
        else asistenciasImportadas++
      }
    }
  }

  for (const nuevo of nuevos) {
    const { data: ext, error: errCreate } = await adminSupabase
      .from('alumnos_externos')
      .insert({ gimnasio_id: gimnasioId, nombre_completo: nuevo.nombre })
      .select('id')
      .single()
    if (errCreate || !ext) continue
    alumnosCreados++
    for (const fecha of nuevo.fechas) {
      const { error } = await adminSupabase.from('asistencias_externas').upsert(
        { alumno_externo_id: ext.id, gimnasio_id: gimnasioId, fecha },
        { onConflict: 'alumno_externo_id,fecha', ignoreDuplicates: true }
      )
      if (!error) asistenciasImportadas++
    }
  }

  return NextResponse.json({ asistenciasImportadas, cobrosImportados, alumnosCreados, aliasGuardados, duplicadosOmitidos })
}
