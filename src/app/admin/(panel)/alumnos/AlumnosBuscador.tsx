'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { agregarAlumnoExterno, desarchivarAlumno, archivarAlumnoExterno, desarchivarAlumnoExterno } from './actions'

type Alumno = {
  id: string
  nombre_completo: string
  dni: string
  fecha_alta: string
  fecha_vencimiento: string | null
  rutina_fecha_vencimiento: string | null
}

type AlumnoExterno = {
  id: string
  nombre_completo: string
  fecha_vencimiento: string | null
}

type Tab = 'registrados' | 'externos' | 'archivados'

function ArchivarExternoBtn({ externoId }: { externoId: string }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  function handleConfirm() {
    startTransition(async () => {
      await archivarAlumnoExterno(externoId)
      setConfirmOpen(false)
    })
  }
  if (confirmOpen) {
    return (
      <span className="inline-flex items-center gap-2">
        <button onClick={handleConfirm} disabled={isPending} className="text-xs font-semibold text-navy font-body disabled:opacity-50">
          {isPending ? 'Archivando...' : 'Confirmar'}
        </button>
        <button onClick={() => setConfirmOpen(false)} className="text-xs font-body text-navy/40 hover:text-navy">Cancelar</button>
      </span>
    )
  }
  return (
    <button type="button" onClick={() => setConfirmOpen(true)} className="text-xs font-semibold text-navy/50 hover:text-navy font-body transition-colors">
      Archivar
    </button>
  )
}

function DesarchivarExternoBtn({ externoId }: { externoId: string }) {
  const [isPending, startTransition] = useTransition()
  function handleClick() {
    startTransition(async () => { await desarchivarAlumnoExterno(externoId) })
  }
  return (
    <button type="button" onClick={handleClick} disabled={isPending} className="text-xs font-semibold text-navy/50 hover:text-navy font-body disabled:opacity-50 transition-colors">
      {isPending ? 'Desarchivando...' : 'Desarchivar'}
    </button>
  )
}

function DesarchivarBtn({ alumnoId }: { alumnoId: string }) {
  const [isPending, startTransition] = useTransition()
  function handleClick() {
    startTransition(async () => {
      await desarchivarAlumno(alumnoId)
    })
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-semibold text-navy/50 hover:text-navy font-body disabled:opacity-50 transition-colors"
    >
      {isPending ? 'Desarchivando...' : 'Desarchivar'}
    </button>
  )
}

