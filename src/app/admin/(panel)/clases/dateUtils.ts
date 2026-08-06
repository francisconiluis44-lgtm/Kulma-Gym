export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]!
}

export function getMondayOfWeek(offsetWeeks: number): string {
  const hoyAR = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  })
  const d = new Date(hoyAR + 'T12:00:00Z')
  const dow = d.getUTCDay() // 0=Dom, 1=Lun ...
  const daysToMonday = dow === 0 ? -6 : 1 - dow
  d.setUTCDate(d.getUTCDate() + daysToMonday + offsetWeeks * 7)
  return d.toISOString().split('T')[0]!
}

export function getWeekDates(mondayStr: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayStr, i))
}

/** Retorna ISO dow: 1=Lunes … 7=Domingo */
export function getISODow(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00Z')
  const dow = d.getUTCDay()
  return dow === 0 ? 7 : dow
}

export function formatHora(horaStr: string): string {
  return horaStr.substring(0, 5)
}

export function getTodayAR(): string {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  })
}

export function formatSemanaLabel(lunesStr: string, domingoStr: string): string {
  const lunes   = new Date(lunesStr   + 'T12:00:00Z')
  const domingo = new Date(domingoStr + 'T12:00:00Z')
  const domDia  = domingo.getUTCDate()
  const domMes  = domingo.toLocaleDateString('es-AR', { month: 'short', timeZone: 'UTC' })
  const año     = domingo.getUTCFullYear()
  if (lunes.getUTCMonth() === domingo.getUTCMonth()) {
    return `${lunes.getUTCDate()} al ${domDia} de ${domMes} ${año}`
  }
  const lunMes = lunes.toLocaleDateString('es-AR', { month: 'short', timeZone: 'UTC' })
  return `${lunes.getUTCDate()} ${lunMes} al ${domDia} ${domMes} ${año}`
}

export function formatFechaLarga(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

export function formatFechaCorta(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}
