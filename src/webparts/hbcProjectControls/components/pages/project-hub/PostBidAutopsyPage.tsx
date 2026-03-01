/**
 * Stage 21 — PostBidAutopsyPage
 *
 * Fully persistent replacement for the Excel "Bid Project Analysis _Feedback"
 * workbook. 100% field parity: 13 estimating process questions (Yes/No +
 * conditional weakness notes), 16 SWOC discussion prompts (4 sections),
 * closing fields, overall rating, and employee list.
 *
 * Architecture: TanStack Query for data, optimistic mutations, config-driven
 * process question table, flat fields for SWOC, AzureADPeoplePicker for team.
 */
import * as React from 'react';
import {
  Button,
  Textarea,
  Tooltip,
  MessageBar,
  MessageBarBody,
  Slider,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import {
  Add24Regular,
  ArrowDownload24Regular,
  ArrowLeft24Regular,
  Checkmark24Regular,
  LockClosed24Regular,
} from '@fluentui/react-icons';
import { useQuery } from '@tanstack/react-query';
import {
  PERMISSIONS,
  PostBidAutopsyService,
  ExportService,
  POST_BID_PROCESS_QUESTIONS,
  SWOC_SECTIONS,
  type IPostBidAutopsy,
  type IPostBidAutopsyItem,
  type IPersonAssignment,
  type ISWOCSection,
} from '@hbc/sp-services';
import { useAppContext } from '../../contexts/AppContext';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { KPICard } from '../../shared/KPICard';
import { CollapsibleSection } from '../../shared/CollapsibleSection';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { ConfirmDialog } from '../../shared/ConfirmDialog';
import { AzureADPeoplePicker } from '../../shared/AzureADPeoplePicker';
import { ExportButtons } from '../../shared/ExportButtons';
import { useButtonStyles, withToastFeedback } from './shared';
import { useToast } from '../../shared/ToastContainer';
import { useQueryScope } from '../../../tanstack/query/useQueryScope';
import { postBidAutopsyByProjectOptions } from '../../../tanstack/query/queryOptions/postBidAutopsyQueryOptions';
import { useEstimatingMutation } from '../../../tanstack/query/mutations/useEstimatingMutation';

// ── Styles ─────────────────────────────────────────────────────────────
const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalL),
    maxWidth: '1200px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  processTable: {
    width: '100%',
    borderCollapse: 'collapse',
    ...shorthands.borderRadius('6px'),
    ...shorthands.overflow('hidden'),
  },
  th: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    textAlign: 'left',
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('2px', 'solid', tokens.colorNeutralStroke2),
  },
  thCenter: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    textAlign: 'center',
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('2px', 'solid', tokens.colorNeutralStroke2),
  },
  tr: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  td: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    verticalAlign: 'top',
  },
  tdCenter: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    verticalAlign: 'top',
    textAlign: 'center',
  },
  rowNumber: {
    color: tokens.colorNeutralForeground3,
    fontWeight: tokens.fontWeightSemibold,
    width: '36px',
    textAlign: 'center',
  },
  questionText: {
    lineHeight: '1.4',
  },
  criteriaText: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    marginTop: '2px',
  },
  yesNoGroup: {
    display: 'flex',
    ...shorthands.gap('4px'),
    justifyContent: 'center',
  },
  yesBtn: {
    minWidth: '40px',
    fontSize: tokens.fontSizeBase200,
  },
  yesBtnActive: {
    minWidth: '40px',
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorStatusSuccessForeground1,
    color: '#fff',
    ':hover': { backgroundColor: tokens.colorStatusSuccessForeground1 },
  },
  noBtn: {
    minWidth: '40px',
    fontSize: tokens.fontSizeBase200,
  },
  noBtnActive: {
    minWidth: '40px',
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorStatusDangerForeground1,
    color: '#fff',
    ':hover': { backgroundColor: tokens.colorStatusDangerForeground1 },
  },
  notesTextarea: {
    width: '100%',
    minHeight: '60px',
  },
  disabledNote: {
    opacity: 0.4,
  },
  swocPromptLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    marginBottom: '4px',
    marginTop: '12px',
  },
  swocTextarea: {
    width: '100%',
    minHeight: '80px',
  },
  confidentialBanner: {
    marginBottom: '12px',
  },
  closingGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('16px'),
  },
  closingFull: {
    gridColumn: '1 / -1',
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  ratingValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
    minWidth: '32px',
    textAlign: 'center',
  },
  ratingSlider: {
    flexGrow: 1,
  },
  fieldLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    marginBottom: '4px',
  },
  // actionBar → useButtonStyles().actionBar + local actionBarSpacing
  // actionGroup → useButtonStyles().actionGroup
  actionBarSpacing: {
    marginTop: tokens.spacingVerticalS,
  },
  addRowBtn: {
    marginTop: '8px',
  },
  finalizedBanner: {
    marginBottom: '8px',
  },
  scoreGood: { color: tokens.colorStatusSuccessForeground1 },
  scoreMedium: { color: tokens.colorStatusWarningForeground1 },
  scoreLow: { color: tokens.colorStatusDangerForeground1 },
  validationBar: {
    marginBottom: tokens.spacingVerticalS,
  },
  unansweredRow: {
    borderLeft: `3px solid ${tokens.colorStatusWarningForeground1}`,
  },
  sectionErrorBadge: {
    color: tokens.colorStatusDangerForeground1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
});

