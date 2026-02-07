import { RoleName } from './enums';

export interface IFeatureFlag {
  id: number;
  FeatureName: string;
  Enabled: boolean;
  EnabledForRoles?: RoleName[];
  TargetDate?: string;
  Notes?: string;
}
