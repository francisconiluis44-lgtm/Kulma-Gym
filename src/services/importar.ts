import * as XLSX from 'xlsx'
import { createAdminClient } from '@/lib/supabase/admin'

export type FormatoImport = 'filas' | 'matriz'

export interface MappingImport {
  formato: FormatoImport
  hoja: string
  columnaNombre: string
  columnaFecha?: string
}

export interface FilaParseada {
  nombre: string
  nombreNormalizado: string
  fechas: string[]
}

export type TipoMatch = 'confirmado' | 'sugerido' | 'nuevo'

export interface ResultadoMatch {
  nombre: string
  nombreNormalizado: string
  fechas: string[]
  tipo: TipoMatch
  alumnoId?: string
  alumnoExternoId?: string
  nombreEnSistema?: string
  similitud?: number
}

export interface ResultadoImport {
  asistenciasImportadas: number
  alumnosCreados: number
  aliasGuardados: number
  duplicadosOmitidos: number
}

export interface ExcelParseado {
  hojas: string[]
  columnas: Record<string, string[]>
  preview: Record<string, unknown[][]>
}

// ─── Normalización ────────────────────────────────────────────────────────────

export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
}

function similitudStr(a: string, b: string): number {
  if (a === b) return 1
  const la = a.length, lb = b.length
  if (!la || !lb) return 0
  const dp = Array.from({ length: la + 1 }, (_, i) =>
    Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return 1 - dp[la][lb] / Math.max(la, lb)
}

// ─── Conversión de fechas ─────────────────────────────────────────────────────

function serialAFecha(num: number): string | null {
  try {
    const parsed = XLSX.SSF.parse_date_code(num)
    if (parsed && parsed.y > 2000 && parsed.y < 2100) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
    }
  } catch { /* skip */ }
  return null
}

