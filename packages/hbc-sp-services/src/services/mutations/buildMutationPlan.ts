import { createDefaultMutationDescriptor } from './defaultPlan';
import { waveAMutationCatalog } from './mutationCatalog';
import type { IMutationDescriptor, MutationMethodKey } from './types';

export function getWaveAMutationDescriptor(method: MutationMethodKey): IMutationDescriptor {
  return waveAMutationCatalog[method] ?? createDefaultMutationDescriptor(method);
}

export function hasWaveAMutationDescriptor(method: MutationMethodKey): boolean {
  return Boolean(waveAMutationCatalog[method]);
}
