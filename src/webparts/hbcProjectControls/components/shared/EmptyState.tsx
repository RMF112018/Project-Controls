import * as React from 'react';
import { HbcEmptyState } from './HbcEmptyState';

interface IEmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * @deprecated Use HbcEmptyState instead.
 */
export const EmptyState: React.FC<IEmptyStateProps> = ({ title, description, icon, action }) => (
  <HbcEmptyState title={title} description={description} icon={icon}>
    {action}
  </HbcEmptyState>
);
