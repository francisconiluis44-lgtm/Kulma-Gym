export type Plan = 'basico' | 'pro' | 'premium'

const PLAN_RANK: Record<Plan, number> = { basico: 0, pro: 1, premium: 2 }

const FEATURE_MIN_PLAN: Record<string, Plan> = {
  asistencias: 'pro',
  dashboard_ejecutivo: 'premium',
}

const PLAN_ALUMNOS_LIMIT: Record<Plan, number> = {
  basico: 50,
  pro: 200,
  premium: Infinity,
}

export const PLAN_LABELS: Record<Plan, string> = {
  basico: 'Esencial',
  pro: 'Pro',
  premium: 'Premium',
}

export function canUse(gymPlan: string, feature: string): boolean {
  const minPlan = FEATURE_MIN_PLAN[feature]
  if (!minPlan) return true
  return (PLAN_RANK[gymPlan as Plan] ?? 0) >= PLAN_RANK[minPlan]
}

export function getAlumnosLimit(plan: string): number {
  return PLAN_ALUMNOS_LIMIT[plan as Plan] ?? 50
}

export function getRequiredPlanLabel(feature: string): string {
  const minPlan = FEATURE_MIN_PLAN[feature]
  return minPlan ? PLAN_LABELS[minPlan] : ''
}
