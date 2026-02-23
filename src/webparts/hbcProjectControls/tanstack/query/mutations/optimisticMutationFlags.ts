export const OPTIMISTIC_MUTATION_FLAGS = {
  global: 'OptimisticMutationsEnabled',
  leads: 'OptimisticMutations_Leads',
  estimating: 'OptimisticMutations_Estimating',
  buyout: 'OptimisticMutations_Buyout',
  pmp: 'OptimisticMutations_PMP',
  // Wave 2
  gonogo: 'OptimisticMutations_GoNoGo',
  schedule: 'OptimisticMutations_Schedule',
  riskCost: 'OptimisticMutations_RiskCost',
  monthlyReview: 'OptimisticMutations_MonthlyReview',
  connectors: 'ConnectorMutationResilience',
} as const;

export type OptimisticMutationFlagDomain = keyof typeof OPTIMISTIC_MUTATION_FLAGS;
