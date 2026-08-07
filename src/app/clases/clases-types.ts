export type ClaseInfo = {
  serie_id: string | null
  excepcion_id: string | null
  fecha: string
  nombre: string
  hora_inicio: string
  duracion_minutos: number
  cupo_maximo: number
  instructor: string
  descripcion: string | null
  cancelada: boolean
  es_especial: boolean
  confirmadas: number
  yaReservada: boolean
}

export type DiaGroup = {
  fecha: string
  label: string
  clases: ClaseInfo[]
}

export type SemanaGroup = {
  monday: string
  label: string
  esActual: boolean
  dias: DiaGroup[]
}
