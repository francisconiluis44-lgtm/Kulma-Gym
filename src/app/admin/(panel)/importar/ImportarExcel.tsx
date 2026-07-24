'use client'

import { useState, useRef } from 'react'
import type { ResultadoMatch, ExcelParseado, MappingImport } from '@/services/importar'

type Step = 'subida' | 'mapeando' | 'revision' | 'importando' | 'listo'

interface Resumen {
  asistenciasImportadas: number
  alumnosCreados: number
  aliasGuardados: number
  duplicadosOmitidos: number
}

export default function ImportarExcel() {
  const [step, setStep] = useState<Step>('subida')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [parsed, setParsed] = useState<ExcelParseado | null>(null)
  const [matches, setMatches] = useState<ResultadoMatch[]>([])
  const [decisions, setDecisions] = useState<Record<string, 'aceptar' | 'nuevo'>>({})
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [hoja, setHoja] = useState('')
  const [formato, setFormato] = useState<'filas' | 'matriz'>('filas')
  const [columnaNombre, setColumnaNombre] = useState('')
  const [columnaFecha, setColumnaFecha] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    setError(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function parsear() {
    if (!file) return
    setLoading(true)
    setError(null)
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
      setStep('mapeando')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  async function analizar() {
    if (!file || !hoja || !columnaNombre) return
    setLoading(true)
    setError(null)
    try {
      const mapping: MappingImport = {
        formato,
        hoja,
        columnaNombre,
        ...(formato === 'filas' && columnaFecha ? { columnaFecha } : {}),
      }
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mapping', JSON.stringify(mapping))
      const res = await fetch('/api/admin/import/analizar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al analizar el archivo')
      setMatches(data.matches)
      const init: Record<string, 'aceptar' | 'nuevo'> = {}
      for (const m of data.matches) {
        if (m.tipo === 'sugerido') init[m.nombreNormalizado] = 'aceptar'
      }
      setDecisions(init)
      setStep('revision')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  async function ejecutar() {
    setStep('importando')
    setError(null)
    try {
      const sugeridos = matches.filter(m => m.tipo === 'sugerido')
      const confirmados = [
        ...matches.filter(m => m.tipo === 'confirmado'),
        ...sugeridos.filter(m => decisions[m.nombreNormalizado] === 'aceptar'),
      ]
      const nuevos = [
        ...matches.filter(m => m.tipo === 'nuevo'),
        ...sugeridos.filter(m => decisions[m.nombreNormalizado] === 'nuevo'),
      ]
      const aliasNuevos = sugeridos
        .filter(m => decisions[m.nombreNormalizado] === 'aceptar' && m.alumnoExternoId)
        .map(m => ({ alias: m.nombre, alumnoExternoId: m.alumnoExternoId! }))

      const res = await fetch('/api/admin/import/ejecutar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmados, nuevos, aliasNuevos }),
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

  function reset() {
    setStep('subida')
    setFile(null)
    setParsed(null)
    setMatches([])
    setDecisions({})
    setResumen(null)
    setError(null)
    setHoja('')
    setFormato('filas')
    setColumnaNombre('')
    setColumnaFecha('')
  }

  const confirmados = matches.filter(m => m.tipo === 'confirmado')
  const sugeridos = matches.filter(m => m.tipo === 'sugerido')
  const nuevos = matches.filter(m => m.tipo === 'nuevo')
  const nuevosEfectivos = [
    ...nuevos,
    ...sugeridos.filter(m => decisions[m.nombreNormalizado] === 'nuevo'),
  ]

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-navy">Importar asistencias</h2>
        <p className="text-sm text-navy/50 font-body mt-1">
          Subí un Excel con asistencias y las importamos al sistema.
        </p>
      </div>

      {step !== 'subida' && <StepBar step={step} />}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-body">
          {error}
        </div>
      )}

      {/* ── Paso 1: Subida ── */}
      {step === 'subida' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
              ${dragging ? 'border-orange bg-orange/5' : 'border-navy/20 hover:border-orange/50'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
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
          <button
            onClick={parsear}
            disabled={!file || loading}
            className="w-full py-3 rounded-xl bg-orange text-white font-heading font-bold text-sm disabled:opacity-40 transition-opacity"
          >
            {loading ? 'Leyendo…' : 'Continuar →'}
          </button>
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
                  <button
                    key={h}
                    onClick={() => {
                      setHoja(h)
                      const cols = parsed.columnas[h] ?? []
                      setColumnaNombre(cols[0] ?? '')
                      setColumnaFecha(cols[1] ?? '')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-body font-semibold transition-colors
                      ${hoja === h ? 'bg-orange text-white' : 'bg-navy/5 text-navy/70 hover:bg-navy/10'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-2">Formato</label>
            <div className="grid grid-cols-2 gap-3">
              {(['filas', 'matriz'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFormato(f)}
                  className={`p-3 rounded-xl border text-left transition-colors
                    ${formato === f ? 'border-orange bg-orange/5' : 'border-navy/15 hover:border-navy/30'}`}
                >
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

          <div className="grid grid-cols-2 gap-4">
            <ColSelect
              label="Columna de nombre"
              value={columnaNombre}
              onChange={setColumnaNombre}
              options={parsed.columnas[hoja] ?? []}
            />
            {formato === 'filas' && (
              <ColSelect
                label="Columna de fecha"
                value={columnaFecha}
                onChange={setColumnaFecha}
                options={parsed.columnas[hoja] ?? []}
                optional
              />
            )}
          </div>

          {parsed.preview[hoja] && parsed.preview[hoja].length > 0 && (
            <div>
              <p className="text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-2">Vista previa</p>
              <div className="overflow-x-auto rounded-xl border border-navy/10">
                <table className="w-full text-xs font-body">
                  <thead className="bg-navy/5">
                    <tr>
                      {(parsed.preview[hoja][0] as unknown[]).map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-semibold text-navy/60 whitespace-nowrap">
                          {String(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.preview[hoja].slice(1, 5).map((row, ri) => (
                      <tr key={ri} className="border-t border-navy/5">
                        {(row as unknown[]).map((cell, ci) => (
                          <td key={ci} className="px-3 py-2 text-navy/70 whitespace-nowrap">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('subida')}
              className="px-5 py-3 rounded-xl border border-navy/20 text-navy font-heading font-bold text-sm hover:bg-navy/5 transition-colors"
            >
              ← Atrás
            </button>
            <button
              onClick={analizar}
              disabled={!columnaNombre || loading}
              className="flex-1 py-3 rounded-xl bg-orange text-white font-heading font-bold text-sm disabled:opacity-40 transition-opacity"
            >
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
              subtitle="Reconocidos automáticamente"
            >
              <ul className="divide-y divide-navy/5">
                {confirmados.map(m => (
                  <li key={m.nombreNormalizado} className="flex items-center justify-between py-2.5">
                    <span className="text-sm font-body text-navy">{m.nombre}</span>
                    <div className="flex items-center gap-3 text-right">
                      {m.nombreEnSistema && m.nombreEnSistema !== m.nombre && (
                        <span className="text-xs font-body text-navy/40">→ {m.nombreEnSistema}</span>
                      )}
                      <span className="text-xs font-body text-navy/40 tabular-nums">
                        {m.fechas.length} fecha{m.fechas.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {sugeridos.length > 0 && (
            <Section color="orange" icon="?"
              title={`${sugeridos.length} sugerido${sugeridos.length !== 1 ? 's' : ''}`}
              subtitle="Similitud alta — confirmá si son la misma persona"
            >
              <ul className="divide-y divide-navy/5">
                {sugeridos.map(m => {
                  const dec = decisions[m.nombreNormalizado] ?? 'aceptar'
                  return (
                    <li key={m.nombreNormalizado} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body text-navy">{m.nombre}</p>
                          {m.nombreEnSistema && (
                            <p className="text-xs font-body text-navy/50 mt-0.5">
                              → {m.nombreEnSistema}
                              {m.similitud && (
                                <span className="ml-1.5 text-orange font-semibold">{m.similitud}% similitud</span>
                              )}
                            </p>
                          )}
                          <p className="text-xs font-body text-navy/40 mt-0.5">
                            {m.fechas.length} fecha{m.fechas.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => setDecisions(d => ({ ...d, [m.nombreNormalizado]: 'aceptar' }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-colors
                              ${dec === 'aceptar' ? 'bg-green-500 text-white' : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}`}
                          >
                            ✓ Sí es
                          </button>
                          <button
                            onClick={() => setDecisions(d => ({ ...d, [m.nombreNormalizado]: 'nuevo' }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-body font-semibold transition-colors
                              ${dec === 'nuevo' ? 'bg-navy text-white' : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}`}
                          >
                            + Crear nuevo
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Section>
          )}

          {nuevosEfectivos.length > 0 && (
            <Section color="navy" icon="+"
              title={`${nuevosEfectivos.length} nuevo${nuevosEfectivos.length !== 1 ? 's' : ''}`}
              subtitle="Se van a crear como alumnos externos"
            >
              <ul className="divide-y divide-navy/5">
                {nuevosEfectivos.map(m => (
                  <li key={m.nombreNormalizado} className="flex items-center justify-between py-2.5">
                    <span className="text-sm font-body text-navy">{m.nombre}</span>
                    <span className="text-xs font-body text-navy/40 tabular-nums">
                      {m.fechas.length} fecha{m.fechas.length !== 1 ? 's' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {matches.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-navy/50 font-body text-sm">
              No se encontraron nombres válidos con el mapeo indicado.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('mapeando')}
              className="px-5 py-3 rounded-xl border border-navy/20 text-navy font-heading font-bold text-sm hover:bg-navy/5 transition-colors"
            >
              ← Atrás
            </button>
            <button
              onClick={ejecutar}
              disabled={matches.length === 0}
              className="flex-1 py-3 rounded-xl bg-orange text-white font-heading font-bold text-sm disabled:opacity-40 transition-opacity"
            >
              Importar →
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 4: Importando ── */}
      {step === 'importando' && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-10 h-10 border-4 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-heading font-bold text-navy">Importando asistencias…</p>
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
            <StatCard value={resumen.asistenciasImportadas} label="Asistencias importadas" />
            <StatCard value={resumen.alumnosCreados} label="Alumnos nuevos" />
            <StatCard value={resumen.aliasGuardados} label="Alias guardados" />
            <StatCard value={resumen.duplicadosOmitidos} label="Duplicados omitidos" />
          </div>
          <button
            onClick={reset}
            className="w-full py-3 rounded-xl border border-navy/20 text-navy font-heading font-bold text-sm hover:bg-navy/5 transition-colors"
          >
            Nueva importación
          </button>
        </div>
      )}
    </div>
  )
}

function StepBar({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: 'subida', label: 'Archivo' },
    { id: 'mapeando', label: 'Mapeo' },
    { id: 'revision', label: 'Revisión' },
    { id: 'importando', label: 'Importar' },
    { id: 'listo', label: 'Listo' },
  ]
  const current = steps.findIndex(s => s.id === step)
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1 flex-1 last:flex-none">
          <div className={`flex items-center gap-1.5 text-xs font-body font-semibold whitespace-nowrap
            ${i <= current ? 'text-orange' : 'text-navy/30'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
              ${i < current ? 'bg-orange text-white' : i === current ? 'border-2 border-orange text-orange' : 'border-2 border-navy/20 text-navy/30'}`}>
              {i < current ? '✓' : i + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px flex-1 mx-1 ${i < current ? 'bg-orange' : 'bg-navy/15'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function ColSelect({ label, value, onChange, options, optional }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  optional?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-body font-semibold tracking-widest text-navy/50 uppercase mb-2">
        {label}
        {optional && <span className="ml-1 font-normal normal-case tracking-normal">(opcional)</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-navy/20 text-sm font-body text-navy bg-white focus:outline-none focus:border-orange transition-colors"
      >
        {optional && <option value="">— Ninguna —</option>}
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

function Section({ color, icon, title, subtitle, children }: {
  color: 'green' | 'orange' | 'navy'
  icon: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  const headerCls = {
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange/5 border-orange/30 text-orange',
    navy: 'bg-navy/5 border-navy/20 text-navy',
  }[color]

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
