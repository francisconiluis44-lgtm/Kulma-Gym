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
        }
        Insert: {
          id?: string
          nombre: string
          slug: string
          plan?: string
          activo?: boolean
          created_at?: string
        }
        Update: {
          nombre?: string
          slug?: string
          plan?: string
          activo?: boolean
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
