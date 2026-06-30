export type Database = {
  public: {
    Tables: {
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
        }
        Update: {
          nombre_completo?: string
          dni?: string
          whatsapp?: string
          email?: string | null
          fecha_nacimiento?: string | null
          rutina_url?: string | null
          fecha_vencimiento?: string | null
          rutina_fecha_vencimiento?: string | null
        }
        Relationships: []
      }
      comunicados: {
        Row: {
          id: string
          titulo: string
          cuerpo: string
          created_at: string
        }
        Insert: {
          id?: string
          titulo: string
          cuerpo: string
          created_at?: string
        }
        Update: {
          titulo?: string
          cuerpo?: string
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
        }
        Insert: {
          id?: string
          alumno_id: string
          cuerpo: string
          leido?: boolean
          created_at?: string
          respuesta?: string | null
          respondido_at?: string | null
        }
        Update: {
          leido?: boolean
          respuesta?: string | null
          respondido_at?: string | null
        }
        Relationships: []
      }
      configuracion: {
        Row: {
          id: number
          facebook_url: string | null
          instagram_url: string | null
          instagram_suplementos_url: string | null
        }
        Insert: {
          id?: number
          facebook_url?: string | null
          instagram_url?: string | null
          instagram_suplementos_url?: string | null
        }
        Update: {
          facebook_url?: string | null
          instagram_url?: string | null
          instagram_suplementos_url?: string | null
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
        }
        Insert: {
          id?: string
          alumno_id: string
          cuerpo: string
          leido?: boolean
          created_at?: string
        }
        Update: {
          leido?: boolean
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
