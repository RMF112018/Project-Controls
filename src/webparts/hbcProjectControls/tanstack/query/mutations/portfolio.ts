import type { MutationFunction } from '@tanstack/react-query';
import type { IDataService } from '@hbc/sp-services';

export function makeSyncProjectMutation(dataService: IDataService): MutationFunction<void, { projectCode: string }> {
  return async ({ projectCode }) => {
    await dataService.syncActiveProject(projectCode);
  };
}

export function makePortfolioSyncMutation(dataService: IDataService): MutationFunction<void, void> {
  return async () => {
    await dataService.triggerPortfolioSync();
  };
}
