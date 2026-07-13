import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

type AsistenciaInsert = Database['public']['Tables']['asistencias']['Insert']
type CobroInsert = Database['public']['Tables']['cobros']['Insert']

export const maxDuration = 60

// Deterministic pseudo-random (same data every run)
function rng(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}

const NOMBRES_F = ['Valentina','Camila','Luciana','Florencia','Sofia','Martina','Agustina','Natalia','Carolina','Paola','Laura','Maria','Gabriela','Romina','Vanesa','Melina','Antonella','Brenda','Cecilia','Diana']
const NOMBRES_M = ['Lucas','Matias','Santiago','Agustin','Franco','Ignacio','Rodrigo','Facundo','Nicolas','Diego','Carlos','Pablo','Martin','Maximiliano','Gonzalo','Esteban','Ramon','Tomas','Ezequiel','Leandro']
const APELLIDOS = ['Garcia','Rodriguez','Martinez','Gonzalez','Lopez','Sanchez','Perez','Torres','Flores','Diaz','Romero','Moreno','Alvarez','Ruiz','Ortiz','Castillo','Medina','Castro','Herrera','Silva']

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (body.key !== 'seed-fantasmin-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: gym } = await supabase.from('gimnasios').select('id').eq('slug', 'fantasmin').single()
  if (!gym) return NextResponse.json({ error: 'Gym not found' }, { status: 404 })
  const gymId = gym.id

  // Build 100 student profiles
  const profiles = Array.from({ length: 100 }, (_, i) => {
    const n = i + 1
    const esMujer = rng(n * 7) > 0.45
    const nombre = esMujer
      ? NOMBRES_F[Math.floor(rng(n * 3) * NOMBRES_F.length)]
      : NOMBRES_M[Math.floor(rng(n * 3) * NOMBRES_M.length)]
    const apellido = APELLIDOS[Math.floor(rng(n * 5) * APELLIDOS.length)]
    return {
      n,
      nombre_completo: `${nombre} ${apellido}`,
      email: `alumno${n}@fantasmin.simplegym.fit`,
      dni: `${10000000 + n}`,
      whatsapp: `11${40000000 + n}`,
    }
  })

  // Create users in batches of 10
  const userMap: { id: string; n: number }[] = []
  for (let b = 0; b < 100; b += 10) {
    const batch = profiles.slice(b, b + 10)
    const results = await Promise.allSettled(
      batch.map((p) =>
        supabase.auth.admin.createUser({
          email: p.email,
          password: 'Kulma2026!',
          email_confirm: true,
          user_metadata: {
            nombre_completo: p.nombre_completo,
            dni: p.dni,
            whatsapp: p.whatsapp,
            gimnasio_id: gymId,
          },
        })
      )
    )
    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value.data?.user) {
        userMap.push({ id: r.value.data.user.id, n: batch[i].n })
      }
    })
  }

  if (userMap.length === 0) {
    return NextResponse.json({ error: 'No users created (already exist?)' }, { status: 500 })
  }

  // Update fecha_vencimiento and fecha_alta on alumnos
  const HOY = '2026-07-13'
  await Promise.all(
    userMap.map(({ id, n }) => {
      // fecha_alta: spread over last 12 months
      const diasAtras = Math.floor(rng(n * 13) * 365)
      const fechaAlta = addDays(HOY, -diasAtras) + 'T00:00:00Z'

      let fechaVenc: string | null = null
      if (n <= 30) {
        fechaVenc = addDays(HOY, 1 + Math.floor(rng(n * 11) * 45))   // vigente
      } else if (n <= 50) {
        fechaVenc = addDays(HOY, 1 + Math.floor(rng(n * 11) * 7))    // por vencer
      } else if (n <= 70) {
        fechaVenc = addDays(HOY, -(1 + Math.floor(rng(n * 11) * 30))) // vencida reciente
      } else if (n <= 85) {
        fechaVenc = addDays(HOY, -(31 + Math.floor(rng(n * 11) * 60)))// vencida vieja
      }
      // 86-100: sin membresía (null)

      return supabase.from('alumnos').update({ fecha_vencimiento: fechaVenc ?? null, fecha_alta: fechaAlta }).eq('id', id)
    })
  )

  // Generate asistencias (April 1 – July 13 2026)
  // Groups: 1=regular(75%) 2=moderado(45%) 3=esporádico(20%) 4=inactivo desde Jun(0%) 5=abandonó en Abr(0% from May)
  const asistencias: AsistenciaInsert[] = []

  for (const { id, n } of userMap) {
    const grupo = ((n - 1) % 5) + 1

    function tasa(fecha: string): number {
      const esFinde = new Date(fecha + 'T12:00:00Z').getUTCDay() === 0 || new Date(fecha + 'T12:00:00Z').getUTCDay() === 6
      if (grupo === 1) return esFinde ? 0.2 : 0.75
      if (grupo === 2) return esFinde ? 0.1 : 0.45
      if (grupo === 3) return 0.20
      if (grupo === 4) return fecha <= '2026-05-31' ? 0.55 : 0
      if (grupo === 5) return fecha <= '2026-04-30' ? 0.40 : 0
      return 0
    }

    let current = '2026-04-01'
    let dayIdx = 0
    while (current <= HOY) {
      const seed = n * 10000 + dayIdx
      if (rng(seed) < tasa(current)) {
        const hour = 6 + Math.floor(rng(seed + 1) * 16)   // 6am–10pm
        const min = Math.floor(rng(seed + 2) * 60)
        asistencias.push({
          alumno_id: id,
          gimnasio_id: gymId,
          fecha: current,
          checked_in_at: `${current}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00-03:00`,
          tipo: 'alumno',
        })
      }
      dayIdx++
      current = addDays(current, 1)
    }
  }

  // Insert asistencias in chunks of 500
  for (let i = 0; i < asistencias.length; i += 500) {
    await supabase.from('asistencias').insert(asistencias.slice(i, i + 500))
  }

  // Generate cobros (April, May, June 2026)
  // 1–60: paid 3 months | 61–75: 2 months | 76–85: 1 month | 86–100: nothing
  const MESES = ['2026-04', '2026-05', '2026-06']
  const METODOS = ['efectivo', 'efectivo', 'efectivo', 'transferencia', 'transferencia', 'tarjeta']
  const cobros: CobroInsert[] = []

  for (const { id, n } of userMap) {
    const mesesPagados = n <= 60 ? 3 : n <= 75 ? 2 : n <= 85 ? 1 : 0
    for (let m = 0; m < mesesPagados; m++) {
      const dia = 1 + Math.floor(rng(n * 100 + m) * 15)
      const monto = 15000 + Math.round(rng(n * 200 + m) * 15000 / 100) * 100
      const metodo = METODOS[Math.floor(rng(n * 300 + m) * METODOS.length)]
      cobros.push({
        alumno_id: id,
        gimnasio_id: gymId,
        monto,
        fecha: `${MESES[m]}-${String(dia).padStart(2, '0')}`,
        metodo,
      })
    }
  }

  for (let i = 0; i < cobros.length; i += 500) {
    await supabase.from('cobros').insert(cobros.slice(i, i + 500))
  }

  return NextResponse.json({
    ok: true,
    usuarios_creados: userMap.length,
    asistencias: asistencias.length,
    cobros: cobros.length,
  })
}
