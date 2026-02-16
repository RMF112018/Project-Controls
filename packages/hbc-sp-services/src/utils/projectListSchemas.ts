/**
 * Project List Schemas — Provisioning definitions for project-site lists.
 *
 * These schemas define the SharePoint list structures created during
 * site provisioning. Field types are derived from columnMappings.ts comments.
 *
 * Template types: 100 = GenericList, 101 = DocumentLibrary
 */
import { IProjectListSchema, IFieldDefinition } from '../models/IProvisioningLog';

// --- Field builder helpers ---

function text(internalName: string, displayName: string, opts?: { required?: boolean; indexed?: boolean }): IFieldDefinition {
  return { internalName, displayName, fieldType: 'Text', ...opts };
}

function note(internalName: string, displayName: string): IFieldDefinition {
  return { internalName, displayName, fieldType: 'Note' };
}

function num(internalName: string, displayName: string, opts?: { required?: boolean; indexed?: boolean }): IFieldDefinition {
  return { internalName, displayName, fieldType: 'Number', ...opts };
}

function currency(internalName: string, displayName: string): IFieldDefinition {
  return { internalName, displayName, fieldType: 'Currency' };
}

function dateTime(internalName: string, displayName: string): IFieldDefinition {
  return { internalName, displayName, fieldType: 'DateTime' };
}

function bool(internalName: string, displayName: string): IFieldDefinition {
  return { internalName, displayName, fieldType: 'Boolean' };
}

function choice(internalName: string, displayName: string, choices: string[]): IFieldDefinition {
  return { internalName, displayName, fieldType: 'Choice', choices };
}

function url(internalName: string, displayName: string): IFieldDefinition {
  return { internalName, displayName, fieldType: 'URL' };
}

// --- Project-site list schemas (42 lists) ---

const PROJECT_INFO: IProjectListSchema = {
  listName: 'Project_Info',
  description: 'Project-level metadata and configuration',
  templateType: 100,
  fields: [
    text('ProjectCode', 'Project Code', { indexed: true }),
    num('LeadID', 'Lead ID'),
    url('ProjectSiteURL', 'Project Site URL'),
  ],
};

const TEAM_MEMBERS: IProjectListSchema = {
  listName: 'Team_Members',
  description: 'Project team member assignments',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('name', 'Name'),
    text('email', 'Email'),
    choice('role', 'Role', ['BD Representative', 'Estimating Coordinator', 'Accounting Manager', 'Preconstruction Team', 'Operations Team', 'Executive Leadership', 'Legal', 'Risk Management', 'Marketing', 'Quality Control', 'Safety', 'IDS', 'Department Director', 'SharePoint Admin']),
    text('department', 'Department'),
    text('phone', 'Phone'),
  ],
};

const DELIVERABLES: IProjectListSchema = {
  listName: 'Deliverables',
  description: 'Project deliverables tracking',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('name', 'Name'),
    choice('department', 'Department', []),
    text('assignedTo', 'Assigned To'),
    num('assignedToId', 'Assigned To ID'),
    choice('status', 'Status', ['Not Started', 'In Progress', 'In Review', 'Complete']),
    dateTime('dueDate', 'Due Date'),
    dateTime('completedDate', 'Completed Date'),
    note('notes', 'Notes'),
  ],
};

const ACTION_ITEMS: IProjectListSchema = {
  listName: 'Action_Items',
  description: 'Project and autopsy action items',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    num('autopsyId', 'Autopsy ID'),
    text('description', 'Description'),
    text('assignee', 'Assignee'),
    num('assigneeId', 'Assignee ID'),
    dateTime('dueDate', 'Due Date'),
    choice('status', 'Status', ['Open', 'In Progress', 'Complete']),
    dateTime('completedDate', 'Completed Date'),
  ],
};

const TURNOVER_CHECKLIST: IProjectListSchema = {
  listName: 'Turnover_Checklist',
  description: 'Turnover checklist items',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    choice('category', 'Category', ['Documents', 'Safety', 'Financial', 'Scheduling', 'Staffing', 'Subcontracts']),
    text('description', 'Description'),
    choice('status', 'Status', ['Pending', 'Complete', 'N/A']),
    text('assignedTo', 'Assigned To'),
    num('assignedToId', 'Assigned To ID'),
    bool('required', 'Required'),
    dateTime('completedDate', 'Completed Date'),
    note('notes', 'Notes'),
  ],
};

