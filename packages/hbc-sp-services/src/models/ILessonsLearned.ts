export type LessonCategory = 'Cost' | 'Schedule' | 'Quality' | 'Safety' | 'Communication' | 'Subcontractor' | 'Design' | 'Client' | 'Preconstruction' | 'Other';
export type LessonImpact = 'Positive' | 'Negative' | 'Neutral';

export interface ILessonLearned {
  id: number;
  projectCode: string;
  title: string;
  category: LessonCategory;
  impact: LessonImpact;
  description: string;
  recommendation: string;
  raisedBy: string;
  raisedDate: string;
  phase: string;
  isIncludedInFinalRecord: boolean;
  tags: string[];
}
