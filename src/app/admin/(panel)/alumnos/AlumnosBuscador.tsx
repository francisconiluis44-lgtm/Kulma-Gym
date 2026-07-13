'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type Alumno = {
  id: string
  nombre_completo: string
  dni: string
  fecha_alta: string
  fecha_vencimiento: string | null
  rutina_fecha_vencimiento: string | null
}

export default function AlumnosBuscador({ alumnos }: { alumnos: Alumno[] }) {
  const [query, setQuery] = useState('')

  const hoy = useMemo(
    () =>
      new Date(
        new Date().toLocaleDateString('en-CA', {
          timeZone: 'America/Argentina/Buenos_Aires',
        }) + 'T00:00:00'
      ),
    []
  )

  const filtrados = useMemo(() => {
    if (!query.trim()) return alumnos
    const q = query.toLowerCase()
    return alumnos.filter(
      (a) =>
        a.nombre_completo.toLowerCase().includes(q) || a.dni.includes(q)
    )
  }, [alumnos, query])

  function rutinaStatusDot(fecha: string | null) {
    if (!fecha) return { cn: 'bg-gray-300', title: 'Sin fecha de rutina' }
    const dias = Math.ceil(
      (new Date(fecha + 'T00:00:00').getTime() - hoy.getTime()) / 86400000
    )
    if (dias < 0) return { cn: 'bg-red-500', title: `Rutina vencida (${Math.abs(dias)}d)` }
    if (dias <= 7) return { cn: 'bg-orange', title: `Rutina vence en ${dias}d` }
    return { cn: 'bg-green-500', title: `Rutina ok (${dias}d)` }
  }

  function membresiaInfo(fecha: string | null) {
    if (!fecha) return null
    const dias = Math.ceil(
      (new Date(fecha + 'T00:00:00').getTime() - hoy.getTime()) / 86400000
    )
    if (dias < 0) return { text: 'Vencida', cn: 'bg-red-100 text-red-600' }
    if (dias === 0) return { text: 'Vence hoy', cn: 'bg-orange/20 text-orange' }
    if (dias <= 7) return { text: `${dias}d`, cn: 'bg-orange/20 text-orange' }
    return { text: `${dias}d`, cn: 'bg-green-100 text-green-700' }
  }

  return (
    <>
      <div className="mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o DNI..."
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors bg-white"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-navy/40 font-body text-sm">
              {query
                ? 'No hay alumnos que coincidan con la búsqueda.'
                : 'No hay alumnos registrados todavía.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">
                    Nombre
                  </th>
                  <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm hidden sm:table-cell">
                    DNI
                  </th>
                  <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">
                    Membresía
                  </th>
                  <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm hidden md:table-cell">
                    Alta
                  </th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrados.map((alumno) => {
                  const rutinaDot = rutinaStatusDot(alumno.rutina_fecha_vencimiento)
                  const memb = membresiaInfo(alumno.fecha_vencimiento)
                  return (
                    <tr key={alumno.id} className="hover:bg-cream/60 transition-colors">
                      <td className="px-5 py-4 font-body font-medium text-navy">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${rutinaDot.cn}`}
                            title={rutinaDot.title}
                          />
                          {alumno.nombre_completo}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-body text-navy/60 tabular-nums hidden sm:table-cell">
                        {alumno.dni}
                      </td>
                      <td className="px-5 py-4">
                        {memb ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-body ${memb.cn}`}
                          >
                            {memb.text}
                          </span>
                        ) : (
                          <span className="text-navy/30 font-body text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-body text-navy/50 text-xs tabular-nums hidden md:table-cell">
                        {new Date(alumno.fecha_alta).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/alumnos/${alumno.id}`}
                          className="text-xs font-semibold text-orange hover:underline font-body"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
