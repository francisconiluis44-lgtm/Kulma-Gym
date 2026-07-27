import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGymContext } from '@/lib/gym-context'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const gym = await getGymContext()
  const adminSupabase = createAdminClient()

  const { data: gymAdmin } = await adminSupabase
    .from('gym_admins')
    .select('gimnasio_id')
    .eq('user_id', user.id)
    .eq('gimnasio_id', gym.id)
    .single()
  if (!gymAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const fecha = req.nextUrl.searchParams.get('fecha')
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 })
  }

  const gimnasioId = gymAdmin.gimnasio_id

  const [{ data: asistencias }, { data: alumnos }] = await Promise.all([
    adminSupabase
      .from('asistencias')
      .select('checked_in_at, tipo, alumno_id')
      .eq('gimnasio_id', gimnasioId)
      .eq('fecha', fecha)
      .order('checked_in_at'),
    adminSupabase
      .from('alumnos')
      .select('id, nombre_completo')
      .eq('gimnasio_id', gimnasioId),
  ])

  const alumnoMap = new Map((alumnos ?? []).map(a => [a.id, a.nombre_completo]))

  const [yyyy, mm, dd] = fecha.split('-')
  const fechaLabel = `${dd}/${mm}/${yyyy}`

  const csvEscape = (s: string) => `"${s.replace(/"/g, '""')}"`

  const rows = [
    [`Asistencias del ${fechaLabel}`, '', ''],
    ['Nombre', 'Hora', 'Tipo'],
    ...(asistencias ?? []).map(a => {
      const nombre = alumnoMap.get(a.alumno_id) ?? 'Desconocido'
      const hora = new Date(a.checked_in_at).toLocaleTimeString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit', minute: '2-digit', hour12: false,
      })
      return [nombre, hora, a.tipo === 'admin' ? 'Manual' : 'Alumno']
    }),
  ]

  const csv = rows.map(r => r.map(c => csvEscape(String(c))).join(',')).join('\n')

  return new NextResponse('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="asistencia-${fecha}.csv"`,
    },
  })
}
