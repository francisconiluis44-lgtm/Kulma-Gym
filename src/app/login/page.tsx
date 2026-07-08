import { getGymContext, studentEmailDomain } from '@/lib/gym-context'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const gym = await getGymContext()
  const emailDomain = studentEmailDomain(gym.slug)
  return (
    <LoginForm
      gymNombre={gym.nombre}
      logoUrl={gym.logo_url}
      emailDomain={emailDomain}
    />
  )
}
