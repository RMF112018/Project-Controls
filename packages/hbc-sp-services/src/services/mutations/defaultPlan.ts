import type { IMutationDescriptor, MutationMethodKey } from './types';

export function createDefaultMutationDescriptor(method: MutationMethodKey): IMutationDescriptor {
  return {
    method,
    domain: 'unknown',
    optimisticStrategy: 'none',
    invalidation: {
      queryFamilies: [],
      cacheTags: [],
      cachePrefixes: [],
      projectScoped: false,
    },
  };
}
