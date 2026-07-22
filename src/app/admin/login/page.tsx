import { getGymContext } from '@/lib/gym-context'
import LoginForm from './LoginForm'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const gym = await getGymContext()
  const { code } = await searchParams
  return <LoginForm gymNombre={gym.nombre} code={code} />
}
