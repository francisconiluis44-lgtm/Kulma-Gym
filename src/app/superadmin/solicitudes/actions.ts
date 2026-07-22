'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSuperadminSession } from '@/lib/superadmin-auth'
import { revalidatePath } from 'next/cache'

export async function aprobarSolicitud(id: string, email: string, gimnasioId: string) {
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
  // Invite link must land on the login page so the auth hash is processed
  // before the server tries to check the session
  const inviteRedirectTo = adminUrl + '/login'

  // Find or invite the user
  const { data: usersData } = await adminSupabase.auth.admin.listUsers()
  let userId = usersData?.users?.find((u) => u.email === email)?.id

  if (!userId) {
    // User doesn't exist — send invitation email
    const { data: invited } = await adminSupabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: inviteRedirectTo,
      data: {
        nombre_admin: solicitud?.nombre ?? '',
        email_admin: email,
        gimnasio_nombre: gymData?.nombre ?? '',
        admin_url: adminUrl,
      },
    })
    userId = invited?.user?.id
  }

  if (!userId) {
    throw new Error(`No se pudo crear el usuario para ${email}`)
  }

  await Promise.all([
    adminSupabase.from('gym_admins').insert({ user_id: userId, gimnasio_id: gimnasioId }).select(),
    adminSupabase.from('solicitudes_admin').update({ estado: 'aprobado' }).eq('id', id),
  ])

  revalidatePath('/superadmin/solicitudes')
}

export async function rechazarSolicitud(id: string) {
  await getSuperadminSession()
  const adminSupabase = createAdminClient()
  await adminSupabase.from('solicitudes_admin').update({ estado: 'rechazado' }).eq('id', id)
  revalidatePath('/superadmin/solicitudes')
}
