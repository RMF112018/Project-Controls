import { RoleName } from './enums';

export type FeatureFlagCategory =
  | 'Core Platform'
  | 'Preconstruction'
  | 'Project Execution'
  | 'Infrastructure'
  | 'Integrations';

export interface IFeatureFlag {
  id: number;
  FeatureName: string;
  DisplayName: string;
  Enabled: boolean;
  EnabledForRoles?: RoleName[];
  TargetDate?: string;
  Notes?: string;
  Category?: FeatureFlagCategory;
}
