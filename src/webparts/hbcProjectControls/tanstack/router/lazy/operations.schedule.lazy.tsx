import { createLazyRoute } from '@tanstack/react-router';
import { SchedulePage } from '../../../components/pages/project/SchedulePage';

export const Route = createLazyRoute('/operations/schedule')({
  component: SchedulePage,
});
