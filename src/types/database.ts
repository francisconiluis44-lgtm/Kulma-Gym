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
        }
        Insert: {
          id: string
          nombre_completo: string
          dni: string
          whatsapp: string
          email?: string | null
          fecha_nacimiento?: string | null
          fecha_alta?: string
        }
        Update: {
          nombre_completo?: string
          dni?: string
          whatsapp?: string
          email?: string | null
          fecha_nacimiento?: string | null
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
