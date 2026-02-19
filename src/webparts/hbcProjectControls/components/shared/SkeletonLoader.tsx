import * as React from 'react';
import { HbcSkeleton } from './HbcSkeleton';

type SkeletonVariant = 'table' | 'kpi-grid' | 'form' | 'card' | 'text';

interface ISkeletonLoaderProps {
  variant: SkeletonVariant;
  rows?: number;
  columns?: number;
  /**
   * @deprecated Legacy prop retained for compatibility and ignored by design-system skeleton.
   */
  style?: React.CSSProperties;
}

export const SkeletonLoader: React.FC<ISkeletonLoaderProps> = ({ variant, rows, columns }) => (
  <HbcSkeleton variant={variant} rows={rows} columns={columns} />
);
