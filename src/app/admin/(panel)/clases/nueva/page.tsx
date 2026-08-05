import { getAdminSession } from '@/lib/admin-auth'
import { canUse, getRequiredPlanLabel } from '@/lib/plan-features'
import UpgradeGate from '@/components/UpgradeGate'
import NuevaClaseForm from '../NuevaClaseForm'
import Link from 'next/link'

export default async function NuevaClasePage() {
  const { plan } = await getAdminSession()

  if (!canUse(plan, 'clases')) {
    return <UpgradeGate requiredPlan={getRequiredPlanLabel('clases')} />
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/clases" className="text-navy/40 hover:text-navy transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-2xl font-heading font-extrabold text-navy">Nueva clase</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm px-6 py-6">
        <NuevaClaseForm />
      </div>
    </div>
  )
}
