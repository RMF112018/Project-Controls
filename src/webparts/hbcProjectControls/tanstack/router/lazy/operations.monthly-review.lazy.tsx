import { createLazyRoute } from '@tanstack/react-router';
import { MonthlyProjectReview } from '../../../components/pages/project/MonthlyProjectReview';

export const Route = createLazyRoute('/operations/monthly-review')({
  component: MonthlyProjectReview,
});