const BUYOUT_LOG: IProjectListSchema = {
  listName: 'Buyout_Log',
  description: 'Subcontractor buyout tracking and commitment approvals',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('divisionCode', 'Division Code'),
    text('divisionDescription', 'Division Description'),
    bool('isStandard', 'Is Standard'),
    currency('originalBudget', 'Original Budget'),
    currency('estimatedTax', 'Estimated Tax'),
    currency('totalBudget', 'Total Budget'),
    text('subcontractorName', 'Subcontractor Name'),
    currency('contractValue', 'Contract Value'),
    currency('overUnder', 'Over/Under'),
    bool('enrolledInSDI', 'Enrolled In SDI'),
    bool('bondRequired', 'Bond Required'),
    num('qScore', 'Q Score'),
    choice('compassPreQualStatus', 'Compass Pre-Qual Status', []),
    bool('scopeMatchesBudget', 'Scope Matches Budget'),
    bool('exhibitCInsuranceConfirmed', 'Exhibit C Insurance Confirmed'),
    bool('exhibitDScheduleConfirmed', 'Exhibit D Schedule Confirmed'),
    bool('exhibitESafetyConfirmed', 'Exhibit E Safety Confirmed'),
    choice('commitmentStatus', 'Commitment Status', ['Draft', 'PendingPM', 'PendingPX', 'PendingCFO', 'Approved', 'Rejected', 'WaiverRequired']),
    bool('waiverRequired', 'Waiver Required'),
    choice('waiverType', 'Waiver Type', ['PriceDeviation', 'QScoreDeviation', 'SoleSource', 'Other']),
    note('waiverReason', 'Waiver Reason'),
    url('compiledCommitmentPdfUrl', 'Compiled Commitment PDF URL'),
    text('compiledCommitmentFileId', 'Compiled Commitment File ID'),
    text('compiledCommitmentFileName', 'Compiled Commitment File Name'),
    text('eVerifyContractNumber', 'E-Verify Contract Number'),
    dateTime('eVerifySentDate', 'E-Verify Sent Date'),
    dateTime('eVerifyReminderDate', 'E-Verify Reminder Date'),
    dateTime('eVerifyReceivedDate', 'E-Verify Received Date'),
    choice('eVerifyStatus', 'E-Verify Status', ['Not Sent', 'Sent', 'Reminder Sent', 'Received', 'Overdue']),
    choice('currentApprovalStep', 'Current Approval Step', ['PM', 'PX', 'CFO']),
    dateTime('loiSentDate', 'LOI Sent Date'),
    dateTime('loiReturnedDate', 'LOI Returned Date'),
    dateTime('contractSentDate', 'Contract Sent Date'),
    dateTime('contractExecutedDate', 'Contract Executed Date'),
    dateTime('insuranceCOIReceivedDate', 'Insurance COI Received Date'),
    choice('status', 'Status', ['Not Started', 'In Progress', 'Complete']),
    note('notes', 'Notes'),
    dateTime('createdDate', 'Created Date'),
    dateTime('modifiedDate', 'Modified Date'),
  ],
};

const COMMITMENT_APPROVALS: IProjectListSchema = {
  listName: 'Commitment_Approvals',
  description: 'Buyout commitment approval history',
  templateType: 100,
  fields: [
    num('buyoutEntryId', 'Buyout Entry ID'),
    text('projectCode', 'Project Code', { indexed: true }),
    choice('step', 'Step', ['PM', 'PX', 'CFO']),
    text('approverName', 'Approver Name'),
    text('approverEmail', 'Approver Email'),
    choice('status', 'Status', ['Pending', 'Approved', 'Rejected']),
    note('comment', 'Comment'),
    dateTime('actionDate', 'Action Date'),
    choice('waiverType', 'Waiver Type', ['PriceDeviation', 'QScoreDeviation', 'SoleSource', 'Other']),
  ],
};

const STARTUP_CHECKLIST: IProjectListSchema = {
  listName: 'Startup_Checklist',
  description: 'Project startup checklist items',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    num('sectionNumber', 'Section Number'),
    text('sectionName', 'Section Name'),
    text('itemNumber', 'Item Number'),
    text('label', 'Label'),
    choice('responseType', 'Response Type', ['YesNo', 'Text', 'Date', 'Upload']),
    text('response', 'Response'),
    choice('status', 'Status', ['Pending', 'Complete', 'N/A']),
    text('respondedBy', 'Responded By'),
    dateTime('respondedDate', 'Responded Date'),
    text('assignedTo', 'Assigned To'),
    text('assignedToName', 'Assigned To Name'),
    note('comment', 'Comment'),
    bool('isHidden', 'Is Hidden'),
    bool('isCustom', 'Is Custom'),
    num('sortOrder', 'Sort Order'),
  ],
};

