export const PROJECT_RECORD_CONTRACT_TYPES = [
  'AIA Docs',
  'Consensus Docs',
  'Construction Manager',
  'Cost Plus with GMP',
  'Cost Plus without GMP',
  'Lump Sum',
  'Purchase Order',
  'Stipulated Sum',
  'Time & Material',
] as const;

export const PROJECT_RECORD_DELIVERY_METHODS = [
  'Construction Manager',
  'Design Build',
  'Fast Track',
  'General Contractor',
  'Owner\'s Representative',
  'P3',
  'Preconstruction',
  'Program Manager',
] as const;

export interface IMarketingProjectRecord {
  // Section 1: Project Info
  projectName: string;
  projectCode: string;
  leadId: number | null;
  contractType: string[];
  deliveryMethod: string;
  architect: string;
  landscapeArchitect: string;
  interiorDesigner: string;
  engineer: string;

  // Section 2: Description
  buildingSystemType: string;
  projectDescription: string;
  uniqueCharacteristics: string;
  renderingUrls: string[];
  finalPhotoUrls: string[];

  // Section 3: Budget
  contractBudget: number | null;
  contractFinalCost: number | null;
  totalCostPerGSF: number | null;
  totalBudgetVariance: number | null;
  budgetExplanation: string;
  CO_OwnerDirected_Count: number | null;
  CO_OwnerDirected_Value: number | null;
  CO_MunicipalityDirected_Count: number | null;
  CO_MunicipalityDirected_Value: number | null;
  CO_EO_Count: number | null;
  CO_EO_Value: number | null;
  CO_ContractorDirected_Count: number | null;
  savingsReturned: number | null;
  savingsReturnedPct: number | null;

  // Section 4: Schedule
  scheduleStartAnticipated: string | null;
  scheduleStartActual: string | null;
  scheduleEndAnticipated: string | null;
  scheduleEndActual: string | null;
  onSchedule: string;
  scheduleExplanation: string;
  substantialCompletionDate: string | null;
  finalCompletionDate: string | null;

  // Section 5: QC
  punchListItems: number | null;
  punchListDaysToComplete: number | null;

  // Section 6: Safety
  innovativeSafetyPrograms: string;

  // Section 7: Supplier Diversity
  mwbeRequirement: string;
  mwbeAchievement: string;
  sbeRequirement: string;
  sbeAchievement: string;
  localRequirement: string;
  localAchievement: string;

  // Section 8: Sustainability
  leedDesignation: string;
  sustainabilityFeatures: string;
  leedAdditionalCost: number | null;

  // Section 9: Case Study
  CS_Conflicts: string;
  CS_CostControl: string;
  CS_ValueEngineering: string;
  CS_QualityControl: string;
  CS_Schedule: string;
  CS_Team: string;
  CS_Safety: string;
  CS_LEED: string;
  CS_SupplierDiversity: string;
  CS_Challenges: string;
  CS_InnovativeSolutions: string;
  CS_ProductsSystems: string;
  CS_ClientService: string;
  CS_LessonsLearned: string;

  // Meta
  sectionCompletion: Record<string, number>;
  overallCompletion: number;
  lastUpdatedBy: string;
  lastUpdatedAt: string;
  createdBy: string;
  createdAt: string;
}

export interface IProjectRecordSection {
  key: string;
  label: string;
  order: number;
}

export const PROJECT_RECORD_SECTIONS: IProjectRecordSection[] = [
  { key: 'projectInfo', label: 'Project Information', order: 1 },
  { key: 'description', label: 'Project Description', order: 2 },
  { key: 'budget', label: 'Budget & Cost', order: 3 },
  { key: 'schedule', label: 'Schedule', order: 4 },
  { key: 'qc', label: 'Quality Control', order: 5 },
  { key: 'safety', label: 'Safety', order: 6 },
  { key: 'supplierDiversity', label: 'Supplier Diversity', order: 7 },
  { key: 'sustainability', label: 'Sustainability', order: 8 },
  { key: 'caseStudy', label: 'Case Study', order: 9 },
];

export const OPS_EDITABLE_SECTIONS = ['budget', 'schedule', 'qc', 'safety', 'supplierDiversity'];