export default function AlumnosBuscador({ alumnos, externos, archivados, archivadosExternos }: { alumnos: Alumno[]; externos: AlumnoExterno[]; archivados: Alumno[]; archivadosExternos: AlumnoExterno[] }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('registrados')
  const [modalOpen, setModalOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState('')
  const [isPending, startTransition] = useTransition()

  function openModal() {
    setNombre(''); setWhatsapp(''); setEmail(''); setFormError('')
    setModalOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) { setFormError('El nombre es obligatorio.'); return }
    setFormError('')
    startTransition(async () => {
      const res = await agregarAlumnoExterno({ nombre_completo: nombre, whatsapp, email })
      if ('error' in res) { setFormError(res.error); return }
      setModalOpen(false)
      setTab('externos')
    })
  }

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
    if (tab === 'externos') {
      if (!query.trim()) return externos
      const q = query.toLowerCase()
      return externos.filter(e => e.nombre_completo.toLowerCase().includes(q))
    }
    if (tab === 'archivados') {
      if (!query.trim()) return archivados
      const q = query.toLowerCase()
      return archivados.filter(a => a.nombre_completo.toLowerCase().includes(q) || a.dni.includes(q))
    }
    if (!query.trim()) return alumnos
    const q = query.toLowerCase()
    return alumnos.filter(
      (a) => a.nombre_completo.toLowerCase().includes(q) || a.dni.includes(q)
    )
  }, [alumnos, externos, archivados, query, tab])

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

  const filtradosRegistrados = tab === 'registrados' ? filtrados as Alumno[] : []
  const filtradosExternos = tab === 'externos' ? filtrados as AlumnoExterno[] : []
  const filtradosArchivados = tab === 'archivados' ? filtrados as Alumno[] : []

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['registrados', 'externos', 'archivados'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setQuery('') }}
            className={`px-4 py-2 rounded-xl text-sm font-heading font-bold transition-colors
              ${tab === t ? 'bg-orange text-white shadow-sm' : 'bg-white text-navy/50 hover:text-navy border border-navy/10'}`}
          >
            {t === 'registrados' ? `Con cuenta (${alumnos.length})` : t === 'externos' ? `Sin cuenta (${externos.length})` : `Archivados (${archivados.length})`}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === 'externos' ? 'Buscar por nombre...' : 'Buscar por nombre o DNI...'}
          className="w-full max-w-sm px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors bg-white"
        />
        <button
          onClick={openModal}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-orange text-white text-sm font-heading font-bold hover:bg-orange/90 transition-colors shadow-sm"
        >
          + Agregar alumno
        </button>
      </div>

      {/* Modal agregar alumno */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-heading font-bold text-navy mb-1">Agregar alumno</h3>
            <p className="text-xs font-body text-navy/40 mb-5">Se agrega como alumno sin cuenta. Podés vincularlo a la app después.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold font-body text-navy/60 mb-1">Nombre <span className="text-orange">*</span></label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: Florencia Gómez"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-navy/60 mb-1">WhatsApp <span className="text-navy/30">(opcional)</span></label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  placeholder="Ej: 2901123456"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold font-body text-navy/60 mb-1">Email <span className="text-navy/30">(opcional)</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ej: alumno@mail.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange text-navy font-body placeholder:text-gray-300 transition-colors"
                />
              </div>
              {formError && <p className="text-sm font-body text-red-500">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-orange text-white font-heading font-bold text-sm hover:bg-orange/90 transition-colors disabled:opacity-60"
                >
                  {isPending ? 'Guardando...' : 'Agregar'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-navy/60 font-heading font-bold text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {tab === 'registrados' && (
          filtradosRegistrados.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-2">
              <p className="text-2xl leading-none">{query ? '🔍' : '👥'}</p>
              <p className="text-navy/50 font-body text-sm">
                {query ? 'No hay alumnos que coincidan.' : 'No hay alumnos registrados todavía.'}
              </p>
              {!query && (
                <p className="text-navy/30 font-body text-xs">
                  Agregá el primer alumno desde Importar o por registro directo.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy text-white">
                    <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">Nombre</th>
                    <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm hidden sm:table-cell">DNI</th>
                    <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">Membresía</th>
                    <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm hidden md:table-cell">Alta</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtradosRegistrados.map((alumno) => {
                    const rutinaDot = rutinaStatusDot(alumno.rutina_fecha_vencimiento)
                    const memb = membresiaInfo(alumno.fecha_vencimiento)
                    return (
                      <tr key={alumno.id} className="hover:bg-cream/60 transition-colors">
                        <td className="px-5 py-4 font-body font-medium text-navy">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${rutinaDot.cn}`} title={rutinaDot.title} />
                            {alumno.nombre_completo}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-body text-navy/60 tabular-nums hidden sm:table-cell">{alumno.dni}</td>
                        <td className="px-5 py-4">
                          {memb ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-body ${memb.cn}`}>
                              {memb.text}
                            </span>
                          ) : (
                            <span className="text-navy/30 font-body text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-body text-navy/50 text-xs tabular-nums hidden md:table-cell">
                          {new Date(alumno.fecha_alta).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link href={`/admin/alumnos/${alumno.id}`} className="text-xs font-semibold text-orange hover:underline font-body">
                            Editar
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'externos' && (
          <>
            {filtradosExternos.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center gap-2">
                <p className="text-navy/50 font-body text-sm">
                  {query ? 'Sin resultados.' : 'No hay alumnos sin cuenta todavía.'}
                </p>
                {!query && (
                  <p className="text-navy/30 font-body text-xs">Usá el botón "Agregar alumno" para agregar uno.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy text-white">
                      <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">Nombre</th>
                      <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">Membresía</th>
                      <th className="px-5 py-3.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtradosExternos.map((ext) => {
                      const memb = membresiaInfo(ext.fecha_vencimiento)
                      return (
                        <tr key={ext.id} className="hover:bg-cream/60 transition-colors">
                          <td className="px-5 py-4 font-body font-medium text-navy">{ext.nombre_completo}</td>
                          <td className="px-5 py-4">
                            {memb ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-body ${memb.cn}`}>
                                {memb.text}
                              </span>
                            ) : (
                              <span className="text-navy/30 font-body text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center gap-3 justify-end">
                              <ArchivarExternoBtn externoId={ext.id} />
                              <Link href={`/admin/alumnos_externos/${ext.id}`} className="text-xs font-semibold text-orange hover:underline font-body">
                                Ver
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!query && archivadosExternos.length > 0 && (
              <div className="border-t border-gray-100">
                <p className="px-5 py-3 text-xs font-semibold font-body text-navy/30 uppercase tracking-widest">
                  Archivados sin cuenta ({archivadosExternos.length})
                </p>
                <table className="w-full text-sm opacity-60">
                  <tbody className="divide-y divide-gray-100">
                    {archivadosExternos.map((ext) => (
                      <tr key={ext.id} className="hover:bg-cream/60 transition-colors">
                        <td className="px-5 py-3 font-body font-medium text-navy">{ext.nombre_completo}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center gap-3 justify-end">
                            <DesarchivarExternoBtn externoId={ext.id} />
                            <Link href={`/admin/alumnos_externos/${ext.id}`} className="text-xs font-semibold text-orange hover:underline font-body">
                              Ver
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'archivados' && (
          filtradosArchivados.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-2">
              <p className="text-navy/50 font-body text-sm">
                {query ? 'Sin resultados.' : 'No hay alumnos archivados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy text-white">
                    <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">Nombre</th>
                    <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm hidden sm:table-cell">DNI</th>
                    <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">Membresía</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtradosArchivados.map((alumno) => {
                    const memb = membresiaInfo(alumno.fecha_vencimiento)
                    return (
                      <tr key={alumno.id} className="hover:bg-cream/60 transition-colors opacity-70">
                        <td className="px-5 py-4 font-body font-medium text-navy">{alumno.nombre_completo}</td>
                        <td className="px-5 py-4 font-body text-navy/60 tabular-nums hidden sm:table-cell">{alumno.dni}</td>
                        <td className="px-5 py-4">
                          {memb ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-body ${memb.cn}`}>
                              {memb.text}
                            </span>
                          ) : (
                            <span className="text-navy/30 font-body text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right flex items-center gap-3 justify-end">
                          <DesarchivarBtn alumnoId={alumno.id} />
                          <Link href={`/admin/alumnos/${alumno.id}`} className="text-xs font-semibold text-orange hover:underline font-body">
                            Editar
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </>
  )
}
