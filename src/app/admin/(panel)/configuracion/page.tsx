import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminSession } from '@/lib/admin-auth'
import ConfigForm from './ConfigForm'
import ColoresForm from './ColoresForm'
import LogoForm from './LogoForm'
import CambiarPasswordForm from './CambiarPasswordForm'

export default async function ConfiguracionPage() {
  const { gimnasioId } = await getAdminSession()
  const adminSupabase = createAdminClient()

  const [{ data: config }, { data: gimnasio }] = await Promise.all([
    adminSupabase
      .from('configuracion')
      .select('*')
      .eq('gimnasio_id', gimnasioId)
      .maybeSingle(),
    adminSupabase
      .from('gimnasios')
      .select('color_primario, color_acento, logo_url, logo_header_url')
      .eq('id', gimnasioId)
      .single(),
  ])

  return (
    <div className="space-y-10 max-w-lg">
      <div>
        <h2 className="text-2xl font-heading font-extrabold text-navy">Configuración</h2>
        <p className="text-sm text-navy/50 font-body mt-1">
          Personalizá tu gimnasio y gestioná tu cuenta.
        </p>
      </div>

      {/* ── Redes sociales ── */}
      <section className="space-y-3">
        <h3 className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase">
          Redes sociales
        </h3>
        <ConfigForm
          facebook_url={config?.facebook_url ?? null}
          instagram_url={config?.instagram_url ?? null}
          instagram_suplementos_url={config?.instagram_suplementos_url ?? null}
        />
      </section>

      {/* ── Apariencia ── */}
      <section className="space-y-3">
        <h3 className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase">
          Apariencia
        </h3>
        <ColoresForm
          color_primario={gimnasio?.color_primario ?? null}
          color_acento={gimnasio?.color_acento ?? null}
        />
        <LogoForm
          logoUrl={gimnasio?.logo_url ?? null}
          logoHeaderUrl={gimnasio?.logo_header_url ?? null}
        />
      </section>

      {/* ── Mi cuenta ── */}
      <section className="space-y-3">
        <h3 className="text-xs font-body font-semibold tracking-widest text-navy/40 uppercase">
          Mi cuenta
        </h3>
        <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
          <p className="text-xs font-body font-semibold tracking-widest text-orange uppercase mb-4">
            Cambiar contraseña
          </p>
          <CambiarPasswordForm />
        </div>
      </section>
    </div>
  )
}
