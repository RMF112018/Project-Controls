export type HelpGuideType = 'walkthrough' | 'tooltip' | 'article' | 'video';

export interface IHelpGuide {
  id: number;
  moduleKey: string;
  title: string;
  content: string;
  guideType: HelpGuideType;
  sortOrder: number;
  targetSelector?: string;
  videoUrl?: string;
  isActive: boolean;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface ISupportConfig {
  supportEmail: string;
  supportPhone?: string;
  knowledgeBaseUrl?: string;
  feedbackFormUrl?: string;
  responseTimeHours?: number;
}
