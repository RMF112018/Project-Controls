export interface ISuperintendentPlanSection {
  id: number;
  sectionKey: string;
  sectionTitle: string;
  content: string;
  attachmentUrls: string[];
  isComplete: boolean;
}

export interface ISuperintendentPlan {
  id: number;
  projectCode: string;
  superintendentName: string;
  sections: ISuperintendentPlanSection[];
  createdBy: string;
  createdAt: string;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
}

export interface ISuperintendentPlanSectionDef {
  key: string;
  title: string;
  guidance: string;
}

export const SUPERINTENDENT_PLAN_SECTIONS: ISuperintendentPlanSectionDef[] = [
  { key: 'siteLogistics', title: 'Site Logistics', guidance: 'Describe the overall site logistics plan including laydown areas, staging, access points, and material storage.' },
  { key: 'safetyPlan', title: 'Safety Plan', guidance: 'Outline the project-specific safety plan, hazard assessments, and safety meeting schedule.' },
  { key: 'utilityServices', title: 'Utility Services', guidance: 'Document all temporary and permanent utility connections and service coordination.' },
  { key: 'trafficPedestrian', title: 'Traffic & Pedestrian', guidance: 'Detail traffic control plans, pedestrian routes, and MOT requirements.' },
  { key: 'siteSecurity', title: 'Site Security', guidance: 'Describe fencing, access control, cameras, and after-hours security measures.' },
  { key: 'environmentalControls', title: 'Environmental Controls', guidance: 'Document erosion control, SWPPP compliance, dust mitigation, and noise control.' },
  { key: 'existingConditions', title: 'Existing Conditions', guidance: 'Record existing site conditions, underground utilities, and pre-construction surveys.' },
  { key: 'phasingPlan', title: 'Phasing Plan', guidance: 'Describe construction phasing, sequencing, and milestone targets.' },
  { key: 'crewCoordination', title: 'Crew Coordination', guidance: 'Detail self-perform crew plans, subcontractor coordination, and manpower loading.' },
  { key: 'additionalPlans', title: 'Additional Plans', guidance: 'Any additional project-specific plans not covered in other sections.' },
];
