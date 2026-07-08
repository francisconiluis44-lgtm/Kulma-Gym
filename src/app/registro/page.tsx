import { getGymContext, studentEmailDomain } from '@/lib/gym-context'
import RegistroForm from './RegistroForm'

export default async function RegistroPage() {
  const gym = await getGymContext()
  const emailDomain = studentEmailDomain(gym.slug)
  return <RegistroForm gymNombre={gym.nombre} emailDomain={emailDomain} />
}