const CHECKLIST_ACTIVITY_LOG: IProjectListSchema = {
  listName: 'Checklist_Activity_Log',
  description: 'Activity log for startup checklist changes',
  templateType: 100,
  fields: [
    num('checklistItemId', 'Checklist Item ID'),
    text('projectCode', 'Project Code', { indexed: true }),
    dateTime('timestamp', 'Timestamp'),
    text('user', 'User'),
    text('previousValue', 'Previous Value'),
    text('newValue', 'New Value'),
    note('comment', 'Comment'),
  ],
};

const INTERNAL_MATRIX: IProjectListSchema = {
  listName: 'Internal_Matrix',
  description: 'Internal responsibility matrix tasks',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    num('sortOrder', 'Sort Order'),
    text('taskCategory', 'Task Category'),
    text('taskDescription', 'Task Description'),
    choice('PX', 'PX', ['P', 'S', 'N/A']),
    choice('SrPM', 'Sr PM', ['P', 'S', 'N/A']),
    choice('PM2', 'PM2', ['P', 'S', 'N/A']),
    choice('PM1', 'PM1', ['P', 'S', 'N/A']),
    choice('PA', 'PA', ['P', 'S', 'N/A']),
    choice('QAQC', 'QAQC', ['P', 'S', 'N/A']),
    choice('ProjAcct', 'Proj Acct', ['P', 'S', 'N/A']),
    bool('isHidden', 'Is Hidden'),
    bool('isCustom', 'Is Custom'),
  ],
};

const TEAM_ROLE_ASSIGNMENTS: IProjectListSchema = {
  listName: 'Team_Role_Assignments',
  description: 'Role-to-person mappings for responsibility matrix',
  templateType: 100,
  fields: [
    text('ProjectCode', 'Project Code', { indexed: true }),
    text('RoleAbbreviation', 'Role Abbreviation'),
    text('AssignedPerson', 'Assigned Person'),
    text('AssignedPersonEmail', 'Assigned Person Email'),
  ],
};

const OWNER_CONTRACT_MATRIX: IProjectListSchema = {
  listName: 'Owner_Contract_Matrix',
  description: 'Owner contract article responsibility matrix',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    num('sortOrder', 'Sort Order'),
    text('articleNumber', 'Article Number'),
    text('pageNumber', 'Page Number'),
    choice('responsibleParty', 'Responsible Party', []),
    note('description', 'Description'),
    bool('isHidden', 'Is Hidden'),
    bool('isCustom', 'Is Custom'),
  ],
};

const SUB_CONTRACT_MATRIX: IProjectListSchema = {
  listName: 'Sub_Contract_Matrix',
  description: 'Sub-contract clause responsibility matrix',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    num('sortOrder', 'Sort Order'),
    text('refNumber', 'Ref Number'),
    text('pageNumber', 'Page Number'),
    note('clauseDescription', 'Clause Description'),
    choice('ProjExec', 'Proj Exec', ['P', 'S', 'N/A']),
    choice('ProjMgr', 'Proj Mgr', ['P', 'S', 'N/A']),
    choice('AsstPM', 'Asst PM', ['P', 'S', 'N/A']),
    choice('Super', 'Super', ['P', 'S', 'N/A']),
    choice('ProjAdmin', 'Proj Admin', ['P', 'S', 'N/A']),
    bool('isHidden', 'Is Hidden'),
    bool('isCustom', 'Is Custom'),
  ],
};

const RISK_COST_MANAGEMENT: IProjectListSchema = {
  listName: 'Risk_Cost_Management',
  description: 'Project risk and cost management header',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('contractType', 'Contract Type'),
    currency('contractAmount', 'Contract Amount'),
    text('createdBy', 'Created By'),
    dateTime('createdAt', 'Created At'),
    text('lastUpdatedBy', 'Last Updated By'),
    dateTime('lastUpdatedAt', 'Last Updated At'),
  ],
};

const RISK_COST_ITEMS: IProjectListSchema = {
  listName: 'Risk_Cost_Items',
  description: 'Risk and cost line items (buyout opportunities, risks, savings)',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    num('riskCostId', 'Risk Cost ID'),
    choice('category', 'Category', ['BuyoutOpportunity', 'PotentialRisk', 'PotentialSaving']),
    text('letter', 'Letter'),
    note('description', 'Description'),
    currency('estimatedValue', 'Estimated Value'),
    choice('status', 'Status', ['Open', 'Mitigated', 'Realized', 'Closed']),
    note('notes', 'Notes'),
    dateTime('createdDate', 'Created Date'),
    dateTime('updatedDate', 'Updated Date'),
  ],
};

