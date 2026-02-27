export interface ITurnoverSection {
  id: string;
  title: string;
  items: ProjectHubTurnoverItem[];
}

export interface ProjectHubTurnoverItem {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  responsible: 'Estimating' | 'BD' | 'PM' | 'Superintendent';
}

export interface IMilestone {
  name: string;
  plannedDate: string;
  forecastDate: string;
  status: 'Complete' | 'On Track' | 'At Risk' | 'Behind';
}
