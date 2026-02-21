import { createLazyRoute } from '@tanstack/react-router';
import { ConstraintsLogPage } from '../../../components/pages/project/ConstraintsLogPage';

export const Route = createLazyRoute('/operations/constraints-log')({
  component: ConstraintsLogPage,
});
