import { createLazyRoute } from '@tanstack/react-router';
import { PermitsLogPage } from '../../../components/pages/project/PermitsLogPage';

export const Route = createLazyRoute('/operations/permits-log')({
  component: PermitsLogPage,
});
