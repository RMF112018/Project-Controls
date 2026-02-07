import { useAppContext } from '../contexts/AppContext';

export function usePermission(permission: string): boolean {
  const { hasPermission } = useAppContext();
  return hasPermission(permission);
}

export function useFeatureFlag(featureName: string): boolean {
  const { isFeatureEnabled } = useAppContext();
  return isFeatureEnabled(featureName);
}
