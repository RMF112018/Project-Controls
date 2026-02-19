import type { IBuyoutEntry, IProjectManagementPlan } from '@hbc/sp-services';

export function appendBuyoutEntryOptimistic(entries: IBuyoutEntry[], entry: IBuyoutEntry): IBuyoutEntry[] {
  return [...entries, entry].sort((a, b) => a.divisionCode.localeCompare(b.divisionCode));
}

export function replaceBuyoutEntryOptimistic(
  entries: IBuyoutEntry[],
  entryId: number,
  patch: Partial<IBuyoutEntry>
): IBuyoutEntry[] {
  return entries.map((entry) => (entry.id === entryId ? { ...entry, ...patch } : entry));
}

export function removeBuyoutEntryOptimistic(entries: IBuyoutEntry[], entryId: number): IBuyoutEntry[] {
  return entries.filter((entry) => entry.id !== entryId);
}

export function mergePmpOptimistic(
  current: IProjectManagementPlan | null,
  patch: Partial<IProjectManagementPlan>
): IProjectManagementPlan | null {
  if (!current) {
    return current;
  }

  const nextBoilerplate = patch.boilerplate
    ? current.boilerplate.map((section) =>
      patch.boilerplate?.find((candidate) => candidate.sectionNumber === section.sectionNumber) ?? section
    )
    : current.boilerplate;

  return {
    ...current,
    ...patch,
    boilerplate: nextBoilerplate,
    lastUpdatedAt: new Date().toISOString(),
  };
}
