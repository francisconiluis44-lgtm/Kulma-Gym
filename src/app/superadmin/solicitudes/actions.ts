'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSuperadminSession } from '@/lib/superadmin-auth'
import { revalidatePath } from 'next/cache'

export async function aprobarSolicitud(
  id: string,
  email: string,
  gimnasioId: string,
): Promise<{ error: string | null }> {
  await getSuperadminSession()
  const adminSupabase = createAdminClient()

  const [{ data: gymData }, { data: solicitud }] = await Promise.all([
    adminSupabase.from('gimnasios').select('slug, nombre').eq('id', gimnasioId).single(),
    adminSupabase.from('solicitudes_admin').select('nombre').eq('id', id).single(),
  ])

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://simplegym.fit'
  const adminUrl = gymData?.slug
    ? `${baseUrl.replace('simplegym.fit', `${gymData.slug}.simplegym.fit`)}/admin`
    : `${baseUrl}/admin`
  const inviteRedirectTo = adminUrl + '/login'

  // Find existing user (paginate to avoid 50-user default limit)
  const { data: usersData } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
  let userId = usersData?.users?.find((u) => u.email === email)?.id

  if (!userId) {
    const { data: invited, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: inviteRedirectTo,
      data: {
        nombre_admin: solicitud?.nombre ?? '',
        email_admin: email,
        gimnasio_nombre: gymData?.nombre ?? '',
        admin_url: adminUrl,
      },
    })
    if (inviteError) {
      return { error: `Error al enviar la invitación: ${inviteError.message}` }
    }
    userId = invited?.user?.id
  }

  if (!userId) {
    return { error: `No se pudo crear el usuario para ${email}` }
  }

  // Upsert to avoid duplicate key if gym_admins row already exists
  const { error: gaError } = await adminSupabase
    .from('gym_admins')
    .upsert({ user_id: userId, gimnasio_id: gimnasioId }, { onConflict: 'user_id,gimnasio_id' })

  if (gaError) {
    return { error: `Error al asignar admin: ${gaError.message}` }
  }

  await adminSupabase.from('solicitudes_admin').update({ estado: 'aprobado' }).eq('id', id)

  revalidatePath('/superadmin/solicitudes')
  return { error: null }
}

export async function rechazarSolicitud(id: string) {
  await getSuperadminSession()
  const adminSupabase = createAdminClient()
  await adminSupabase.from('solicitudes_admin').update({ estado: 'rechazado' }).eq('id', id)
  revalidatePath('/superadmin/solicitudes')
}
