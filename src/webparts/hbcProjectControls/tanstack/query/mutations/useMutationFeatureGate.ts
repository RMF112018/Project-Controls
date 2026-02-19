import * as React from 'react';
import { useAppContext } from '../../../components/contexts/AppContext';
import { OPTIMISTIC_MUTATION_FLAGS } from './optimisticMutationFlags';

export function useMutationFeatureGate(domainFlag: string): boolean {
  const { isFeatureEnabled } = useAppContext();

  return React.useMemo(() => {
    if (typeof isFeatureEnabled !== 'function') {
      return false;
    }
    if (!isFeatureEnabled(OPTIMISTIC_MUTATION_FLAGS.global)) {
      return false;
    }
    return isFeatureEnabled(domainFlag);
  }, [domainFlag, isFeatureEnabled]);
}
