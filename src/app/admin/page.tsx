import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email?.endsWith('@kulmagym.app')) {
    redirect('/admin/login')
  }

  const adminSupabase = createAdminClient()
  const { data: alumnos } = await adminSupabase
    .from('alumnos')
    .select('nombre_completo, dni, whatsapp, fecha_alta')
    .order('fecha_alta', { ascending: false })

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy px-4 py-4 shadow-lg">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-heading font-extrabold text-white leading-none">
              KULMA GYM
            </h1>
            <span className="text-xs text-orange font-body font-semibold tracking-wide">
              PANEL ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 font-body hidden sm:block truncate max-w-[180px]">
              {user.email}
            </span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-4 py-1.5 rounded-xl transition-all font-body"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-baseline gap-3">
          <h2 className="text-2xl font-heading font-bold text-navy">
            Alumnos registrados
          </h2>
          <span className="text-sm text-navy/50 font-body">
            {alumnos?.length ?? 0} en total
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {!alumnos || alumnos.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-navy/40 font-body text-sm">
                No hay alumnos registrados todavía.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy text-white">
                    <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">
                      Nombre completo
                    </th>
                    <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">
                      DNI
                    </th>
                    <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm hidden sm:table-cell">
                      WhatsApp
                    </th>
                    <th className="px-5 py-3.5 text-left font-heading font-semibold text-sm">
                      Fecha de alta
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alumnos.map((alumno) => (
                    <tr
                      key={alumno.dni}
                      className="hover:bg-cream/60 transition-colors"
                    >
                      <td className="px-5 py-4 font-body font-medium text-navy">
                        {alumno.nombre_completo}
                      </td>
                      <td className="px-5 py-4 font-body text-navy/70 tabular-nums">
                        {alumno.dni}
                      </td>
                      <td className="px-5 py-4 font-body text-navy/60 hidden sm:table-cell">
                        {alumno.whatsapp}
                      </td>
                      <td className="px-5 py-4 font-body text-navy/50 text-xs tabular-nums">
                        {new Date(alumno.fecha_alta).toLocaleDateString(
                          'es-AR',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
