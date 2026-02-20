import { redirect } from '@tanstack/react-router';

export function requireProject(projectId?: string | null): void {
  if (!projectId) {
    throw redirect({ to: '/operations', replace: true });
  }
}