const QUALITY_CONCERNS: IProjectListSchema = {
  listName: 'Quality_Concerns',
  description: 'Project quality concerns tracking',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('letter', 'Letter'),
    note('description', 'Description'),
    text('raisedBy', 'Raised By'),
    dateTime('raisedDate', 'Raised Date'),
    choice('status', 'Status', ['Open', 'In Progress', 'Resolved']),
    note('resolution', 'Resolution'),
    dateTime('resolvedDate', 'Resolved Date'),
    note('notes', 'Notes'),
  ],
};

const SAFETY_CONCERNS: IProjectListSchema = {
  listName: 'Safety_Concerns',
  description: 'Project safety concerns tracking',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('safetyOfficerName', 'Safety Officer Name'),
    text('safetyOfficerEmail', 'Safety Officer Email'),
    text('letter', 'Letter'),
    note('description', 'Description'),
    choice('severity', 'Severity', ['Low', 'Medium', 'High', 'Critical']),
    text('raisedBy', 'Raised By'),
    dateTime('raisedDate', 'Raised Date'),
    choice('status', 'Status', ['Open', 'In Progress', 'Resolved']),
    note('resolution', 'Resolution'),
    dateTime('resolvedDate', 'Resolved Date'),
    note('notes', 'Notes'),
  ],
};

const PROJECT_SCHEDULE: IProjectListSchema = {
  listName: 'Project_Schedule',
  description: 'Project schedule and critical path management',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    dateTime('startDate', 'Start Date'),
    dateTime('substantialCompletionDate', 'Substantial Completion Date'),
    dateTime('ntpDate', 'NTP Date'),
    dateTime('nocDate', 'NOC Date'),
    num('contractCalendarDays', 'Contract Calendar Days'),
    text('contractBasisType', 'Contract Basis Type'),
    num('teamGoalDaysAhead', 'Team Goal Days Ahead'),
    note('teamGoalDescription', 'Team Goal Description'),
    bool('hasLiquidatedDamages', 'Has Liquidated Damages'),
    currency('liquidatedDamagesAmount', 'Liquidated Damages Amount'),
    note('liquidatedDamagesTerms', 'Liquidated Damages Terms'),
    text('createdBy', 'Created By'),
    dateTime('createdAt', 'Created At'),
    text('lastUpdatedBy', 'Last Updated By'),
    dateTime('lastUpdatedAt', 'Last Updated At'),
  ],
};

const CRITICAL_PATH_ITEMS: IProjectListSchema = {
  listName: 'Critical_Path_Items',
  description: 'Critical path concern items',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    num('scheduleId', 'Schedule ID'),
    text('letter', 'Letter'),
    note('description', 'Description'),
    note('impactDescription', 'Impact Description'),
    choice('status', 'Status', ['Open', 'Mitigated', 'Resolved']),
    note('mitigationPlan', 'Mitigation Plan'),
    dateTime('createdDate', 'Created Date'),
    dateTime('updatedDate', 'Updated Date'),
  ],
};

const SUPERINTENDENT_PLAN: IProjectListSchema = {
  listName: 'Superintendent_Plan',
  description: 'Superintendent field plan header',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('superintendentName', 'Superintendent Name'),
    text('createdBy', 'Created By'),
    dateTime('createdAt', 'Created At'),
    text('lastUpdatedBy', 'Last Updated By'),
    dateTime('lastUpdatedAt', 'Last Updated At'),
  ],
};

const SUPERINTENDENT_PLAN_SECTIONS: IProjectListSchema = {
  listName: 'Superintendent_Plan_Sections',
  description: 'Superintendent plan section content',
  templateType: 100,
  fields: [
    num('superintendentPlanId', 'Superintendent Plan ID'),
    text('projectCode', 'Project Code', { indexed: true }),
    text('sectionKey', 'Section Key'),
    text('sectionTitle', 'Section Title'),
    note('content', 'Content'),
    note('attachmentUrls', 'Attachment URLs'),
    bool('isComplete', 'Is Complete'),
  ],
};

const LESSONS_LEARNED: IProjectListSchema = {
  listName: 'Lessons_Learned',
  description: 'Project lessons learned entries',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('title', 'Title'),
    choice('category', 'Category', ['Safety', 'Quality', 'Schedule', 'Cost', 'Scope', 'Communication', 'Other']),
    choice('impact', 'Impact', ['Low', 'Medium', 'High']),
    note('description', 'Description'),
    note('recommendation', 'Recommendation'),
    text('raisedBy', 'Raised By'),
    dateTime('raisedDate', 'Raised Date'),
    text('phase', 'Phase'),
    bool('isIncludedInFinalRecord', 'Included In Final Record'),
    note('tags', 'Tags'),
  ],
};

