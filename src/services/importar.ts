import * as XLSX from 'xlsx'
import { createAdminClient } from '@/lib/supabase/admin'

export type TipoImport = 'asistencias' | 'cobros'
export type FormatoImport = 'filas' | 'matriz'

export interface MappingImport {
  tipo: TipoImport
  formato: FormatoImport
  hoja: string
  columnaNombre: string
  columnaApellido?: string
  columnaFecha?: string
  columnaMonto?: string
  columnaMetodo?: string
  columnaNotas?: string
  swapDiasMes?: boolean
}

export interface FilaParseada {
  nombre: string
  nombreNormalizado: string
  fechas: string[]
}

export interface FilaParseadaCobro {
  nombre: string
  nombreNormalizado: string
  fecha: string | null
  monto: number | null
  metodo: string
  notas: string
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

export interface ResultadoMatchCobro {
  nombre: string
  nombreNormalizado: string
  fecha: string | null
  monto: number | null
  metodo: string
  notas: string
  tipo: TipoMatch
  alumnoId?: string
  alumnoExternoId?: string
  nombreEnSistema?: string
  similitud?: number
}

export interface PersonaCatalogo {
  id: string
  nombre: string
  tipo: 'registrado' | 'externo'
}

export interface ResultadoImport {
  asistenciasImportadas: number
  cobrosImportados: number
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

function strAFecha(str: string, swapDiasMes = false): string | null {
  const s = str.trim()
  if (!s) return null

  // YYYY-XX-YY (ISO-like): "2026-07-20", "2026-1-07", "2026-07-20T09:15:00"
  const isoLike = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoLike) {
    const year = isoLike[1]
    const a = isoLike[2].padStart(2, '0')
    const b = isoLike[3].padStart(2, '0')
    if (swapDiasMes) {
      // Formato YYYY-DD-MM (argentino con año primero): "2026-01-07" → julio 1
      const month = parseInt(b), day = parseInt(a)
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${b}-${a}`
      }
    }
    return `${year}-${a}-${b}`
  }

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (con o sin año)
  const dd = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?/)
  if (dd) {
    const day = dd[1].padStart(2, '0')
    const month = dd[2].padStart(2, '0')
    const year = dd[3]
      ? (dd[3].length === 2 ? `20${dd[3]}` : dd[3])
      : new Date().getFullYear().toString()
    return `${year}-${month}-${day}`
  }

  // Fallback: Date.toString() como "Tue Jul 01 2026 00:00:00 GMT+0000" (Date objects stringificados)
  try {
    const d = new Date(s)
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2100) {
      return d.toISOString().slice(0, 10)
    }
  } catch { /* skip */ }

  return null
}

function valorAFecha(val: unknown, swapDiasMes = false): string | null {
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  if (typeof val === 'number') return serialAFecha(val)
  if (typeof val === 'string') return strAFecha(val.trim(), swapDiasMes)
  return null
}

function valorAMonto(val: unknown): number | null {
  if (typeof val === 'number') return isNaN(val) ? null : val
  if (typeof val === 'string') {
    const n = parseFloat(val.trim().replace(/[^\d.,]/g, '').replace(',', '.'))
    return isNaN(n) ? null : n
  }
  return null
}

function valorAMetodo(val: unknown): string {
  const s = String(val ?? '').trim().toLowerCase()
  if (!s) return 'efectivo'
  if (s.includes('transfer')) return 'transferencia'
  if (s.includes('tarjet') || s.includes('debito') || s.includes('credito') || s.includes('card')) return 'tarjeta'
  if (s.includes('otro') || s.includes('other')) return 'otro'
  return 'efectivo'
}

function celdaEsAsistencia(val: unknown): boolean {
  if (val === null || val === undefined || val === '') return false
  const str = String(val).trim().toLowerCase()
  if (!str || str === '0' || str === 'no' || str === 'n' || str === 'false') return false
  return true
}

// ─── Parseo del Excel ─────────────────────────────────────────────────────────

function celAString(val: unknown): string {
  if (val instanceof Date) return valorAFecha(val) ?? val.toISOString().slice(0, 10)
  return String(val ?? '').trim()
}

export function parsearExcel(buffer: ArrayBuffer): ExcelParseado {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const res: ExcelParseado = { hojas: wb.SheetNames, columnas: {}, preview: {} }
  for (const hoja of wb.SheetNames) {
    const ws = wb.Sheets[hoja]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
    if (!rows.length) continue
    res.columnas[hoja] = (rows[0] as unknown[]).map(celAString).filter(Boolean)
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
  const idxApellido = mapping.columnaApellido ? headers.indexOf(mapping.columnaApellido) : -1
  const swap = mapping.swapDiasMes ?? false

  function combinarNombre(row: unknown[]): string {
    const parte1 = String(row[idxNombre] ?? '').trim()
    if (idxApellido === -1) return parte1
    const parte2 = String(row[idxApellido] ?? '').trim()
    return parte2 ? `${parte1} ${parte2}` : parte1
  }

  if (mapping.formato === 'filas') {
    const idxFecha = mapping.columnaFecha ? headers.indexOf(mapping.columnaFecha) : -1
    const mapa = new Map<string, { nombre: string; fechas: Set<string> }>()
    for (const row of rows.slice(1) as unknown[][]) {
      const nombre = combinarNombre(row)
      if (!nombre) continue
      const key = normalizarNombre(nombre)
      if (!mapa.has(key)) mapa.set(key, { nombre, fechas: new Set() })
      if (idxFecha !== -1) {
        const fecha = valorAFecha(row[idxFecha], swap)
        if (fecha) mapa.get(key)!.fechas.add(fecha)
      }
    }
    return Array.from(mapa.values()).map(({ nombre, fechas }) => ({
      nombre,
      nombreNormalizado: normalizarNombre(nombre),
      fechas: Array.from(fechas).sort(),
    }))
  } else {
    const rawRow0 = rows[0] as unknown[]
    const colFechas: Array<{ idx: number; fecha: string }> = []
    for (let i = 0; i < rawRow0.length; i++) {
      if (i === idxNombre) continue
      // Usar el valor RAW de la celda para preservar Date objects que xlsx genera con cellDates:true
      const fecha = valorAFecha(rawRow0[i], swap)
      if (fecha) colFechas.push({ idx: i, fecha })
    }
    return (rows.slice(1) as unknown[][])
      .map(row => {
        const nombre = combinarNombre(row)
        if (!nombre) return null
        const fechas = colFechas.filter(({ idx }) => celdaEsAsistencia(row[idx])).map(({ fecha }) => fecha).sort()
        return { nombre, nombreNormalizado: normalizarNombre(nombre), fechas }
      })
      .filter((f): f is FilaParseada => f !== null)
  }
}

export function extraerFilasCobros(buffer: ArrayBuffer, mapping: MappingImport): FilaParseadaCobro[] {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const ws = wb.Sheets[mapping.hoja]
  if (!ws) return []
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: '' })
  if (rows.length < 2) return []
  const headers = (rows[0] as unknown[]).map(h => String(h ?? '').trim())
  const idxNombre = headers.indexOf(mapping.columnaNombre)
  if (idxNombre === -1) return []
  const idxApellido = mapping.columnaApellido ? headers.indexOf(mapping.columnaApellido) : -1

  const idxFecha = mapping.columnaFecha ? headers.indexOf(mapping.columnaFecha) : -1
  const idxMonto = mapping.columnaMonto ? headers.indexOf(mapping.columnaMonto) : -1
  const idxMetodo = mapping.columnaMetodo ? headers.indexOf(mapping.columnaMetodo) : -1
  const idxNotas = mapping.columnaNotas ? headers.indexOf(mapping.columnaNotas) : -1

  return (rows.slice(1) as unknown[][])
    .map(row => {
      const parte1 = String(row[idxNombre] ?? '').trim()
      const parte2 = idxApellido !== -1 ? String(row[idxApellido] ?? '').trim() : ''
      const nombre = parte2 ? `${parte1} ${parte2}` : parte1
      if (!nombre) return null
      const fecha = idxFecha !== -1 ? valorAFecha(row[idxFecha], mapping.swapDiasMes ?? false) : null
      const monto = idxMonto !== -1 ? valorAMonto(row[idxMonto]) : null
      const metodo = idxMetodo !== -1 ? valorAMetodo(row[idxMetodo]) : 'efectivo'
      const notas = idxNotas !== -1 ? String(row[idxNotas] ?? '').trim() : ''
      return { nombre, nombreNormalizado: normalizarNombre(nombre), fecha, monto, metodo, notas }
    })
    .filter((f): f is FilaParseadaCobro => f !== null)
}

// ─── Matching ────────────────────────────────────────────────────────────────

const UMBRAL_SIMILITUD = 0.75

async function cargarCatalogo(gimnasioId: string) {
  const supabase = createAdminClient()
  const [{ data: alumnos }, { data: externos }, { data: alias }] = await Promise.all([
    supabase.from('alumnos').select('id, nombre_completo').eq('gimnasio_id', gimnasioId),
    supabase.from('alumnos_externos').select('id, nombre_completo').eq('gimnasio_id', gimnasioId).is('alumno_id', null),
    supabase.from('alias_alumnos_externos').select('alumno_externo_id, alias').eq('gimnasio_id', gimnasioId),
  ])
  const regNorm = (alumnos ?? []).map(a => ({ id: a.id, nombre: a.nombre_completo, norm: normalizarNombre(a.nombre_completo) }))
  const extNorm = (externos ?? []).map(a => ({ id: a.id, nombre: a.nombre_completo, norm: normalizarNombre(a.nombre_completo) }))
  const aliasMap = new Map<string, string>((alias ?? []).map(a => [normalizarNombre(a.alias), a.alumno_externo_id]))
  return { regNorm, extNorm, aliasMap }
}

function matchearNombre(
  norm: string,
  regNorm: { id: string; nombre: string; norm: string }[],
  extNorm: { id: string; nombre: string; norm: string }[],
  aliasMap: Map<string, string>
): { tipo: TipoMatch; alumnoId?: string; alumnoExternoId?: string; nombreEnSistema?: string; similitud?: number } {
  const extIdAlias = aliasMap.get(norm)
  if (extIdAlias) {
    return { tipo: 'confirmado', alumnoExternoId: extIdAlias, nombreEnSistema: extNorm.find(e => e.id === extIdAlias)?.nombre }
  }
  const regExacto = regNorm.find(a => a.norm === norm)
  if (regExacto) return { tipo: 'confirmado', alumnoId: regExacto.id, nombreEnSistema: regExacto.nombre }
  const extExacto = extNorm.find(a => a.norm === norm)
  if (extExacto) return { tipo: 'confirmado', alumnoExternoId: extExacto.id, nombreEnSistema: extExacto.nombre }

  let best = { sim: 0, alumnoId: undefined as string | undefined, alumnoExternoId: undefined as string | undefined, nombre: '' }
  for (const a of [...regNorm, ...extNorm]) {
    const s = similitudStr(norm, a.norm)
    if (s > best.sim) best = {
      sim: s,
      alumnoId: regNorm.includes(a) ? a.id : undefined,
      alumnoExternoId: extNorm.includes(a) ? a.id : undefined,
      nombre: a.nombre,
    }
  }
  if (best.sim >= UMBRAL_SIMILITUD) {
    return { tipo: 'sugerido', alumnoId: best.alumnoId, alumnoExternoId: best.alumnoExternoId, nombreEnSistema: best.nombre, similitud: Math.round(best.sim * 100) }
  }
  return { tipo: 'nuevo' }
}

export async function matchearFilas(filas: FilaParseada[], gimnasioId: string): Promise<ResultadoMatch[]> {
  const { regNorm, extNorm, aliasMap } = await cargarCatalogo(gimnasioId)
  return filas.map((fila): ResultadoMatch => ({
    ...fila,
    ...matchearNombre(fila.nombreNormalizado, regNorm, extNorm, aliasMap),
  }))
}

export async function matchearFilasCobros(filas: FilaParseadaCobro[], gimnasioId: string): Promise<ResultadoMatchCobro[]> {
  const { regNorm, extNorm, aliasMap } = await cargarCatalogo(gimnasioId)
  return filas.map((fila): ResultadoMatchCobro => ({
    ...fila,
    ...matchearNombre(fila.nombreNormalizado, regNorm, extNorm, aliasMap),
  }))
}
