import type { IDataService } from '../IDataService';

export type MutationMethodKey = keyof IDataService;

export type MutationDomain =
  | 'leads'
  | 'estimating'
  | 'buyout'
  | 'pmp'
  | 'unknown';

export type OptimisticStrategy =
  | 'none'
  | 'append'
  | 'replaceById'
  | 'removeById'
  | 'merge';

export interface IMutationInvalidationPlan {
  queryFamilies: readonly string[];
  cacheTags: readonly string[];
  cachePrefixes: readonly string[];
  projectScoped: boolean;
}

export interface IMutationDescriptor {
  method: MutationMethodKey;
  domain: MutationDomain;
  optimisticStrategy: OptimisticStrategy;
  invalidation: IMutationInvalidationPlan;
}