const PMP: IProjectListSchema = {
  listName: 'Project_Management_Plans',
  description: 'Project management plan documents',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('projectName', 'Project Name'),
    text('jobNumber', 'Job Number'),
    choice('status', 'Status', ['Draft', 'PendingApproval', 'Approved', 'Returned']),
    num('currentCycleNumber', 'Current Cycle Number'),
    text('division', 'Division'),
    note('superintendentPlan', 'Superintendent Plan'),
    note('preconMeetingNotes', 'Precon Meeting Notes'),
    note('siteManagementNotes', 'Site Management Notes'),
    dateTime('projectAdminBuyoutDate', 'Project Admin Buyout Date'),
    note('attachmentUrls', 'Attachment URLs'),
    note('riskCostData', 'Risk Cost Data'),
    note('qualityConcerns', 'Quality Concerns'),
    note('safetyConcerns', 'Safety Concerns'),
    note('scheduleData', 'Schedule Data'),
    note('superintendentPlanData', 'Superintendent Plan Data'),
    note('lessonsLearned', 'Lessons Learned'),
    note('teamAssignments', 'Team Assignments'),
    note('boilerplate', 'Boilerplate'),
    text('createdBy', 'Created By'),
    dateTime('createdAt', 'Created At'),
    text('lastUpdatedBy', 'Last Updated By'),
    dateTime('lastUpdatedAt', 'Last Updated At'),
  ],
};

const PMP_SIGNATURES: IProjectListSchema = {
  listName: 'PMP_Signatures',
  description: 'PMP signature tracking',
  templateType: 100,
  fields: [
    num('pmpId', 'PMP ID'),
    text('projectCode', 'Project Code', { indexed: true }),
    choice('signatureType', 'Signature Type', ['Startup', 'Completion']),
    text('role', 'Role'),
    text('personName', 'Person Name'),
    text('personEmail', 'Person Email'),
    bool('isRequired', 'Is Required'),
    bool('isLead', 'Is Lead'),
    choice('status', 'Status', ['Pending', 'Signed', 'Declined']),
    dateTime('signedDate', 'Signed Date'),
    note('affidavitText', 'Affidavit Text'),
    note('comment', 'Comment'),
  ],
};

const PMP_APPROVAL_CYCLES: IProjectListSchema = {
  listName: 'PMP_Approval_Cycles',
  description: 'PMP approval cycle tracking',
  templateType: 100,
  fields: [
    num('pmpId', 'PMP ID'),
    text('projectCode', 'Project Code', { indexed: true }),
    num('cycleNumber', 'Cycle Number'),
    text('submittedBy', 'Submitted By'),
    dateTime('submittedDate', 'Submitted Date'),
    choice('status', 'Status', ['Active', 'Completed', 'Cancelled']),
    note('changesFromPrevious', 'Changes From Previous'),
  ],
};

const PMP_APPROVAL_STEPS: IProjectListSchema = {
  listName: 'PMP_Approval_Steps',
  description: 'PMP approval step entries',
  templateType: 100,
  fields: [
    num('approvalCycleId', 'Approval Cycle ID'),
    text('projectCode', 'Project Code', { indexed: true }),
    num('stepOrder', 'Step Order'),
    text('approverRole', 'Approver Role'),
    text('approverName', 'Approver Name'),
    text('approverEmail', 'Approver Email'),
    choice('status', 'Status', ['Pending', 'Approved', 'Returned']),
    note('comment', 'Comment'),
    dateTime('actionDate', 'Action Date'),
    num('approvalCycleNumber', 'Approval Cycle Number'),
  ],
};

const MONTHLY_REVIEWS: IProjectListSchema = {
  listName: 'Monthly_Reviews',
  description: 'Monthly project review entries',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('reviewMonth', 'Review Month'),
    choice('status', 'Status', ['Draft', 'PMSubmitted', 'PXReview', 'PXValidated', 'LeadershipReview', 'Complete']),
    dateTime('dueDate', 'Due Date'),
    dateTime('meetingDate', 'Meeting Date'),
    dateTime('pmSubmittedDate', 'PM Submitted Date'),
    dateTime('pxReviewDate', 'PX Review Date'),
    dateTime('pxValidationDate', 'PX Validation Date'),
    dateTime('leadershipSubmitDate', 'Leadership Submit Date'),
    dateTime('completedDate', 'Completed Date'),
    note('reportDocumentUrls', 'Report Document URLs'),
    text('createdBy', 'Created By'),
    dateTime('createdAt', 'Created At'),
    text('lastUpdatedBy', 'Last Updated By'),
    dateTime('lastUpdatedAt', 'Last Updated At'),
  ],
};

