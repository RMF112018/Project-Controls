import * as React from 'react';
import { useAppNavigate } from './useAppNavigate';

export function useTransitionNavigate(): (to: string, replace?: boolean) => void {
  const navigate = useAppNavigate();

  return React.useCallback((to: string, replace = false) => {
    React.startTransition(() => {
      navigate(to, { replace });
    });
  }, [navigate]);
}
