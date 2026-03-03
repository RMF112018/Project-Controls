export type EnvironmentTier = 'dev' | 'vetting' | 'prod';

export interface IEnvironmentConfig {
  currentTier: EnvironmentTier;
  label: string;
  color: string;
  isReadOnly: boolean;
  promotionHistory?: IPromotionRecord[];
}

export interface IPromotionRecord {
  fromTier: EnvironmentTier;
  toTier: EnvironmentTier;
  promotedBy: string;
  promotedDate: string;
  templateCount: number;
}