function strAFecha(str: string): string | null {
  const dd = str.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/)
  if (dd) {
    const day = dd[1].padStart(2, '0')
    const month = dd[2].padStart(2, '0')
    const year = dd[3]
      ? (dd[3].length === 2 ? `20${dd[3]}` : dd[3])
      : new Date().getFullYear().toString()
    return `${year}-${month}-${day}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  return null
}

function valorAFecha(val: unknown): string | null {
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  if (typeof val === 'number') return serialAFecha(val)
  if (typeof val === 'string') return strAFecha(val.trim())
  return null
}

function celdaEsAsistencia(val: unknown): boolean {
  if (val === null || val === undefined || val === '') return false
  const str = String(val).trim().toLowerCase()
  if (!str || str === '0' || str === 'no' || str === 'n' || str === 'false') return false
  return true
}

// ─── Parseo del Excel ─────────────────────────────────────────────────────────

export function parsearExcel(buffer: ArrayBuffer): ExcelParseado {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const res: ExcelParseado = { hojas: wb.SheetNames, columnas: {}, preview: {} }
  for (const hoja of wb.SheetNames) {
    const ws = wb.Sheets[hoja]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
    if (!rows.length) continue
    res.columnas[hoja] = (rows[0] as unknown[]).map(h => String(h ?? '').trim()).filter(Boolean)
    res.preview[hoja] = rows.slice(0, 6) as unknown[][]
  }
  return res
}

export function extraerFilas(buffer: ArrayBuffer, mapping: MappingImport): FilaParseada[] {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const ws = wb.Sheets[mapping.hoja]
  if (!ws) return []
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
  if (rows.length < 2) return []
  const headers = (rows[0] as unknown[]).map(h => String(h ?? '').trim())
  const idxNombre = headers.indexOf(mapping.columnaNombre)
  if (idxNombre === -1) return []

  if (mapping.formato === 'filas') {
    const idxFecha = mapping.columnaFecha ? headers.indexOf(mapping.columnaFecha) : -1
    const mapa = new Map<string, { nombre: string; fechas: Set<string> }>()
    for (const row of rows.slice(1) as unknown[][]) {
      const nombre = String(row[idxNombre] ?? '').trim()
      if (!nombre) continue
      const key = normalizarNombre(nombre)
      if (!mapa.has(key)) mapa.set(key, { nombre, fechas: new Set() })
      if (idxFecha !== -1) {
        const fecha = valorAFecha(row[idxFecha])
        if (fecha) mapa.get(key)!.fechas.add(fecha)
      }
    }
    return Array.from(mapa.values()).map(({ nombre, fechas }) => ({
      nombre,
      nombreNormalizado: normalizarNombre(nombre),
      fechas: Array.from(fechas).sort(),
    }))
  } else {
    // Matriz: nombres en filas, fechas como headers de columnas
    const colFechas: Array<{ idx: number; fecha: string }> = []
    for (let i = 0; i < headers.length; i++) {
      if (i === idxNombre) continue
      const fecha = valorAFecha(headers[i])
      if (fecha) colFechas.push({ idx: i, fecha })
    }
    return (rows.slice(1) as unknown[][])
      .map(row => {
        const nombre = String(row[idxNombre] ?? '').trim()
        if (!nombre) return null
        const fechas = colFechas.filter(({ idx }) => celdaEsAsistencia(row[idx])).map(({ fecha }) => fecha).sort()
        return { nombre, nombreNormalizado: normalizarNombre(nombre), fechas }
      })
      .filter((f): f is FilaParseada => f !== null)
  }
}

// ─── Matching ────────────────────────────────────────────────────────────────

const UMBRAL_SIMILITUD = 0.75

export async function matchearFilas(filas: FilaParseada[], gimnasioId: string): Promise<ResultadoMatch[]> {
  const supabase = createAdminClient()
  const [{ data: alumnos }, { data: externos }, { data: alias }] = await Promise.all([
    supabase.from('alumnos').select('id, nombre_completo').eq('gimnasio_id', gimnasioId),
    supabase.from('alumnos_externos').select('id, nombre_completo').eq('gimnasio_id', gimnasioId).is('alumno_id', null),
    supabase.from('alias_alumnos_externos').select('alumno_externo_id, alias').eq('gimnasio_id', gimnasioId),
  ])

  const regNorm = (alumnos ?? []).map(a => ({ id: a.id, nombre: a.nombre_completo, norm: normalizarNombre(a.nombre_completo) }))
  const extNorm = (externos ?? []).map(a => ({ id: a.id, nombre: a.nombre_completo, norm: normalizarNombre(a.nombre_completo) }))
  const aliasMap = new Map<string, string>((alias ?? []).map(a => [normalizarNombre(a.alias), a.alumno_externo_id]))

  return filas.map((fila): ResultadoMatch => {
    const norm = fila.nombreNormalizado

    // 1. Alias confirmado por humano
    const extIdAlias = aliasMap.get(norm)
    if (extIdAlias) {
      return { ...fila, tipo: 'confirmado', alumnoExternoId: extIdAlias, nombreEnSistema: extNorm.find(e => e.id === extIdAlias)?.nombre }
    }

    // 2. Nombre exacto — alumno registrado
    const regExacto = regNorm.find(a => a.norm === norm)
    if (regExacto) return { ...fila, tipo: 'confirmado', alumnoId: regExacto.id, nombreEnSistema: regExacto.nombre }

    // 3. Nombre exacto — alumno externo
    const extExacto = extNorm.find(a => a.norm === norm)
    if (extExacto) return { ...fila, tipo: 'confirmado', alumnoExternoId: extExacto.id, nombreEnSistema: extExacto.nombre }

    // 4. Similitud alta
    let best = { sim: 0, alumnoId: undefined as string | undefined, alumnoExternoId: undefined as string | undefined, nombre: '' }
    for (const a of [...regNorm, ...extNorm]) {
      const s = similitudStr(norm, a.norm)
      if (s > best.sim) best = { sim: s, alumnoId: regNorm.includes(a) ? a.id : undefined, alumnoExternoId: extNorm.includes(a) ? a.id : undefined, nombre: a.nombre }
    }
    if (best.sim >= UMBRAL_SIMILITUD) {
      return { ...fila, tipo: 'sugerido', alumnoId: best.alumnoId, alumnoExternoId: best.alumnoExternoId, nombreEnSistema: best.nombre, similitud: Math.round(best.sim * 100) }
    }

    return { ...fila, tipo: 'nuevo' }
  })
}
