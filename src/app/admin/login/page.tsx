import { getGymContext } from '@/lib/gym-context'
import LoginForm from './LoginForm'

export default async function AdminLoginPage() {
  const gym = await getGymContext()
  return <LoginForm gymNombre={gym.nombre} />
}
