export interface ProjectHubLessonLearned {
  id: string;
  category: 'Estimating' | 'Scope' | 'Market' | 'Process';
  finding: string;
  recommendation: string;
  impact: 'High' | 'Medium' | 'Low';
}