const MONTHLY_CHECKLIST_ITEMS: IProjectListSchema = {
  listName: 'Monthly_Checklist_Items',
  description: 'Monthly review checklist items',
  templateType: 100,
  fields: [
    num('reviewId', 'Review ID'),
    text('sectionKey', 'Section Key'),
    text('sectionTitle', 'Section Title'),
    text('itemKey', 'Item Key'),
    text('itemDescription', 'Item Description'),
    note('pmComment', 'PM Comment'),
    note('pxComment', 'PX Comment'),
    text('pxInitial', 'PX Initial'),
  ],
};

const MONTHLY_FOLLOW_UPS: IProjectListSchema = {
  listName: 'Monthly_Follow_Ups',
  description: 'Monthly review follow-up items',
  templateType: 100,
  fields: [
    num('reviewId', 'Review ID'),
    note('question', 'Question'),
    text('requestedBy', 'Requested By'),
    dateTime('requestedDate', 'Requested Date'),
    note('pmResponse', 'PM Response'),
    dateTime('responseDate', 'Response Date'),
    dateTime('pxForwardedDate', 'PX Forwarded Date'),
    choice('status', 'Status', ['Open', 'Responded', 'Closed']),
  ],
};

const CLOSEOUT_ITEMS: IProjectListSchema = {
  listName: 'Closeout_Items',
  description: 'Project closeout checklist items',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('category', 'Category'),
    text('description', 'Description'),
    choice('status', 'Status', ['Pending', 'Complete', 'N/A']),
    text('assignedTo', 'Assigned To'),
    dateTime('completedDate', 'Completed Date'),
    note('notes', 'Notes'),
  ],
};

const MARKETING_PROJECT_RECORD: IProjectListSchema = {
  listName: 'Marketing_Project_Record',
  description: 'Project-level marketing record (mirrors hub-level)',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    text('projectName', 'Project Name'),
    num('leadId', 'Lead ID'),
    note('contractType', 'Contract Type'),
    text('deliveryMethod', 'Delivery Method'),
    text('architect', 'Architect'),
    note('projectDescription', 'Project Description'),
    currency('contractBudget', 'Contract Budget'),
    currency('contractFinalCost', 'Contract Final Cost'),
    dateTime('scheduleStartActual', 'Schedule Start Actual'),
    dateTime('scheduleEndActual', 'Schedule End Actual'),
    num('overallCompletion', 'Overall Completion'),
    text('lastUpdatedBy', 'Last Updated By'),
    dateTime('lastUpdatedAt', 'Last Updated At'),
  ],
};

const CONTRACT_INFO: IProjectListSchema = {
  listName: 'Contract_Info',
  description: 'Project contract information',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    num('leadId', 'Lead ID'),
    text('contractType', 'Contract Type'),
    currency('contractValue', 'Contract Value'),
    dateTime('contractDate', 'Contract Date'),
    text('ownerName', 'Owner Name'),
    note('notes', 'Notes'),
  ],
};

const INTERVIEW_PREP: IProjectListSchema = {
  listName: 'Interview_Prep',
  description: 'Interview preparation documents',
  templateType: 100,
  fields: [
    num('leadId', 'Lead ID', { indexed: true }),
    text('projectCode', 'Project Code'),
    note('keyMessages', 'Key Messages'),
    note('teamBios', 'Team Bios'),
    note('presentationNotes', 'Presentation Notes'),
    text('createdBy', 'Created By'),
    dateTime('createdAt', 'Created At'),
  ],
};

const TURNOVER_AGENDAS: IProjectListSchema = {
  listName: 'Turnover_Agendas',
  description: 'Turnover agenda master records',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    num('leadId', 'Lead ID'),
    choice('status', 'Status', ['Draft', 'PrerequisitesInProgress', 'MeetingScheduled', 'MeetingComplete', 'PendingSignatures', 'Signed', 'Complete']),
    dateTime('meetingDate', 'Meeting Date'),
    text('meetingLocation', 'Meeting Location'),
    note('projectHeader', 'Project Header'),
    text('createdBy', 'Created By'),
    dateTime('createdAt', 'Created At'),
    text('lastUpdatedBy', 'Last Updated By'),
    dateTime('lastUpdatedAt', 'Last Updated At'),
  ],
};

const TURNOVER_PREREQUISITES: IProjectListSchema = {
  listName: 'Turnover_Prerequisites',
  description: 'Turnover prerequisite items',
  templateType: 100,
  fields: [
    num('turnoverAgendaId', 'Turnover Agenda ID'),
    text('label', 'Label'),
    bool('isComplete', 'Is Complete'),
    text('completedBy', 'Completed By'),
    dateTime('completedDate', 'Completed Date'),
    note('notes', 'Notes'),
    num('sortOrder', 'Sort Order'),
  ],
};

