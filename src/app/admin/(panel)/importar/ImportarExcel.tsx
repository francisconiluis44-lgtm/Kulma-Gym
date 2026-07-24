'use client'

import { useState, useRef } from 'react'
import type { ResultadoMatch, ResultadoMatchCobro, ExcelParseado, MappingImport, PersonaCatalogo, TipoImport } from '@/services/importar'

type Step = 'tipo' | 'subida' | 'mapeando' | 'revision' | 'importando' | 'listo'

type DecisionManual = { tipo: 'manual'; alumnoId?: string; alumnoExternoId?: string; nombre: string }
type Decision = 'aceptar' | 'nuevo' | DecisionManual

interface Resumen {
  asistenciasImportadas: number
  cobrosImportados: number
  alumnosCreados: number
  aliasGuardados: number
  duplicadosOmitidos: number
}

export default function ImportarExcel({ tipoInicial }: { tipoInicial?: TipoImport }) {
  const [tipo, setTipo] = useState<TipoImport | null>(tipoInicial ?? null)
  const [step, setStep] = useState<Step>(tipoInicial ? 'subida' : 'tipo')

  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [parsed, setParsed] = useState<ExcelParseado | null>(null)

  const [matches, setMatches] = useState<ResultadoMatch[]>([])
  const [matchesCobros, setMatchesCobros] = useState<ResultadoMatchCobro[]>([])
  const [catalogo, setCatalogo] = useState<PersonaCatalogo[]>([])
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})

  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Mapping
  const [hoja, setHoja] = useState('')
  const [formato, setFormato] = useState<'filas' | 'matriz'>('filas')
  const [columnaNombre, setColumnaNombre] = useState('')
  const [columnaFecha, setColumnaFecha] = useState('')
  const [columnaMonto, setColumnaMonto] = useState('')
  const [columnaMetodo, setColumnaMetodo] = useState('')
  const [columnaNotas, setColumnaNotas] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  function setDecision(key: string, d: Decision) {
    setDecisions(prev => ({ ...prev, [key]: d }))
  }

  // ─── Parsear ────────────────────────────────────────────────────────────────

  async function parsear() {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/import/parsear', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al leer el archivo')
      setParsed(data)
      const primera = data.hojas[0] ?? ''
      setHoja(primera)
      const cols = data.columnas[primera] ?? []
      setColumnaNombre(cols[0] ?? '')
      setColumnaFecha(cols[1] ?? '')
      setColumnaMonto(cols[2] ?? '')
      setStep('mapeando')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally { setLoading(false) }
  }

  // ─── Analizar ───────────────────────────────────────────────────────────────

  async function analizar() {
    if (!file || !hoja || !columnaNombre || !tipo) return
    setLoading(true); setError(null)
    try {
      const mapping: MappingImport = {
        tipo,
        formato,
        hoja,
        columnaNombre,
        ...(tipo === 'asistencias' && formato === 'filas' && columnaFecha ? { columnaFecha } : {}),
        ...(tipo === 'cobros' ? {
          columnaFecha: columnaFecha || undefined,
          columnaMonto: columnaMonto || undefined,
          columnaMetodo: columnaMetodo || undefined,
          columnaNotas: columnaNotas || undefined,
        } : {}),
      }
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mapping', JSON.stringify(mapping))
      const res = await fetch('/api/admin/import/analizar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al analizar el archivo')

      setCatalogo(data.catalogo ?? [])
      const init: Record<string, Decision> = {}

      if (tipo === 'cobros') {
        setMatchesCobros(data.matches)
        for (const m of data.matches) {
          if (m.tipo === 'sugerido') init[m.nombreNormalizado] = 'aceptar'
          if (m.tipo === 'nuevo') init[m.nombreNormalizado] = 'nuevo'
        }
      } else {
        setMatches(data.matches)
        for (const m of data.matches) {
          if (m.tipo === 'sugerido') init[m.nombreNormalizado] = 'aceptar'
          if (m.tipo === 'nuevo') init[m.nombreNormalizado] = 'nuevo'
        }
      }
      setDecisions(init)
      setStep('revision')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally { setLoading(false) }
  }

  // ─── Ejecutar ───────────────────────────────────────────────────────────────

  async function ejecutar() {
    if (!tipo) return
    setStep('importando'); setError(null)
    try {
      const aliasNuevos: { alias: string; alumnoExternoId: string }[] = []

      const buildConfirmadosNuevos = <T extends { nombreNormalizado: string; tipo: string; alumnoExternoId?: string; nombre: string }>(
        all: T[]
      ) => {
        const confirmados: T[] = []
        const nuevos: T[] = []

        for (const m of all) {
          if (m.tipo === 'confirmado') { confirmados.push(m); continue }
          const d = decisions[m.nombreNormalizado]

          if (typeof d === 'object' && d.tipo === 'manual') {
            const patched = { ...m, alumnoId: d.alumnoId, alumnoExternoId: d.alumnoExternoId }
            confirmados.push(patched as T)
            if (d.alumnoExternoId) aliasNuevos.push({ alias: m.nombre, alumnoExternoId: d.alumnoExternoId })
          } else if (d === 'aceptar' && m.tipo === 'sugerido') {
            confirmados.push(m)
            if (m.alumnoExternoId) aliasNuevos.push({ alias: m.nombre, alumnoExternoId: m.alumnoExternoId })
          } else {
            nuevos.push(m)
          }
        }
        return { confirmados, nuevos }
      }

      const payload =
        tipo === 'cobros'
          ? { tipo, ...buildConfirmadosNuevos(matchesCobros), aliasNuevos }
          : { tipo, ...buildConfirmadosNuevos(matches), aliasNuevos }

      const res = await fetch('/api/admin/import/ejecutar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al importar')
      setResumen(data)
      setStep('listo')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
      setStep('revision')
    }
  }

  // ─── Reset ──────────────────────────────────────────────────────────────────

  function reset() {
    setTipo(tipoInicial ?? null)
    setStep(tipoInicial ? 'subida' : 'tipo')
    setFile(null); setParsed(null)
    setMatches([]); setMatchesCobros([])
    setCatalogo([]); setDecisions({})
    setResumen(null); setError(null)
    setHoja(''); setFormato('filas')
    setColumnaNombre(''); setColumnaFecha('')
    setColumnaMonto(''); setColumnaMetodo(''); setColumnaNotas('')
  }

  // ─── Datos derivados ────────────────────────────────────────────────────────

  const currentMatches = tipo === 'cobros' ? matchesCobros : matches
  const confirmados = currentMatches.filter(m => m.tipo === 'confirmado')
  const sugeridos = currentMatches.filter(m => m.tipo === 'sugerido')
  const nuevosBase = currentMatches.filter(m => m.tipo === 'nuevo')

  // Uniquify sugeridos/nuevos by nombreNormalizado for decision UI
  const sugeridosUniq = sugeridos.filter((m, i, arr) => arr.findIndex(x => x.nombreNormalizado === m.nombreNormalizado) === i)
  const nuevosUniq = nuevosBase.filter((m, i, arr) => arr.findIndex(x => x.nombreNormalizado === m.nombreNormalizado) === i)

  // Count effective nuevos (after decisions)
  const nuevosCount = currentMatches.filter(m => {
    const d = decisions[m.nombreNormalizado]
    return d === 'nuevo' || (m.tipo === 'nuevo' && typeof d !== 'object')
  }).length

  const cols = parsed?.columnas[hoja] ?? []

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-navy">Centro de Importación</h2>
        <p className="text-sm text-navy/50 font-body mt-1">
          Importá asistencias, cobros y más desde un Excel.
        </p>
      </div>

      <StepBar step={step} tipoFijo={!!tipoInicial} />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-body">
          {error}
        </div>
      )}

      {/* ── Paso 0: Elegir tipo ── */}
      {step === 'tipo' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'asistencias' as const, label: 'Asistencias', desc: 'Registrar presencias desde planillas', icon: '📋' },
            { id: 'cobros' as const, label: 'Cobros', desc: 'Importar pagos y membresías', icon: '💰' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => { setTipo(opt.id); setStep('subida') }}
              className="bg-white rounded-2xl shadow-sm p-6 text-left border-2 border-transparent hover:border-orange transition-colors group"
            >
              <p className="text-3xl mb-3">{opt.icon}</p>
              <p className="font-heading font-extrabold text-navy text-base group-hover:text-orange transition-colors">{opt.label}</p>
              <p className="text-sm font-body text-navy/50 mt-1">{opt.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Paso 1: Subida ── */}
      {step === 'subida' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
              ${dragging ? 'border-orange bg-orange/5' : 'border-navy/20 hover:border-orange/50'}`}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
            <p className="text-3xl mb-3">📊</p>
            {file ? (
              <div>
                <p className="font-heading font-bold text-navy">{file.name}</p>
                <p className="text-sm text-navy/50 font-body mt-1">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div>
                <p className="font-heading font-bold text-navy">Arrastrá tu archivo acá</p>
                <p className="text-sm text-navy/50 font-body mt-1">o hacé click para seleccionarlo</p>
                <p className="text-xs text-navy/30 font-body mt-2">.xlsx · .xls · .csv</p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {!tipoInicial && (
              <button onClick={() => setStep('tipo')}
                className="px-5 py-3 rounded-xl border border-navy/20 text-navy font-heading font-bold text-sm hover:bg-navy/5 transition-colors">
                ← Atrás
              </button>
            )}
            <button onClick={parsear} disabled={!file || loading}
              className="flex-1 py-3 rounded-xl bg-orange text-white font-heading font-bold text-sm disabled:opacity-40 transition-opacity">
              {loading ? 'Leyendo…' : 'Continuar →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 2: Mapeo ── */}
      {step === 'mapeando' && parsed && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          {parsed.hojas.length > 1 && (
            <div>
              <label className="block text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-2">Hoja</label>
              <div className="flex gap-2 flex-wrap">
                {parsed.hojas.map(h => (
                  <button key={h} onClick={() => {
                    setHoja(h)
                    const c = parsed.columnas[h] ?? []
                    setColumnaNombre(c[0] ?? ''); setColumnaFecha(c[1] ?? ''); setColumnaMonto(c[2] ?? '')
                  }}
                    className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-colors
                      ${hoja === h ? 'bg-orange text-white' : 'bg-navy/5 text-navy/70 hover:bg-navy/10'}`}>
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tipo === 'asistencias' && (
            <div>
              <label className="block text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-2">Formato</label>
              <div className="grid grid-cols-2 gap-3">
                {(['filas', 'matriz'] as const).map(f => (
                  <button key={f} onClick={() => setFormato(f)}
                    className={`p-3 rounded-xl border text-left transition-colors
                      ${formato === f ? 'border-orange bg-orange/5' : 'border-navy/15 hover:border-navy/30'}`}>
                    <p className={`text-sm font-heading font-bold ${formato === f ? 'text-orange' : 'text-navy'}`}>
                      {f === 'filas' ? 'Por filas' : 'Matriz'}
                    </p>
                    <p className="text-xs font-body text-navy/50 mt-0.5">
                      {f === 'filas' ? 'Una fila por asistencia' : 'Fechas como columnas'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <ColSelect label="Columna de nombre" value={columnaNombre} onChange={setColumnaNombre} options={cols} />
            <ColSelect label="Columna de fecha" value={columnaFecha} onChange={setColumnaFecha} options={cols}
              optional={tipo === 'asistencias' && formato === 'matriz'} />
            {tipo === 'cobros' && (
              <>
                <ColSelect label="Columna de monto" value={columnaMonto} onChange={setColumnaMonto} options={cols} />
                <ColSelect label="Método de pago" value={columnaMetodo} onChange={setColumnaMetodo} options={cols} optional />
                <ColSelect label="Notas" value={columnaNotas} onChange={setColumnaNotas} options={cols} optional />
              </>
            )}
          </div>

          {parsed.preview[hoja]?.length > 0 && (
            <div>
              <p className="text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-2">Vista previa</p>
              <div className="overflow-x-auto rounded-xl border border-navy/10">
                <table className="w-full text-xs font-body">
                  <thead className="bg-navy/5">
                    <tr>{(parsed.preview[hoja][0] as unknown[]).map((h, i) =>
                      <th key={i} className="px-3 py-2 text-left font-semibold text-navy/60 whitespace-nowrap">{String(h)}</th>
                    )}</tr>
                  </thead>
                  <tbody>
                    {parsed.preview[hoja].slice(1, 5).map((row, ri) =>
                      <tr key={ri} className="border-t border-navy/5">
                        {(row as unknown[]).map((cell, ci) =>
                          <td key={ci} className="px-3 py-2 text-navy/70 whitespace-nowrap">{String(cell)}</td>
                        )}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('subida')}
              className="px-5 py-3 rounded-xl border border-navy/20 text-navy font-heading font-bold text-sm hover:bg-navy/5 transition-colors">
              ← Atrás
            </button>
            <button onClick={analizar} disabled={!columnaNombre || loading}
              className="flex-1 py-3 rounded-xl bg-orange text-white font-heading font-bold text-sm disabled:opacity-40 transition-opacity">
              {loading ? 'Analizando…' : 'Analizar →'}
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 3: Revisión ── */}
      {step === 'revision' && (
        <div className="space-y-4">
          {confirmados.length > 0 && (
            <Section color="green" icon="✓"
              title={`${confirmados.length} confirmado${confirmados.length !== 1 ? 's' : ''}`}
              subtitle="Reconocidos automáticamente">
              <ul className="divide-y divide-navy/5">
                {confirmados.map((m, i) => (
                  <li key={i} className="flex items-center justify-between py-2.5">
                    <span className="text-sm font-body text-navy">{m.nombre}</span>
                    <div className="flex items-center gap-3">
                      {m.nombreEnSistema && m.nombreEnSistema !== m.nombre && (
                        <span className="text-xs font-body text-navy/40">→ {m.nombreEnSistema}</span>
                      )}
                      {'fechas' in m
                        ? <span className="text-xs font-body text-navy/40 tabular-nums">{(m as ResultadoMatch).fechas.length} fecha{(m as ResultadoMatch).fechas.length !== 1 ? 's' : ''}</span>
                        : <span className="text-xs font-body text-navy/40 tabular-nums">${(m as ResultadoMatchCobro).monto?.toFixed(2) ?? '—'}</span>
                      }
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {sugeridosUniq.length > 0 && (
            <Section color="orange" icon="?"
              title={`${sugeridosUniq.length} nombre${sugeridosUniq.length !== 1 ? 's' : ''} similar${sugeridosUniq.length !== 1 ? 'es' : ''}`}
              subtitle="El sistema encontró una persona parecida — confirmá si es la misma">
              <ul className="divide-y divide-navy/5">
                {sugeridosUniq.map((m) => {
                  const d = decisions[m.nombreNormalizado] ?? 'aceptar'
                  return (
                    <li key={m.nombreNormalizado} className="py-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body text-navy font-semibold">{m.nombre}</p>
                          {m.nombreEnSistema && (
                            <p className="text-xs font-body text-navy/50 mt-0.5">
                              → {m.nombreEnSistema}
                              {m.similitud && <span className="ml-1.5 text-orange font-semibold">{m.similitud}% similitud</span>}
                            </p>
                          )}
                          {'fechas' in m
                            ? <p className="text-xs text-navy/40 font-body">{(m as ResultadoMatch).fechas.length} fecha{(m as ResultadoMatch).fechas.length !== 1 ? 's' : ''}</p>
                            : <p className="text-xs text-navy/40 font-body">${(m as ResultadoMatchCobro).monto?.toFixed(2) ?? '—'}</p>
                          }
                        </div>
                        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                          <button onClick={() => setDecision(m.nombreNormalizado, 'aceptar')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-colors
                              ${d === 'aceptar' ? 'bg-green-500 text-white' : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}`}>
                            ✓ Sí es
                          </button>
                          <button onClick={() => setDecision(m.nombreNormalizado, 'nuevo')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-colors
                              ${d === 'nuevo' ? 'bg-navy text-white' : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}`}>
                            + Crear nuevo
                          </button>
                          <button onClick={() => setDecision(m.nombreNormalizado, { tipo: 'manual', nombre: '' })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-colors
                              ${typeof d === 'object' ? 'bg-blue-500 text-white' : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}`}>
                            🔍 Buscar
                          </button>
                        </div>
                      </div>
                      {typeof d === 'object' && (
                        <BuscadorAlumno
                          catalogo={catalogo}
                          seleccionado={d.alumnoId || d.alumnoExternoId ? d : null}
                          onSelect={(p) => setDecision(m.nombreNormalizado, {
                            tipo: 'manual',
                            alumnoId: p.tipo === 'registrado' ? p.id : undefined,
                            alumnoExternoId: p.tipo === 'externo' ? p.id : undefined,
                            nombre: p.nombre,
                          })}
                          onCancel={() => setDecision(m.nombreNormalizado, 'aceptar')}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            </Section>
          )}

          {nuevosUniq.length > 0 && (
            <Section color="navy" icon="+"
              title={`${nuevosCount} nuevo${nuevosCount !== 1 ? 's' : ''}`}
              subtitle="El sistema no los reconoció — se crearán como alumnos externos o podés vincularlos">
              <ul className="divide-y divide-navy/5">
                {nuevosUniq.map((m) => {
                  const d = decisions[m.nombreNormalizado] ?? 'nuevo'
                  return (
                    <li key={m.nombreNormalizado} className="py-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body text-navy">{m.nombre}</p>
                          {'fechas' in m
                            ? <p className="text-xs text-navy/40 font-body">{(m as ResultadoMatch).fechas.length} fecha{(m as ResultadoMatch).fechas.length !== 1 ? 's' : ''}</p>
                            : <p className="text-xs text-navy/40 font-body">${(m as ResultadoMatchCobro).monto?.toFixed(2) ?? '—'}</p>
                          }
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {typeof d === 'object'
                            ? <span className="text-xs font-body text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-lg">
                                → {d.nombre}
                              </span>
                            : (
                              <button onClick={() => setDecision(m.nombreNormalizado, { tipo: 'manual', nombre: '' })}
                                className="px-3 py-1.5 rounded-lg text-xs font-body font-semibold bg-navy/5 text-navy/60 hover:bg-navy/10 transition-colors">
                                🔍 Vincular a existente
                              </button>
                            )
                          }
                        </div>
                      </div>
                      {typeof d === 'object' && (
                        <BuscadorAlumno
                          catalogo={catalogo}
                          seleccionado={d.alumnoId || d.alumnoExternoId ? d : null}
                          onSelect={(p) => setDecision(m.nombreNormalizado, {
                            tipo: 'manual',
                            alumnoId: p.tipo === 'registrado' ? p.id : undefined,
                            alumnoExternoId: p.tipo === 'externo' ? p.id : undefined,
                            nombre: p.nombre,
                          })}
                          onCancel={() => setDecision(m.nombreNormalizado, 'nuevo')}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            </Section>
          )}

          {currentMatches.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-navy/50 font-body text-sm">
              No se encontraron filas válidas con el mapeo indicado.
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep('mapeando')}
              className="px-5 py-3 rounded-xl border border-navy/20 text-navy font-heading font-bold text-sm hover:bg-navy/5 transition-colors">
              ← Atrás
            </button>
            <button onClick={ejecutar} disabled={currentMatches.length === 0}
              className="flex-1 py-3 rounded-xl bg-orange text-white font-heading font-bold text-sm disabled:opacity-40 transition-opacity">
              Importar →
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 4: Importando ── */}
      {step === 'importando' && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-heading font-bold text-navy">Importando…</p>
          <p className="text-sm font-body text-navy/50 mt-1">Esto puede tardar unos segundos.</p>
        </div>
      )}

      {/* ── Paso 5: Listo ── */}
      {step === 'listo' && resumen && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div className="text-center py-2">
            <p className="text-4xl mb-2">✅</p>
            <h3 className="font-heading font-extrabold text-navy text-xl">¡Importación completada!</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {tipo === 'asistencias'
              ? <StatCard value={resumen.asistenciasImportadas} label="Asistencias importadas" />
              : <StatCard value={resumen.cobrosImportados} label="Cobros importados" />
            }
            <StatCard value={resumen.alumnosCreados} label="Alumnos nuevos" />
            <StatCard value={resumen.aliasGuardados} label="Alias guardados" />
            <StatCard value={resumen.duplicadosOmitidos} label="Omitidos" />
          </div>
          <button onClick={reset}
            className="w-full py-3 rounded-xl border border-navy/20 text-navy font-heading font-bold text-sm hover:bg-navy/5 transition-colors">
            Nueva importación
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StepBar({ step, tipoFijo }: { step: Step; tipoFijo: boolean }) {
  const allSteps: { id: Step; label: string }[] = [
    { id: 'tipo', label: 'Tipo' },
    { id: 'subida', label: 'Archivo' },
    { id: 'mapeando', label: 'Mapeo' },
    { id: 'revision', label: 'Revisión' },
    { id: 'listo', label: 'Listo' },
  ]
  const steps = tipoFijo ? allSteps.slice(1) : allSteps
  const order: Step[] = ['tipo', 'subida', 'mapeando', 'revision', 'importando', 'listo']
  const currentIdx = order.indexOf(step)

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const sIdx = order.indexOf(s.id)
        const done = sIdx < currentIdx
        const active = sIdx === currentIdx || (s.id === 'listo' && step === 'importando')
        return (
          <div key={s.id} className="flex items-center gap-1 flex-1 last:flex-none">
            <div className={`flex items-center gap-1.5 text-xs font-body font-semibold whitespace-nowrap
              ${done || active ? 'text-orange' : 'text-navy/30'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${done ? 'bg-orange text-white' : active ? 'border-2 border-orange text-orange' : 'border-2 border-navy/20 text-navy/30'}`}>
                {done ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px flex-1 mx-1 ${done ? 'bg-orange' : 'bg-navy/15'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function BuscadorAlumno({
  catalogo,
  seleccionado,
  onSelect,
  onCancel,
}: {
  catalogo: PersonaCatalogo[]
  seleccionado: { alumnoId?: string; alumnoExternoId?: string; nombre: string } | null
  onSelect: (p: PersonaCatalogo) => void
  onCancel: () => void
}) {
  const [q, setQ] = useState('')

  const resultados = q.trim().length < 2 ? [] : catalogo.filter(p =>
    p.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(
      q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    )
  ).slice(0, 8)

  if (seleccionado?.nombre) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
        <span className="text-xs font-body text-green-700 flex-1">✓ Vinculado a <strong>{seleccionado.nombre}</strong></span>
        <button onClick={onCancel}
          className="text-xs text-navy/40 hover:text-navy/70 font-body">
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          autoFocus
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Buscá por nombre…"
          className="flex-1 px-3 py-2 rounded-xl border border-navy/20 text-sm font-body text-navy placeholder:text-navy/30 focus:outline-none focus:border-orange transition-colors"
        />
        <button onClick={onCancel}
          className="px-3 py-2 rounded-xl border border-navy/20 text-xs font-body text-navy/50 hover:bg-navy/5 transition-colors">
          Cancelar
        </button>
      </div>
      {resultados.length > 0 && (
        <ul className="border border-navy/10 rounded-xl overflow-hidden">
          {resultados.map(p => (
            <li key={p.id}>
              <button onClick={() => onSelect(p)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-navy/5 transition-colors border-b border-navy/5 last:border-0">
                <span className="text-sm font-body text-navy">{p.nombre}</span>
                <span className={`text-xs font-body px-2 py-0.5 rounded-full font-semibold
                  ${p.tipo === 'registrado' ? 'bg-navy/10 text-navy/60' : 'bg-orange/10 text-orange'}`}>
                  {p.tipo === 'registrado' ? 'App' : 'Externo'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {q.trim().length >= 2 && resultados.length === 0 && (
        <p className="text-xs font-body text-navy/40 px-1">Sin resultados para &ldquo;{q}&rdquo;</p>
      )}
    </div>
  )
}

function ColSelect({ label, value, onChange, options, optional }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; optional?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-2">
        {label}{optional && <span className="ml-1 font-normal normal-case tracking-normal">(opcional)</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-navy/20 text-sm font-body text-navy bg-white focus:outline-none focus:border-orange transition-colors">
        {optional && <option value="">— Ninguna —</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function Section({ color, icon, title, subtitle, children }: {
  color: 'green' | 'orange' | 'navy'; icon: string; title: string; subtitle: string; children: React.ReactNode
}) {
  const headerCls = { green: 'bg-green-50 border-green-200 text-green-700', orange: 'bg-orange/5 border-orange/30 text-orange', navy: 'bg-navy/5 border-navy/20 text-navy' }[color]
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-3 border-b ${headerCls}`}>
        <span className="font-bold">{icon}</span>
        <div>
          <p className="font-heading font-bold text-sm">{title}</p>
          <p className="text-xs opacity-70 font-body">{subtitle}</p>
        </div>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  )
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-navy/5 rounded-xl p-4 text-center">
      <p className="text-2xl font-heading font-extrabold text-navy tabular-nums">{value}</p>
      <p className="text-xs font-body text-navy/60 mt-1">{label}</p>
    </div>
  )
}

