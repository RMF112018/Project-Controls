# UI Governance Audit Baseline

Generated: 2026-02-19T09:37:56.498Z

## Totals
- Files scanned: 249
- Native table files (`<table>`): 18
- Inline style hits (`style={{...}}`): 2533
- Hardcoded hex hits: 747
- makeStyles files: 22
- Non-token makeStyles color hits: 496
- Raw @tanstack/react-table imports outside adapter: 0
- Fluent table primitive imports: 6

## Native Table Files
- src/webparts/hbcProjectControls/components/help/ContactSupportDialog.tsx
- src/webparts/hbcProjectControls/components/pages/hub/ComplianceLog.tsx
- src/webparts/hbcProjectControls/components/pages/hub/GoNoGoDetail.tsx
- src/webparts/hbcProjectControls/components/pages/hub/GoNoGoScorecard.tsx
- src/webparts/hbcProjectControls/components/pages/project/BuyoutLogPage.tsx
- src/webparts/hbcProjectControls/components/pages/project/ConstraintsLogPage.tsx
- src/webparts/hbcProjectControls/components/pages/project/InternalResponsibilityMatrix.tsx
- src/webparts/hbcProjectControls/components/pages/project/OwnerContractMatrix.tsx
- src/webparts/hbcProjectControls/components/pages/project/PermitsLogPage.tsx
- src/webparts/hbcProjectControls/components/pages/project/ProjectRecord.tsx
- src/webparts/hbcProjectControls/components/pages/project/ProjectScheduleCriticalPath.tsx
- src/webparts/hbcProjectControls/components/pages/project/RiskCostManagement.tsx
- src/webparts/hbcProjectControls/components/pages/project/ScheduleImportModal.tsx
- src/webparts/hbcProjectControls/components/pages/project/SchedulePage.tsx
- src/webparts/hbcProjectControls/components/pages/project/SubContractMatrix.tsx
- src/webparts/hbcProjectControls/components/pages/project/TurnoverToOps.tsx
- src/webparts/hbcProjectControls/components/shared/ChecklistTable.tsx
- src/webparts/hbcProjectControls/tanstack/table/HbcTanStackTable.tsx

## Raw TanStack Imports Outside Adapter
- none