const TURNOVER_DISCUSSION_ITEMS: IProjectListSchema = {
  listName: 'Turnover_Discussion_Items',
  description: 'Turnover discussion agenda items',
  templateType: 100,
  fields: [
    num('turnoverAgendaId', 'Turnover Agenda ID'),
    text('sectionKey', 'Section Key'),
    text('sectionTitle', 'Section Title'),
    text('itemLabel', 'Item Label'),
    note('notes', 'Notes'),
    text('responsibleParty', 'Responsible Party'),
    bool('isDiscussed', 'Is Discussed'),
    num('sortOrder', 'Sort Order'),
  ],
};

const TURNOVER_SUBCONTRACTORS: IProjectListSchema = {
  listName: 'Turnover_Subcontractors',
  description: 'Turnover subcontractor entries',
  templateType: 100,
  fields: [
    num('turnoverAgendaId', 'Turnover Agenda ID'),
    text('trade', 'Trade'),
    text('company', 'Company'),
    text('contactName', 'Contact Name'),
    text('contactPhone', 'Contact Phone'),
    text('contactEmail', 'Contact Email'),
    currency('contractAmount', 'Contract Amount'),
    note('scopeNotes', 'Scope Notes'),
    num('sortOrder', 'Sort Order'),
  ],
};

const TURNOVER_EXHIBITS: IProjectListSchema = {
  listName: 'Turnover_Exhibits',
  description: 'Turnover exhibit documents',
  templateType: 100,
  fields: [
    num('turnoverAgendaId', 'Turnover Agenda ID'),
    text('exhibitLabel', 'Exhibit Label'),
    text('exhibitTitle', 'Exhibit Title'),
    note('description', 'Description'),
    url('fileUrl', 'File URL'),
    text('fileName', 'File Name'),
    bool('isReviewed', 'Is Reviewed'),
    text('reviewedBy', 'Reviewed By'),
    dateTime('reviewedDate', 'Reviewed Date'),
    num('sortOrder', 'Sort Order'),
  ],
};

const TURNOVER_SIGNATURES: IProjectListSchema = {
  listName: 'Turnover_Signatures',
  description: 'Turnover signature tracking',
  templateType: 100,
  fields: [
    num('turnoverAgendaId', 'Turnover Agenda ID'),
    text('role', 'Role'),
    text('personName', 'Person Name'),
    text('personEmail', 'Person Email'),
    bool('isSigned', 'Is Signed'),
    dateTime('signedDate', 'Signed Date'),
    note('affidavitText', 'Affidavit Text'),
    note('comment', 'Comment'),
    num('sortOrder', 'Sort Order'),
  ],
};

const TURNOVER_ATTACHMENTS: IProjectListSchema = {
  listName: 'Turnover_Attachments',
  description: 'Turnover discussion item attachments',
  templateType: 100,
  fields: [
    num('discussionItemId', 'Discussion Item ID'),
    text('fileName', 'File Name'),
    url('fileUrl', 'File URL'),
    text('uploadedBy', 'Uploaded By'),
    dateTime('uploadedDate', 'Uploaded Date'),
  ],
};

const TURNOVER_ESTIMATE_OVERVIEWS: IProjectListSchema = {
  listName: 'Turnover_Estimate_Overviews',
  description: 'Turnover estimate overview data',
  templateType: 100,
  fields: [
    text('projectCode', 'Project Code', { indexed: true }),
    num('turnoverAgendaId', 'Turnover Agenda ID'),
    currency('originalContractAmount', 'Original Contract Amount'),
    currency('approvedChangeOrders', 'Approved Change Orders'),
    currency('pendingChangeOrders', 'Pending Change Orders'),
    currency('currentContractValue', 'Current Contract Value'),
    currency('projectedFinalCost', 'Projected Final Cost'),
    num('projectedFeePercent', 'Projected Fee Percent'),
    note('notes', 'Notes'),
    text('lastUpdatedBy', 'Last Updated By'),
    dateTime('lastUpdatedAt', 'Last Updated At'),
  ],
};

// --- All 42 project-site list schemas ---

