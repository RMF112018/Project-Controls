export const OPTIMISTIC_MUTATION_FLAGS = {
  global: 'OptimisticMutationsEnabled',
  leads: 'OptimisticMutations_Leads',
  estimating: 'OptimisticMutations_Estimating',
  buyout: 'OptimisticMutations_Buyout',
  pmp: 'OptimisticMutations_PMP',
} as const;

export type OptimisticMutationFlagDomain = keyof typeof OPTIMISTIC_MUTATION_FLAGS;
