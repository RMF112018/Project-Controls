import { createLazyRoute } from '@tanstack/react-router';
import { ProjectRecord } from '../../../components/pages/project/ProjectRecord';

export const Route = createLazyRoute('/operations/project-record')({
  component: ProjectRecord,
});