const ALL_PROJECT_SCHEMAS: IProjectListSchema[] = [
  PROJECT_INFO,
  TEAM_MEMBERS,
  DELIVERABLES,
  ACTION_ITEMS,
  TURNOVER_CHECKLIST,
  BUYOUT_LOG,
  COMMITMENT_APPROVALS,
  STARTUP_CHECKLIST,
  CHECKLIST_ACTIVITY_LOG,
  INTERNAL_MATRIX,
  TEAM_ROLE_ASSIGNMENTS,
  OWNER_CONTRACT_MATRIX,
  SUB_CONTRACT_MATRIX,
  RISK_COST_MANAGEMENT,
  RISK_COST_ITEMS,
  QUALITY_CONCERNS,
  SAFETY_CONCERNS,
  PROJECT_SCHEDULE,
  CRITICAL_PATH_ITEMS,
  SUPERINTENDENT_PLAN,
  SUPERINTENDENT_PLAN_SECTIONS,
  LESSONS_LEARNED,
  PMP,
  PMP_SIGNATURES,
  PMP_APPROVAL_CYCLES,
  PMP_APPROVAL_STEPS,
  MONTHLY_REVIEWS,
  MONTHLY_CHECKLIST_ITEMS,
  MONTHLY_FOLLOW_UPS,
  CLOSEOUT_ITEMS,
  MARKETING_PROJECT_RECORD,
  CONTRACT_INFO,
  INTERVIEW_PREP,
  TURNOVER_AGENDAS,
  TURNOVER_PREREQUISITES,
  TURNOVER_DISCUSSION_ITEMS,
  TURNOVER_SUBCONTRACTORS,
  TURNOVER_EXHIBITS,
  TURNOVER_SIGNATURES,
  TURNOVER_ATTACHMENTS,
  TURNOVER_ESTIMATE_OVERVIEWS,
];

/**
 * Returns all 42 project-site list schemas for provisioning.
 * Note: Shared Documents library is created by default with the site.
 */
export function getProjectListSchemas(): IProjectListSchema[] {
  return ALL_PROJECT_SCHEMAS;
}

/**
 * Returns the Active_Projects_Portfolio list schema for the hub site.
 */
export function getActiveProjectsPortfolioSchema(): IProjectListSchema {
  return {
    listName: 'Active_Projects_Portfolio',
    description: 'Executive portfolio view aggregating data from all project sites',
    templateType: 100,
    fields: [
      text('jobNumber', 'Job Number'),
      text('projectCode', 'Project Code', { indexed: true }),
      text('projectName', 'Project Name'),
      choice('status', 'Status', ['Precon', 'Construction', 'Final Payment']),
      choice('sector', 'Sector', []),
      text('region', 'Region'),
      // Personnel
      text('personnelProjectExecutive', 'Project Executive'),
      text('personnelProjectExecutiveEmail', 'Project Executive Email'),
      text('personnelLeadPM', 'Lead PM'),
      text('personnelLeadPMEmail', 'Lead PM Email'),
      text('personnelAdditionalPM', 'Additional PM'),
      text('personnelAssistantPM', 'Assistant PM'),
      text('personnelProjectAccountant', 'Project Accountant'),
      text('personnelProjectAssistant', 'Project Assistant'),
      text('personnelLeadSuper', 'Lead Super'),
      text('personnelSuperintendent', 'Superintendent'),
      text('personnelAssistantSuper', 'Assistant Super'),
      // Financials
      currency('financialsOriginalContract', 'Original Contract'),
      currency('financialsChangeOrders', 'Change Orders'),
      currency('financialsCurrentContractValue', 'Current Contract Value'),
      currency('financialsBillingsToDate', 'Billings To Date'),
      currency('financialsUnbilled', 'Unbilled'),
      currency('financialsProjectedFee', 'Projected Fee'),
      num('financialsProjectedFeePct', 'Projected Fee %'),
      currency('financialsProjectedCost', 'Projected Cost'),
      currency('financialsRemainingValue', 'Remaining Value'),
      // Schedule
      dateTime('scheduleStartDate', 'Start Date'),
      dateTime('scheduleSubstantialCompletionDate', 'Substantial Completion Date'),
      dateTime('scheduleNocExpiration', 'NOC Expiration'),
      text('scheduleCurrentPhase', 'Current Phase'),
      num('schedulePercentComplete', 'Percent Complete'),
      // Risk Metrics
      num('riskMetricsAverageQScore', 'Average Q Score'),
      num('riskMetricsOpenWaiverCount', 'Open Waiver Count'),
      num('riskMetricsPendingCommitments', 'Pending Commitments'),
      choice('riskMetricsComplianceStatus', 'Compliance Status', ['Green', 'Yellow', 'Red']),
      // Status
      note('statusComments', 'Status Comments'),
      url('projectSiteUrl', 'Project Site URL'),
      dateTime('lastSyncDate', 'Last Sync Date'),
      dateTime('lastModified', 'Last Modified'),
      // Alerts
      bool('hasUnbilledAlert', 'Has Unbilled Alert'),
      bool('hasScheduleAlert', 'Has Schedule Alert'),
      bool('hasFeeErosionAlert', 'Has Fee Erosion Alert'),
    ],
  };
}

/**
 * Returns the Buyout_Log list schema for standalone creation.
 */
export function getBuyoutLogSchema(): IProjectListSchema {
  return BUYOUT_LOG;
}
