export interface IChangeOrder {
  number: string;
  description: string;
  amount: number;
  status: 'Approved' | 'Pending' | 'Rejected';
  submittedDate: string;
}

export interface IRiskItem {
  description: string;
  likelihood: 'High' | 'Medium' | 'Low';
  impact: string;
  mitigation: string;
}

export type SectionStatus = 'On Track' | 'Attention' | 'At Risk';

export interface IReviewSection {
  title: string;
  status: SectionStatus;
  items: { label: string; value: string }[];
  commentary: string;
}

export type OverallRating = 'Excellent' | 'Good' | 'Satisfactory' | 'Needs Improvement' | 'Poor';

export interface IScorecardEntry {
  id: string;
  subcontractor: string;
  trade: string;
  safety: number;
  quality: number;
  schedule: number;
  cooperation: number;
  overall: number;
  rating: OverallRating;
  lastReviewed: string;
}
