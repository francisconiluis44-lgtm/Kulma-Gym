import { createAdminClient } from '@/lib/supabase/admin'
import ConfigForm from './ConfigForm'

export default async function ConfiguracionPage() {
  const adminSupabase = createAdminClient()
  const { data: config } = await adminSupabase
    .from('configuracion')
    .select('*')
    .eq('id', 1)
    .single()

  return (
    <>
      <h2 className="text-2xl font-heading font-bold text-navy mb-2">Configuración</h2>
      <p className="text-sm text-navy/50 font-body mb-6">
        Links de redes sociales que se muestran a los alumnos en el dashboard.
      </p>

      <ConfigForm
        facebook_url={config?.facebook_url ?? null}
        instagram_url={config?.instagram_url ?? null}
        instagram_suplementos_url={config?.instagram_suplementos_url ?? null}
      />
    </>
  )
}
