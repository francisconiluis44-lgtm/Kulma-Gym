export type Database = {
  public: {
    Tables: {
      gimnasios: {
        Row: {
          id: string
          nombre: string
          slug: string
          plan: string
          activo: boolean
          created_at: string
          color_primario: string | null
          color_acento: string | null
          logo_url: string | null
          logo_header_url: string | null
          ai_enabled: boolean
          ai_daily_limit: number
          ai_questions_today: number
          ai_questions_reset_at: string | null
        }
        Insert: {
          id?: string
          nombre: string
          slug: string
          plan?: string
          activo?: boolean
          created_at?: string
          color_primario?: string | null
          color_acento?: string | null
          logo_url?: string | null
          logo_header_url?: string | null
          ai_enabled?: boolean
          ai_daily_limit?: number
          ai_questions_today?: number
          ai_questions_reset_at?: string | null
        }
        Update: {
          nombre?: string
          slug?: string
          plan?: string
          activo?: boolean
          color_primario?: string | null
          color_acento?: string | null
          logo_url?: string | null
          logo_header_url?: string | null
          ai_enabled?: boolean
          ai_daily_limit?: number
          ai_questions_today?: number
          ai_questions_reset_at?: string | null
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          id: string
          gimnasio_id: string
          user_id: string | null
          question: string
          tool_used: string | null
          input_tokens: number
          output_tokens: number
          estimated_cost: number
          response_time_ms: number | null
          success: boolean
          created_at: string
        }
        Insert: {
          id?: string
          gimnasio_id: string
          user_id?: string | null
          question: string
          tool_used?: string | null
          input_tokens?: number
          output_tokens?: number
          estimated_cost?: number
          response_time_ms?: number | null
          success?: boolean
          created_at?: string
        }
        Update: {
          success?: boolean
        }
        Relationships: []
      }
      solicitudes_admin: {
        Row: {
          id: string
          nombre: string
          email: string
          gimnasio_id: string
          estado: string
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          email: string
          gimnasio_id: string
          estado?: string
          created_at?: string
        }
        Update: {
          estado?: string
        }
        Relationships: []
      }
      superadmins: {
        Row: {
          user_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      gym_admins: {
        Row: {
          id: string
          user_id: string
          gimnasio_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          gimnasio_id: string
          created_at?: string
        }
        Update: {
          gimnasio_id?: string
        }
        Relationships: []
      }
      alumnos: {
        Row: {
          id: string
          nombre_completo: string
          dni: string
          whatsapp: string
          email: string | null
          fecha_nacimiento: string | null
          fecha_alta: string
          rutina_url: string | null
          fecha_vencimiento: string | null
          rutina_fecha_vencimiento: string | null
          peso: number | null
          altura: number | null
          lesiones: string | null
          objetivo: string | null
          gimnasio_id: string | null
        }
        Insert: {
          id: string
          nombre_completo: string
          dni: string
          whatsapp: string
          email?: string | null
          fecha_nacimiento?: string | null
          fecha_alta?: string
          rutina_url?: string | null
          fecha_vencimiento?: string | null
          rutina_fecha_vencimiento?: string | null
          peso?: number | null
          altura?: number | null
          lesiones?: string | null
          objetivo?: string | null
          gimnasio_id?: string | null
        }
        Update: {
          nombre_completo?: string
          dni?: string
          whatsapp?: string
          email?: string | null
          fecha_nacimiento?: string | null
          fecha_alta?: string
          rutina_url?: string | null
          fecha_vencimiento?: string | null
          rutina_fecha_vencimiento?: string | null
          peso?: number | null
          altura?: number | null
          lesiones?: string | null
          objetivo?: string | null
          gimnasio_id?: string | null
        }
        Relationships: []
      }
      comunicados: {
        Row: {
          id: string
          titulo: string
          cuerpo: string
          imagen_url: string | null
          created_at: string
          gimnasio_id: string | null
        }
        Insert: {
          id?: string
          titulo: string
          cuerpo: string
          imagen_url?: string | null
          created_at?: string
          gimnasio_id?: string | null
        }
        Update: {
          titulo?: string
          cuerpo?: string
          imagen_url?: string | null
          gimnasio_id?: string | null
        }
        Relationships: []
      }
      comentarios: {
        Row: {
          id: string
          comunicado_id: string
          alumno_id: string
          cuerpo: string
          created_at: string
        }
        Insert: {
          id?: string
          comunicado_id: string
          alumno_id: string
          cuerpo: string
          created_at?: string
        }
        Update: {
          cuerpo?: string
        }
        Relationships: []
      }
      mensajes: {
        Row: {
          id: string
          alumno_id: string
          cuerpo: string
          leido: boolean
          created_at: string
          respuesta: string | null
          respondido_at: string | null
          gimnasio_id: string | null
        }
        Insert: {
          id?: string
          alumno_id: string
          cuerpo: string
          leido?: boolean
          created_at?: string
          respuesta?: string | null
          respondido_at?: string | null
          gimnasio_id?: string | null
        }
        Update: {
          leido?: boolean
          respuesta?: string | null
          respondido_at?: string | null
          gimnasio_id?: string | null
        }
        Relationships: []
      }
      configuracion: {
        Row: {
          id: number
          facebook_url: string | null
          instagram_url: string | null
          instagram_suplementos_url: string | null
          gimnasio_id: string | null
        }
        Insert: {
          id?: number
          facebook_url?: string | null
          instagram_url?: string | null
          instagram_suplementos_url?: string | null
          gimnasio_id?: string | null
        }
        Update: {
          facebook_url?: string | null
          instagram_url?: string | null
          instagram_suplementos_url?: string | null
          gimnasio_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          nombre: string
          nombre_gimnasio: string | null
          email: string
          whatsapp: string
          plan_interes: string | null
          mensaje: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          nombre_gimnasio?: string | null
          email: string
          whatsapp: string
          plan_interes?: string | null
          mensaje?: string | null
          created_at?: string
        }
        Update: {
          nombre?: string
          nombre_gimnasio?: string | null
          email?: string
          whatsapp?: string
          plan_interes?: string | null
          mensaje?: string | null
        }
        Relationships: []
      }
      mensajes_admin: {
        Row: {
          id: string
          alumno_id: string
          cuerpo: string
          leido: boolean
          created_at: string
          gimnasio_id: string | null
        }
        Insert: {
          id?: string
          alumno_id: string
          cuerpo: string
          leido?: boolean
          created_at?: string
          gimnasio_id?: string | null
        }
        Update: {
          leido?: boolean
          gimnasio_id?: string | null
        }
        Relationships: []
      }
      asistencias: {
        Row: {
          id: string
          alumno_id: string
          gimnasio_id: string
          fecha: string
          checked_in_at: string
          tipo: string
        }
        Insert: {
          id?: string
          alumno_id: string
          gimnasio_id: string
          fecha?: string
          checked_in_at?: string
          tipo?: string
        }
        Update: {
          tipo?: string
        }
        Relationships: []
      }
      cobros: {
        Row: {
          id: string
          alumno_id: string
          gimnasio_id: string
          monto: number
          fecha: string
          metodo: string
          notas: string | null
          estado: string
          motivo_anulacion: string | null
          anulado_por: string | null
          anulado_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          alumno_id: string
          gimnasio_id: string
          monto: number
          fecha?: string
          metodo?: string
          notas?: string | null
          estado?: string
          motivo_anulacion?: string | null
          anulado_por?: string | null
          anulado_at?: string | null
          created_at?: string
        }
        Update: {
          monto?: number
          fecha?: string
          metodo?: string
          notas?: string | null
          estado?: string
          motivo_anulacion?: string | null
          anulado_por?: string | null
          anulado_at?: string | null
        }
        Relationships: []
      }
      alumnos_externos: {
        Row: {
          id: string
          gimnasio_id: string
          nombre_completo: string
          dni: string | null
          whatsapp: string | null
          email: string | null
          fecha_nacimiento: string | null
          fecha_alta: string
          fecha_vencimiento: string | null
          alumno_id: string | null
        }
        Insert: {
          id?: string
          gimnasio_id: string
          nombre_completo: string
          dni?: string | null
          whatsapp?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          fecha_alta?: string
          fecha_vencimiento?: string | null
          alumno_id?: string | null
        }
        Update: {
          nombre_completo?: string
          dni?: string | null
          whatsapp?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          fecha_vencimiento?: string | null
          alumno_id?: string | null
        }
        Relationships: []
      }
      asistencias_externas: {
        Row: {
          id: string
          alumno_externo_id: string
          gimnasio_id: string
          fecha: string
          checked_in_at: string
        }
        Insert: {
          id?: string
          alumno_externo_id: string
          gimnasio_id: string
          fecha: string
          checked_in_at?: string
        }
        Update: {
          fecha?: string
        }
        Relationships: []
      }
      cobros_externos: {
        Row: {
          id: string
          alumno_externo_id: string
          gimnasio_id: string
          monto: number
          fecha: string
          metodo: string
          notas: string | null
          estado: string
          motivo_anulacion: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          alumno_externo_id: string
          gimnasio_id: string
          monto: number
          fecha?: string
          metodo?: string
          notas?: string | null
          estado?: string
          motivo_anulacion?: string | null
          created_at?: string | null
        }
        Update: {
          monto?: number
          fecha?: string
          metodo?: string
          notas?: string | null
          estado?: string
          motivo_anulacion?: string | null
        }
        Relationships: []
      }
      alias_alumnos_externos: {
        Row: {
          id: string
          gimnasio_id: string
          alumno_externo_id: string
          alias: string
          origen: string
          created_at: string
        }
        Insert: {
          id?: string
          gimnasio_id: string
          alumno_externo_id: string
          alias: string
          origen?: string
          created_at?: string
        }
        Update: {
          alias?: string
          origen?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Alumno = Database['public']['Tables']['alumnos']['Row']
export type Comunicado = Database['public']['Tables']['comunicados']['Row']
export type Comentario = Database['public']['Tables']['comentarios']['Row']
export type Mensaje = Database['public']['Tables']['mensajes']['Row']
export type MensajeAdmin = Database['public']['Tables']['mensajes_admin']['Row']
export type Gimnasio = Database['public']['Tables']['gimnasios']['Row']
export type GymAdmin = Database['public']['Tables']['gym_admins']['Row']
export type Asistencia = Database['public']['Tables']['asistencias']['Row']
export type Cobro = Database['public']['Tables']['cobros']['Row']
export type AlumnoExterno = Database['public']['Tables']['alumnos_externos']['Row']
export type AsistenciaExterna = Database['public']['Tables']['asistencias_externas']['Row']
export type AliasAlumnoExterno = Database['public']['Tables']['alias_alumnos_externos']['Row']