// ── Helpers ────────────────────────────────────────────────────────────
function getScoreClass(
  styles: ReturnType<typeof useStyles>,
  score: number,
): string {
  if (score >= 75) return styles.scoreGood;
  if (score >= 50) return styles.scoreMedium;
  return styles.scoreLow;
}

// ── Component ──────────────────────────────────────────────────────────
export const PostBidAutopsyPage: React.FC = () => {
  const styles = useStyles();
  const btnStyles = useButtonStyles();
  const { dataService, selectedProject, currentUser, hasPermission } = useAppContext();
  const navigate = useAppNavigate();
  const toast = useToast();
  const scope = useQueryScope();

  const projectCode = selectedProject?.projectCode ?? '';
  const canEdit =
    hasPermission(PERMISSIONS.ESTIMATING_EDIT) &&
    !false; // overridden below when finalized

  // ── Queries ──────────────────────────────────────────────────────
  const {
    data: autopsy,
    isPending,
    isError,
  } = useQuery(postBidAutopsyByProjectOptions(scope, projectCode, dataService));

  const isFinalized = autopsy?.isFinalized ?? false;
  const editable = canEdit && !isFinalized;

  // ── Mutations (shared hook — optimistic updates + cross-query invalidation) ──
  const {
    createAutopsy,
    saveAutopsy,
    finalizeAutopsy,
    isCreating,
    isFinalizing,
  } = useEstimatingMutation({ projectCode });

  // ── Confirm Dialog State ─────────────────────────────────────────
  const [showFinalize, setShowFinalize] = React.useState(false);
  const [hasAttemptedFinalize, setHasAttemptedFinalize] = React.useState(false);

  // ── Computed Values ──────────────────────────────────────────────
  const items = autopsy?.items ?? [];
  const processScore = React.useMemo(
    () => PostBidAutopsyService.computeProcessScore(items),
    [items],
  );
  const completion = React.useMemo(
    () => PostBidAutopsyService.computeCompletion(items),
    [items],
  );

  // ── Validation Errors (derived from TanStack Query cache) ──────
  const validationErrors = React.useMemo(() => {
    if (!autopsy) return { errors: {} as Record<string, string>, errorList: [] as string[] };
    const errors: Record<string, string> = {};

    const unanswered = autopsy.items.filter((i) => i.answer === null);
    if (unanswered.length > 0) {
      errors.processQuestions = `${unanswered.length} process question(s) not answered.`;
    }
    if (autopsy.overallRating < 1 || autopsy.overallRating > 10) {
      errors.overallRating = 'Overall rating must be between 1 and 10.';
    }
    if (autopsy.employees.length === 0) {
      errors.employees = 'At least one team member is required.';
    }

    return { errors, errorList: Object.values(errors) };
  }, [autopsy]);

  const isValid = validationErrors.errorList.length === 0;

  const unansweredItemIds = React.useMemo(() => {
    if (!autopsy) return new Set<number>();
    return new Set(autopsy.items.filter((i) => i.answer === null).map((i) => i.id));
  }, [autopsy]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleInitialize = React.useCallback(() => {
    void withToastFeedback(
      () => createAutopsy({
        ProjectCode: projectCode,
        LeadID: selectedProject?.leadId,
        CreatedBy: currentUser?.email ?? 'system',
      }),
      toast.addToast,
      { successMessage: 'Autopsy initialized from template', errorMessage: 'Failed to initialize autopsy' },
    );
  }, [createAutopsy, projectCode, selectedProject?.leadId, currentUser?.email, toast]);

  const handleItemChange = React.useCallback(
    (itemId: number, field: string, value: unknown) => {
      if (!autopsy) return;
      const updatedItems = autopsy.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      );
      void withToastFeedback(
        () => saveAutopsy({
          ...autopsy,
          items: updatedItems,
          processScore: PostBidAutopsyService.computeProcessScore(updatedItems),
          ModifiedBy: currentUser?.email,
        }),
        toast.addToast,
        { errorMessage: 'Failed to save' },
      );
    },
    [autopsy, saveAutopsy, currentUser?.email, toast],
  );

  const handleFieldChange = React.useCallback(
    (field: string, value: unknown) => {
      if (!autopsy) return;
      void withToastFeedback(
        () => saveAutopsy({
          ...autopsy,
          [field]: value,
          ModifiedBy: currentUser?.email,
        }),
        toast.addToast,
        { errorMessage: 'Failed to save' },
      );
    },
    [autopsy, saveAutopsy, currentUser?.email, toast],
  );

  const handleAddCustomQuestion = React.useCallback(() => {
    if (!autopsy) return;
    const maxId = Math.max(0, ...autopsy.items.map((i) => i.id));
    const newItem: IPostBidAutopsyItem = {
      id: maxId + 1,
      autopsyId: autopsy.id,
      questionKey: `custom_${maxId + 1}`,
      question: '',
      answer: null,
      sortOrder: autopsy.items.length + 1,
      isCustom: true,
    };
    void withToastFeedback(
      () => saveAutopsy({
        ...autopsy,
        items: [...autopsy.items, newItem],
        ModifiedBy: currentUser?.email,
      }),
      toast.addToast,
      { errorMessage: 'Failed to save' },
    );
  }, [autopsy, saveAutopsy, currentUser?.email, toast]);

  const handleEmployeesChange = React.useCallback(
    (users: IPersonAssignment[]) => {
      handleFieldChange(
        'employees',
        users.map((u) => u.displayName || u.email || ''),
      );
    },
    [handleFieldChange],
  );

  const handleFinalize = React.useCallback(() => {
    if (!autopsy) return;
    setHasAttemptedFinalize(true);

    if (!isValid) {
      toast.addToast(`Cannot finalize: ${validationErrors.errorList.join(' ')}`, 'warning');
      return;
    }
    setShowFinalize(true);
  }, [autopsy, isValid, validationErrors.errorList, toast]);

  const confirmFinalize = React.useCallback(() => {
    setShowFinalize(false);
    void withToastFeedback(
      () => finalizeAutopsy(projectCode, {
        isFinalized: true,
        finalizedBy: currentUser?.email ?? 'system',
      }),
      toast.addToast,
      { successMessage: 'Autopsy finalized and locked', errorMessage: 'Failed to finalize' },
    );
  }, [finalizeAutopsy, projectCode, currentUser?.email, toast]);

  // Phase 2 Task 3: Multi-sheet Excel export via PostBidAutopsyService
  const [isExportingExcel, setIsExportingExcel] = React.useState(false);
  const handleExcelExport = React.useCallback(async () => {
    if (!autopsy) return;
    setIsExportingExcel(true);
    try {
      await withToastFeedback(
        async () => {
          const sheets = PostBidAutopsyService.buildExcelExportData(autopsy);
          const exportSvc = new ExportService();
          await exportSvc.exportToExcelMultiSheet(sheets, {
            filename: `post-bid-autopsy-${projectCode}`,
            title: `Post-Bid Autopsy — ${projectCode}`,
          });
        },
        toast.addToast,
        { successMessage: 'Excel export complete', errorMessage: 'Excel export failed' },
      );
    } catch {
      // error toast already shown by withToastFeedback
    } finally {
      setIsExportingExcel(false);
    }
  }, [autopsy, projectCode, toast]);

  // ── Empty State ──────────────────────────────────────────────────
  if (!selectedProject) {
    return (
      <div className={styles.container}>
        <PageHeader title="Post-Bid Analysis" />
        <HbcEmptyState
          title="No project selected"
          description="Select a project from the sidebar to view the post-bid analysis."
        />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className={styles.container}>
        <PageHeader title="Post-Bid Analysis" />
        <SkeletonLoader variant="form" rows={8} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.container}>
        <PageHeader title="Post-Bid Analysis" />
        <HbcEmptyState
          title="Error loading autopsy"
          description="An error occurred while loading the post-bid analysis data."
        />
      </div>
    );
  }

  // Not yet initialized — show initialize button
  if (!autopsy) {
    return (
      <div className={styles.container}>
        <PageHeader
          title="Post-Bid Analysis"
          subtitle={`${projectCode} — ${selectedProject.projectName || 'Unknown Project'}`}
          actions={
            <Button icon={<ArrowLeft24Regular />} appearance="subtle" onClick={() => navigate('/')}>
              Back
            </Button>
          }
        />
        <HbcEmptyState
          title="No post-bid analysis found"
          description="Initialize from the standard template to begin the post-bid autopsy for this project."
        />
        {canEdit && (
          <Button
            appearance="primary"
            onClick={handleInitialize}
            disabled={isCreating}
          >
            {isCreating ? 'Initializing...' : 'Initialize from Template'}
          </Button>
        )}
      </div>
    );
  }

  // ── Main Render ──────────────────────────────────────────────────
  const projectName = selectedProject.projectName || 'Unknown Project';

  return (
    <div className={styles.container} id="post-bid-autopsy-content">
      {/* Header */}
      <PageHeader
        title="Post-Bid Analysis"
        subtitle={`${projectCode} — ${projectName}`}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Project Hub', path: '/project-hub' },
              { label: 'Preconstruction' },
              { label: 'Post-Bid Analysis' },
            ]}
          />
        }
        actions={
          <Button icon={<ArrowLeft24Regular />} appearance="subtle" onClick={() => navigate('/')}>
            Back
          </Button>
        }
      />

      {/* Finalized Banner */}
      {isFinalized && (
        <MessageBar intent="info" className={styles.finalizedBanner}>
          <MessageBarBody>
            This post-bid analysis has been finalized
            {autopsy.finalizedBy ? ` by ${autopsy.finalizedBy}` : ''}
            {autopsy.finalizedDate
              ? ` on ${new Date(autopsy.finalizedDate).toLocaleDateString()}`
              : ''}
            . All fields are locked for editing.
          </MessageBarBody>
        </MessageBar>
      )}

      {/* KPI Cards */}
      <div className={styles.kpiGrid}>
        <KPICard title="Process Score" value={`${processScore}%`} />
        <KPICard
          title="Overall Rating"
          value={`${autopsy.overallRating}/10`}
        />
        <KPICard
          title="Status"
          value={isFinalized ? 'Finalized' : 'In Progress'}
          badge={isFinalized ? 'Locked' : undefined}
        />
        <KPICard title="Completion" value={`${completion}%`} subtitle={`${items.filter((i) => i.answer !== null).length}/${items.length} answered`} />
      </div>

      {/* ═══ Estimating Process Review ═══ */}
      <CollapsibleSection
        title="Estimating Process Review"
        subtitle="13 Process Questions"
        defaultExpanded
        badge={
          <>
            <span className={getScoreClass(styles, processScore)}>
              {processScore}%
            </span>
            {hasAttemptedFinalize && validationErrors.errors.processQuestions && (
              <span className={styles.sectionErrorBadge}>
                {' '}— {validationErrors.errors.processQuestions}
              </span>
            )}
          </>
        }
      >
        <table className={styles.processTable}>
          <thead>
            <tr>
              <th className={styles.thCenter} style={{ width: '36px' }}>#</th>
              <th className={styles.th} style={{ width: '45%' }}>Estimating Process</th>
              <th className={styles.thCenter} style={{ width: '100px' }}>Yes / No</th>
              <th className={styles.th}>Describe Issue / Weakness</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qConfig = POST_BID_PROCESS_QUESTIONS.find(
                (q) => q.key === item.questionKey,
              );
              return (
                <tr
                  key={item.id}
                  className={mergeClasses(
                    styles.tr,
                    hasAttemptedFinalize && unansweredItemIds.has(item.id) && styles.unansweredRow,
                  )}
                >
                  <td className={mergeClasses(styles.td, styles.rowNumber)}>
                    {idx + 1}
                  </td>
                  <td className={styles.td}>
                    {item.isCustom && editable ? (
                      <Textarea
                        value={item.question}
                        placeholder="Enter custom question..."
                        resize="vertical"
                        className={styles.notesTextarea}
                        onChange={(_e, data) =>
                          handleItemChange(item.id, 'question', data.value)
                        }
                      />
                    ) : (
                      <div>
                        <div className={styles.questionText}>{item.question}</div>
                        {qConfig?.criteriaNote && (
                          <Tooltip
                            content={qConfig.tooltip}
                            relationship="description"
                          >
                            <div className={styles.criteriaText}>
                              {qConfig.criteriaNote}
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={styles.tdCenter}>
                    <div className={styles.yesNoGroup}>
                      <Button
                        size="small"
                        appearance={item.answer === 'yes' ? 'primary' : 'subtle'}
                        className={
                          item.answer === 'yes'
                            ? styles.yesBtnActive
                            : styles.yesBtn
                        }
                        disabled={!editable}
                        onClick={() =>
                          handleItemChange(
                            item.id,
                            'answer',
                            item.answer === 'yes' ? null : 'yes',
                          )
                        }
                      >
                        Y
                      </Button>
                      <Button
                        size="small"
                        appearance={item.answer === 'no' ? 'primary' : 'subtle'}
                        className={
                          item.answer === 'no'
                            ? styles.noBtnActive
                            : styles.noBtn
                        }
                        disabled={!editable}
                        onClick={() =>
                          handleItemChange(
                            item.id,
                            'answer',
                            item.answer === 'no' ? null : 'no',
                          )
                        }
                      >
                        N
                      </Button>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <Textarea
                      value={item.weaknessNotes ?? ''}
                      placeholder={
                        item.answer === 'yes'
                          ? '—'
                          : 'Describe issue or weakness...'
                      }
                      resize="vertical"
                      className={mergeClasses(
                        styles.notesTextarea,
                        item.answer === 'yes' && styles.disabledNote,
                      )}
                      disabled={!editable || item.answer === 'yes'}
                      onChange={(_e, data) =>
                        handleItemChange(item.id, 'weaknessNotes', data.value)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {editable && (
          <Button
            appearance="subtle"
            size="small"
            icon={<Add24Regular />}
            className={styles.addRowBtn}
            onClick={handleAddCustomQuestion}
          >
            Add custom question
          </Button>
        )}
      </CollapsibleSection>

      {/* ═══ SWOC Sections ═══ */}
      {SWOC_SECTIONS.map((section: ISWOCSection) => (
        <CollapsibleSection
          key={section.key}
          title={section.title}
          subtitle={section.subtitle}
          defaultExpanded
        >
          {section.confidential && (
            <MessageBar intent="warning" className={styles.confidentialBanner}>
              <MessageBarBody>
                This section may contain confidential information for hard-bid
                scenarios. Treat contents with appropriate discretion.
              </MessageBarBody>
            </MessageBar>
          )}

          {section.prompts.map((prompt) => {
            const fieldKey = prompt.field as string;
            const value =
              (autopsy[prompt.field as keyof IPostBidAutopsy] as string) ?? '';
            return (
              <div key={fieldKey}>
                <div className={styles.swocPromptLabel}>{prompt.label}</div>
                <Textarea
                  value={value}
                  placeholder="Enter discussion notes..."
                  resize="vertical"
                  className={styles.swocTextarea}
                  disabled={!editable}
                  onChange={(_e, data) => handleFieldChange(fieldKey, data.value)}
                />
              </div>
            );
          })}
        </CollapsibleSection>
      ))}

      {/* ═══ Summary & Closing ═══ */}
      <CollapsibleSection title="Summary & Closing" defaultExpanded>
        <div className={styles.closingGrid}>
          {/* Overall Rating */}
          <div>
            <div className={styles.fieldLabel}>
              Overall Rating (1–10)
              {hasAttemptedFinalize && validationErrors.errors.overallRating && (
                <span className={styles.sectionErrorBadge}>
                  {' '}— {validationErrors.errors.overallRating}
                </span>
              )}
            </div>
            <div className={styles.ratingContainer}>
              <Slider
                min={1}
                max={10}
                step={1}
                value={autopsy.overallRating || 1}
                className={styles.ratingSlider}
                disabled={!editable}
                onChange={(_e, data) =>
                  handleFieldChange('overallRating', data.value)
                }
              />
              <span className={styles.ratingValue}>
                {autopsy.overallRating || 0}
              </span>
            </div>
          </div>

          {/* Overall Percentage */}
          <div>
            <div className={styles.fieldLabel}>Overall Project Rate (%)</div>
            <Textarea
              value={
                autopsy.overallPercentage !== undefined
                  ? String(autopsy.overallPercentage)
                  : ''
              }
              placeholder="0-100"
              resize="none"
              disabled={!editable}
              onChange={(_e, data) => {
                const num = parseInt(data.value, 10);
                if (!isNaN(num) && num >= 0 && num <= 100) {
                  handleFieldChange('overallPercentage', num);
                } else if (data.value === '') {
                  handleFieldChange('overallPercentage', undefined);
                }
              }}
            />
          </div>

          {/* General Notes */}
          <div className={styles.closingFull}>
            <div className={styles.fieldLabel}>General Notes / Details</div>
            <Textarea
              value={autopsy.generalNotes ?? ''}
              placeholder="Enter general notes about the project..."
              resize="vertical"
              className={styles.swocTextarea}
              disabled={!editable}
              onChange={(_e, data) =>
                handleFieldChange('generalNotes', data.value)
              }
            />
          </div>

          {/* SOP Change Requests */}
          <div className={styles.closingFull}>
            <div className={styles.fieldLabel}>
              Project Summary & Request for Changes to SOP
            </div>
            <Textarea
              value={autopsy.sopChangeRequests ?? ''}
              placeholder="Enter SOP change requests or project summary notes..."
              resize="vertical"
              className={styles.swocTextarea}
              disabled={!editable}
              onChange={(_e, data) =>
                handleFieldChange('sopChangeRequests', data.value)
              }
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ═══ Project Team ═══ */}
      <CollapsibleSection
        title="Employees in Project"
        defaultExpanded
        badge={
          hasAttemptedFinalize && validationErrors.errors.employees ? (
            <span className={styles.sectionErrorBadge}>
              {validationErrors.errors.employees}
            </span>
          ) : undefined
        }
      >
        <AzureADPeoplePicker
          multiSelect
          selectedUsers={
            (autopsy.employees ?? []).map((name, idx) => ({
              userId: String(idx),
              displayName: name,
              email: '',
            }))
          }
          onSelectMulti={handleEmployeesChange}
          label="Team Members"
          placeholder="Search for employees..."
          disabled={!editable}
        />
      </CollapsibleSection>

      {/* ═══ Validation Summary ═══ */}
      {hasAttemptedFinalize && !isValid && !isFinalized && (
        <MessageBar intent="warning" className={styles.validationBar} role="alert">
          <MessageBarBody>
            {validationErrors.errorList.length === 1
              ? validationErrors.errorList[0]
              : `Please resolve ${validationErrors.errorList.length} issues before finalizing: ${validationErrors.errorList.join(' ')}`}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* ═══ Action Bar ═══ */}
      <div className={mergeClasses(btnStyles.actionBar, styles.actionBarSpacing)}>
        <div className={btnStyles.actionGroup}>
          <ExportButtons
            filename={`post-bid-autopsy-${projectCode}`}
            pdfElementId="post-bid-autopsy-content"
          />
          <Button
            size="small"
            appearance="subtle"
            icon={<ArrowDownload24Regular />}
            onClick={handleExcelExport}
            disabled={isExportingExcel}
          >
            {isExportingExcel ? 'Exporting...' : 'Excel'}
          </Button>
        </div>
        <div className={btnStyles.actionGroup}>
          {!isFinalized && canEdit && (
            <Tooltip
              content={
                hasAttemptedFinalize && !isValid
                  ? validationErrors.errorList.join(' ')
                  : 'Lock all fields after review is complete'
              }
              relationship="description"
            >
              <Button
                appearance="primary"
                icon={<LockClosed24Regular />}
                onClick={handleFinalize}
                disabled={isFinalizing || (hasAttemptedFinalize && !isValid)}
              >
                {isFinalizing ? 'Finalizing...' : 'Finalize & Lock'}
              </Button>
            </Tooltip>
          )}
          {isFinalized && (
            <Button
              appearance="subtle"
              icon={<Checkmark24Regular />}
              disabled
            >
              Finalized
              {autopsy.finalizedDate
                ? ` — ${new Date(autopsy.finalizedDate).toLocaleDateString()}`
                : ''}
            </Button>
          )}
        </div>
      </div>

      {/* Finalize Confirmation */}
      <ConfirmDialog
        open={showFinalize}
        title="Finalize Post-Bid Analysis"
        message="Once finalized, all fields will be locked for editing. This action cannot be undone. Are you sure you want to proceed?"
        confirmLabel="Finalize & Lock"
        cancelLabel="Cancel"
        onConfirm={confirmFinalize}
        onCancel={() => setShowFinalize(false)}
        danger
      />
    </div>
  );
};
