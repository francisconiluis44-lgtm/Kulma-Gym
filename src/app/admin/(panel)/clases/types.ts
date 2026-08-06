export type ClaseOcurrencia = {
  serie_id: string | null      // null para clase_especial
  excepcion_id: string | null  // presente si hay excepción activa
  version_id: string | null    // para cambio permanente
  dia_semana: number | null    // 1=Lun, 7=Dom
  fecha: string                // YYYY-MM-DD
  nombre: string
  hora_inicio: string          // "HH:MM"
  duracion_minutos: number
  cupo_maximo: number
  instructor: string
  descripcion: string | null
  cancelada: boolean
  es_especial: boolean
  confirmadas: number
}

export type SerieConVersion = {
  id: string
  nombre: string
  version_id: string
  dia_semana: number
  hora_inicio: string
  duracion_minutos: number
  cupo_maximo: number
  instructor: string
  descripcion: string | null
  fecha_desde: string
}

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const DIAS_CORTOS  = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