## Non-Token makeStyles Color Hits
- src/webparts/hbcProjectControls/components/guards/FeatureGate.stories.tsx (2)
- src/webparts/hbcProjectControls/components/guards/ProjectRequiredRoute.tsx (1)
- src/webparts/hbcProjectControls/components/guards/RoleGate.stories.tsx (5)
- src/webparts/hbcProjectControls/components/help/GuidedTour.tsx (1)
- src/webparts/hbcProjectControls/components/help/HelpMenu.tsx (2)
- src/webparts/hbcProjectControls/components/help/HelpPanel.tsx (5)
- src/webparts/hbcProjectControls/components/layouts/AppShell.tsx (8)
- src/webparts/hbcProjectControls/components/pages/hub/AccountingQueuePage.tsx (8)
- src/webparts/hbcProjectControls/components/pages/hub/ActiveProjectsDashboard.tsx (15)
- src/webparts/hbcProjectControls/components/pages/hub/AdminPanel.tsx (9)
- src/webparts/hbcProjectControls/components/pages/hub/ComplianceLog.tsx (13)
- src/webparts/hbcProjectControls/components/pages/hub/DashboardPage.tsx (21)
- src/webparts/hbcProjectControls/components/pages/hub/GoNoGoDetail.tsx (16)
- src/webparts/hbcProjectControls/components/pages/hub/GoNoGoScorecard.tsx (62)
- src/webparts/hbcProjectControls/components/pages/hub/JobNumberRequestForm.tsx (14)
- src/webparts/hbcProjectControls/components/pages/hub/LeadDetailPage.tsx (5)
- src/webparts/hbcProjectControls/components/pages/hub/LeadFormPage.tsx (1)
- src/webparts/hbcProjectControls/components/pages/hub/PerformanceDashboard.tsx (7)
- src/webparts/hbcProjectControls/components/pages/hub/PipelinePage.tsx (10)
- src/webparts/hbcProjectControls/components/pages/precon/EstimatingDashboard.tsx (3)
- src/webparts/hbcProjectControls/components/pages/precon/EstimatingKickoffList.tsx (3)
- src/webparts/hbcProjectControls/components/pages/precon/EstimatingKickoffPage.tsx (3)
- src/webparts/hbcProjectControls/components/pages/precon/GoNoGoTracker.tsx (1)
- src/webparts/hbcProjectControls/components/pages/precon/PostBidAutopsyForm.tsx (9)
- src/webparts/hbcProjectControls/components/pages/precon/PostBidAutopsyList.tsx (6)
- src/webparts/hbcProjectControls/components/pages/precon/PursuitDetail.tsx (3)
- src/webparts/hbcProjectControls/components/pages/project/BuyoutLogPage.tsx (24)
- src/webparts/hbcProjectControls/components/pages/project/CloseoutChecklist.tsx (1)
- src/webparts/hbcProjectControls/components/pages/project/CommitmentApprovalPanel.tsx (10)
- src/webparts/hbcProjectControls/components/pages/project/CommitmentForm.tsx (12)
- src/webparts/hbcProjectControls/components/pages/project/ConstraintsLogPage.tsx (10)
- src/webparts/hbcProjectControls/components/pages/project/ContractTracking.tsx (6)
- src/webparts/hbcProjectControls/components/pages/project/ContractTrackingPanel.tsx (8)
- src/webparts/hbcProjectControls/components/pages/project/ContractTrackingSubmitModal.tsx (6)
- src/webparts/hbcProjectControls/components/pages/project/InterviewPrep.tsx (5)
- src/webparts/hbcProjectControls/components/pages/project/LessonsLearnedPage.tsx (4)
- src/webparts/hbcProjectControls/components/pages/project/LossAutopsy.tsx (9)
- src/webparts/hbcProjectControls/components/pages/project/MonthlyProjectReview.tsx (5)
- src/webparts/hbcProjectControls/components/pages/project/PermitsLogPage.tsx (6)
- src/webparts/hbcProjectControls/components/pages/project/ProjectDashboard.tsx (18)
- src/webparts/hbcProjectControls/components/pages/project/ProjectScheduleCriticalPath.tsx (2)
- src/webparts/hbcProjectControls/components/pages/project/ProjectSettingsPage.tsx (6)
- src/webparts/hbcProjectControls/components/pages/project/ProjectTeamPanel.tsx (1)
- src/webparts/hbcProjectControls/components/pages/project/QualityConcernsTracker.tsx (2)
- src/webparts/hbcProjectControls/components/pages/project/RiskCostManagement.tsx (2)
- src/webparts/hbcProjectControls/components/pages/project/SafetyConcernsTracker.tsx (2)
- src/webparts/hbcProjectControls/components/pages/project/ScheduleAnalysisTab.tsx (3)
- src/webparts/hbcProjectControls/components/pages/project/ScheduleImportModal.tsx (7)
- src/webparts/hbcProjectControls/components/pages/project/SchedulePage.tsx (6)
- src/webparts/hbcProjectControls/components/pages/project/SuperintendentPlanPage.tsx (2)
- src/webparts/hbcProjectControls/components/pages/project/TurnoverToOps.tsx (11)
- src/webparts/hbcProjectControls/components/pages/project/WinLossRecorder.tsx (16)
- src/webparts/hbcProjectControls/components/pages/project/pmp/PMPApprovalPanel.tsx (4)
- src/webparts/hbcProjectControls/components/pages/project/pmp/PMPSection.tsx (3)
- src/webparts/hbcProjectControls/components/pages/project/pmp/PMPSignatureBlock.tsx (1)
- src/webparts/hbcProjectControls/components/pages/project/pmp/ProjectManagementPlan.tsx (1)
- src/webparts/hbcProjectControls/components/pages/shared/AccessDeniedPage.tsx (1)
- src/webparts/hbcProjectControls/components/shared/AutopsyMeetingScheduler.tsx (4)
- src/webparts/hbcProjectControls/components/shared/AzureADPeoplePicker.tsx (6)
- src/webparts/hbcProjectControls/components/shared/CollapsibleSection.tsx (1)
- src/webparts/hbcProjectControls/components/shared/ConditionBuilder.tsx (1)
- src/webparts/hbcProjectControls/components/shared/ConfirmDialog.tsx (1)
- src/webparts/hbcProjectControls/components/shared/EmptyState.stories.tsx (2)
- src/webparts/hbcProjectControls/components/shared/ErrorBoundary.tsx (1)
- src/webparts/hbcProjectControls/components/shared/HbcEChart.tsx (1)
- src/webparts/hbcProjectControls/components/shared/KickoffMeetingScheduler.tsx (4)
- src/webparts/hbcProjectControls/components/shared/PageHeader.stories.tsx (3)
- src/webparts/hbcProjectControls/components/shared/PipelineChart.tsx (1)
- src/webparts/hbcProjectControls/components/shared/PresenceIndicator.tsx (2)
- src/webparts/hbcProjectControls/components/shared/ProjectPicker.tsx (2)
- src/webparts/hbcProjectControls/components/shared/ScoreTierBadge.tsx (2)
- src/webparts/hbcProjectControls/components/shared/SkeletonLoader.tsx (4)
- src/webparts/hbcProjectControls/components/shared/SlideDrawer.tsx (2)
- src/webparts/hbcProjectControls/components/shared/StageBadge.tsx (2)
- src/webparts/hbcProjectControls/components/shared/StatusBadge.stories.tsx (5)
- src/webparts/hbcProjectControls/components/shared/TemplateSiteSyncPanel.tsx (3)
- src/webparts/hbcProjectControls/components/shared/ToolPermissionMatrix.tsx (2)
- src/webparts/hbcProjectControls/components/shared/WhatsNewModal.tsx (5)
- src/webparts/hbcProjectControls/components/shared/WorkflowPreview.tsx (6)
- src/webparts/hbcProjectControls/components/shared/WorkflowStepCard.tsx (5)
- src/webparts/hbcProjectControls/theme/globalStyles.ts (4)

## Fluent Table Primitive Imports
- src/webparts/hbcProjectControls/components/pages/hub/ActiveProjectsDashboard.tsx
- src/webparts/hbcProjectControls/components/pages/hub/AdminPanel.tsx
- src/webparts/hbcProjectControls/components/pages/hub/DashboardPage.tsx
- src/webparts/hbcProjectControls/components/pages/hub/PerformanceDashboard.tsx
- src/webparts/hbcProjectControls/components/shared/HbcDataTable.tsx
- src/webparts/hbcProjectControls/theme/globalStyles.ts
