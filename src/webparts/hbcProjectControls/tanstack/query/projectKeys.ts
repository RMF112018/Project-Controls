export type ProjectIdentifier = string;

export function getProjectQueryKey(projectId: ProjectIdentifier | null): readonly ['project', string] {
  return ['project', projectId ?? 'none'] as const;
}

