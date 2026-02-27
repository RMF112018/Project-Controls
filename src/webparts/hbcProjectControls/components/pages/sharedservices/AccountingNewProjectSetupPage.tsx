import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Input,
  Textarea,
  MessageBar,
  MessageBarBody,
  makeStyles,
  shorthands,
  tokens,
  type InputOnChangeData,
  type TextareaOnChangeData,
} from '@fluentui/react-components';
import {
  AuditAction,
  EntityType,
  JobNumberRequestStatus,
  graphService,
  type IJobNumberRequest,
} from '@hbc/sp-services';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { HbcButton } from '../../shared/HbcButton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { HbcDataTable, type IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcField } from '../../shared/HbcField';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
    alignItems: 'start',
    ...shorthands.gap(tokens.spacingHorizontalL),
    '@media (max-width: 1200px)': {
      gridTemplateColumns: '1fr',
    },
  },
  queuePane: {
    minWidth: 0,
    position: 'relative',
    zIndex: 0,
    overflow: 'hidden',
  },
  formPane: {
    minWidth: 0,
    position: 'relative',
    zIndex: 1,
  },
  statusBadge: {
    textTransform: 'capitalize' as const,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  actions: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.margin(tokens.spacingVerticalM, '0', '0'),
    flexWrap: 'wrap',
  },
  helperText: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  errorBanner: {
    marginBottom: tokens.spacingVerticalM,
  },
});

const ACCOUNTING_SETUP_QUEUE_KEY = ['accounting', 'project-setup-queue'] as const;
const PROJECT_NUMBER_REQUESTS_KEY = ['project-number-requests'] as const;

interface ISetupFormState {
  jobNumber: string;
  costCenter: string;
  divisionCode: string;
  phaseCode: string;
  initialBudget: string;
  contingencyBudget: string;
  budgetNotes: string;
}

function isSameFormState(a: ISetupFormState, b: ISetupFormState): boolean {
  return a.jobNumber === b.jobNumber
    && a.costCenter === b.costCenter
    && a.divisionCode === b.divisionCode
    && a.phaseCode === b.phaseCode
    && a.initialBudget === b.initialBudget
    && a.contingencyBudget === b.contingencyBudget
    && a.budgetNotes === b.budgetNotes;
}

function buildFormStateFromRequest(request: IJobNumberRequest): ISetupFormState {
  const selected = request as unknown as Record<string, unknown>;
  return {
    jobNumber: request.AssignedJobNumber ?? request.TempProjectCode ?? '',
    costCenter: typeof selected.AccountingCostCenter === 'string' ? selected.AccountingCostCenter : '',
    divisionCode: typeof selected.AccountingDivisionCode === 'string'
      ? selected.AccountingDivisionCode
      : (request.OfficeDivision ?? ''),
    phaseCode: typeof selected.AccountingPhaseCode === 'string' ? selected.AccountingPhaseCode : '',
    initialBudget: typeof selected.BudgetInitialAmount === 'number' ? String(selected.BudgetInitialAmount) : '',
    contingencyBudget: typeof selected.BudgetContingencyAmount === 'number' ? String(selected.BudgetContingencyAmount) : '',
    budgetNotes: typeof selected.BudgetNotes === 'string' ? selected.BudgetNotes : '',
  };
}

function toStatusBadgeColor(status: JobNumberRequestStatus): 'success' | 'warning' | 'informative' | 'subtle' {
  if (status === JobNumberRequestStatus.Completed || status === ('SetupComplete' as JobNumberRequestStatus)) return 'success';
  if (status === JobNumberRequestStatus.PendingProvisioning) return 'informative';
  if (status === JobNumberRequestStatus.PendingController || status === JobNumberRequestStatus.Pending) return 'warning';
  return 'subtle';
}

export const AccountingNewProjectSetupPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRequestId, setSelectedRequestId] = React.useState<number | null>(null);
  const [selectedRequestSnapshot, setSelectedRequestSnapshot] = React.useState<IJobNumberRequest | null>(null);
  const [, startTransition] = React.useTransition();
  const [form, setForm] = React.useState<ISetupFormState>({
    jobNumber: '',
    costCenter: '',
    divisionCode: '',
    phaseCode: '',
    initialBudget: '',
    contingencyBudget: '',
    budgetNotes: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const queueQuery = useQuery({
    queryKey: ACCOUNTING_SETUP_QUEUE_KEY,
    queryFn: () => dataService.getJobNumberRequests(),
    staleTime: 20_000,
    gcTime: 5 * 60_000,
    refetchInterval: () => (
      selectedRequestId
        ? false
        : (typeof document !== 'undefined' && document.hidden ? false : 45_000)
    ),
    refetchOnWindowFocus: !selectedRequestId,
  });

  const allRequests = React.useMemo(() => queueQuery.data ?? [], [queueQuery.data]);

  const queueItems = React.useMemo(() => {
    return allRequests.filter((request) => (
      request.RequestStatus === JobNumberRequestStatus.PendingController ||
      request.RequestStatus === JobNumberRequestStatus.PendingProvisioning ||
      request.RequestStatus === JobNumberRequestStatus.Submitted ||
      request.RequestStatus === JobNumberRequestStatus.Pending
    ));
  }, [allRequests]);
  const deferredQueueItems = React.useDeferredValue(queueItems);

  const selectedRequest = selectedRequestSnapshot;

  const onQueueRowClick = React.useCallback((row: IJobNumberRequest) => {
    if (row.id === selectedRequestId) {
      return;
    }

    const rowSnapshot: IJobNumberRequest = { ...row };
    const nextForm = buildFormStateFromRequest(rowSnapshot);

    // Keep click path lightweight; defer selection + form hydration to match the proven Add Role stabilization pattern.
    window.setTimeout(() => {
      startTransition(() => {
        setSelectedRequestId(rowSnapshot.id);
        setSelectedRequestSnapshot(rowSnapshot);
        setForm((previous) => (isSameFormState(previous, nextForm) ? previous : nextForm));
        setErrors((previous) => (Object.keys(previous).length === 0 ? previous : {}));
      });
    }, 0);
  }, [selectedRequestId, startTransition]);

  const setFormField = React.useCallback((field: keyof ISetupFormState, value: string) => {
    setForm((previous) => {
      if (previous[field] === value) {
        return previous;
      }
      const next = { ...previous, [field]: value } as ISetupFormState;
      return isSameFormState(previous, next) ? previous : next;
    });
  }, []);

  const onJobNumberChange = React.useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => setFormField('jobNumber', data.value),
    [setFormField]
  );
  const onCostCenterChange = React.useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => setFormField('costCenter', data.value),
    [setFormField]
  );
  const onDivisionCodeChange = React.useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => setFormField('divisionCode', data.value),
    [setFormField]
  );
  const onPhaseCodeChange = React.useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => setFormField('phaseCode', data.value),
    [setFormField]
  );
  const onInitialBudgetChange = React.useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => setFormField('initialBudget', data.value),
    [setFormField]
  );
  const onContingencyBudgetChange = React.useCallback(
    (_event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => setFormField('contingencyBudget', data.value),
    [setFormField]
  );
  const onBudgetNotesChange = React.useCallback(
    (_event: React.ChangeEvent<HTMLTextAreaElement>, data: TextareaOnChangeData) => setFormField('budgetNotes', data.value),
    [setFormField]
  );

  const queueRowKeyExtractor = React.useCallback((row: IJobNumberRequest) => row.id, []);

  const columns = React.useMemo((): IHbcDataTableColumn<IJobNumberRequest>[] => [
    {
      key: 'ProjectName',
      header: 'Project',
      render: (row) => row.ProjectName || row.ProjectAddress || '—',
      sortable: true,
    },
    {
      key: 'SubmittedBy',
      header: 'Requested By',
      render: (row) => row.SubmittedBy || row.Originator || '—',
      sortable: true,
    },
    {
      key: 'RequestDate',
      header: 'Request Date',
      render: (row) => row.RequestDate ? new Date(row.RequestDate).toLocaleDateString() : '—',
      sortable: true,
    },
    {
      key: 'AssignedJobNumber',
      header: 'Project Number',
      render: (row) => row.AssignedJobNumber || row.TempProjectCode || '—',
      sortable: true,
    },
    {
      key: 'RequestStatus',
      header: 'Status',
      render: (row) => (
        <Badge appearance="filled" color={toStatusBadgeColor(row.RequestStatus)} className={styles.statusBadge}>
          {row.RequestStatus}
        </Badge>
      ),
      sortable: true,
    },
  ], [styles.statusBadge]);

  const validate = React.useCallback((): Record<string, string> => {
    const next: Record<string, string> = {};
    if (!form.jobNumber.trim()) next.jobNumber = 'Job number is required.';
    if (!form.costCenter.trim()) next.costCenter = 'Cost center is required.';
    if (!form.divisionCode.trim()) next.divisionCode = 'Division code is required.';
    if (!form.phaseCode.trim()) next.phaseCode = 'Phase code is required.';
    if (!form.initialBudget.trim()) next.initialBudget = 'Initial budget is required.';
    const initialBudget = Number(form.initialBudget);
    if (form.initialBudget && (Number.isNaN(initialBudget) || initialBudget < 0)) {
      next.initialBudget = 'Initial budget must be a non-negative number.';
    }
    const contingency = Number(form.contingencyBudget || '0');
    if (form.contingencyBudget && (Number.isNaN(contingency) || contingency < 0)) {
      next.contingencyBudget = 'Contingency budget must be a non-negative number.';
    }
    return next;
  }, [form]);

  const setupMutation = useMutation<
    IJobNumberRequest,
    unknown,
    { request: IJobNumberRequest; shouldProvision: boolean },
    { previousQueue?: IJobNumberRequest[]; previousProjectRequests?: IJobNumberRequest[] }
  >({
    mutationFn: async ({ request, shouldProvision }) => {
      const nowIso = new Date().toISOString();
      const assignedBy = currentUser?.email ?? 'accounting@hedrickbrothers.com';
      const updatePayload: Partial<IJobNumberRequest> & Record<string, unknown> = {
        AssignedJobNumber: form.jobNumber.trim(),
        AssignedBy: assignedBy,
        AssignedDate: nowIso.split('T')[0],
        RequestStatus: shouldProvision ? ('SetupComplete' as JobNumberRequestStatus) : JobNumberRequestStatus.PendingProvisioning,
        BallInCourt: shouldProvision ? '' : 'System',
        AccountingCostCenter: form.costCenter.trim(),
        AccountingDivisionCode: form.divisionCode.trim(),
        AccountingPhaseCode: form.phaseCode.trim(),
        BudgetInitialAmount: Number(form.initialBudget),
        BudgetContingencyAmount: form.contingencyBudget ? Number(form.contingencyBudget) : 0,
        BudgetNotes: form.budgetNotes.trim() || undefined,
        FinancialCodingCompletedBy: assignedBy,
        FinancialCodingCompletedAt: nowIso,
      };

      const updated = await dataService.updateJobNumberRequest(request.id, updatePayload);

      if (!shouldProvision) {
        await dataService.logAudit({
          Action: AuditAction.ProjectNumberRequestUpdated,
          EntityType: EntityType.ProjectNumberRequest,
          EntityId: String(request.id),
          User: assignedBy,
          Details: `Financial coding saved for request ${request.id}; awaiting site provisioning.`,
        });
        return updated;
      }

      const provisioned = await dataService.triggerProjectNumberProvisioning(request.id);
      const graphProvisioning = await (graphService as unknown as {
        ensureProjectSiteProvisioned: (projectCode: string, projectName: string) => Promise<{ siteUrl: string }>;
      }).ensureProjectSiteProvisioned(
        form.jobNumber.trim(),
        request.ProjectName ?? request.ProjectAddress ?? 'Project Site'
      );

      const completedPayload: Partial<IJobNumberRequest> & Record<string, unknown> = {
        RequestStatus: 'SetupComplete' as JobNumberRequestStatus,
        BallInCourt: '',
        SiteUrl: provisioned.SiteUrl ?? graphProvisioning.siteUrl,
        FinancialCodingCompletedBy: assignedBy,
        FinancialCodingCompletedAt: nowIso,
      };
      const completed = await dataService.updateJobNumberRequest(request.id, completedPayload);
      // Step 7: provisioning completion notification + final audit are owned by service layer.

      return completed;
    },
    onMutate: async ({ request }) => {
      await queryClient.cancelQueries({ queryKey: ACCOUNTING_SETUP_QUEUE_KEY });
      await queryClient.cancelQueries({ queryKey: PROJECT_NUMBER_REQUESTS_KEY });
      const previousQueue = queryClient.getQueryData<IJobNumberRequest[]>(ACCOUNTING_SETUP_QUEUE_KEY);
      const previousProjectRequests = queryClient.getQueryData<IJobNumberRequest[]>(PROJECT_NUMBER_REQUESTS_KEY);
      const optimisticUpdate = (list: IJobNumberRequest[] | undefined): IJobNumberRequest[] | undefined => (
        list?.map((item) => (
          item.id === request.id
            ? {
              ...item,
              AssignedJobNumber: form.jobNumber.trim(),
              BallInCourt: 'Accounting',
              RequestStatus: JobNumberRequestStatus.PendingProvisioning,
            }
            : item
        ))
      );
      queryClient.setQueryData(ACCOUNTING_SETUP_QUEUE_KEY, optimisticUpdate(previousQueue));
      queryClient.setQueryData(PROJECT_NUMBER_REQUESTS_KEY, optimisticUpdate(previousProjectRequests));
      return { previousQueue, previousProjectRequests };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousQueue) {
        queryClient.setQueryData(ACCOUNTING_SETUP_QUEUE_KEY, context.previousQueue);
      }
      if (context?.previousProjectRequests) {
        queryClient.setQueryData(PROJECT_NUMBER_REQUESTS_KEY, context.previousProjectRequests);
      }
      addToast('Setup failed. Changes were rolled back.', 'error');
    },
    onSuccess: (result, variables) => {
      if (variables.shouldProvision) {
        addToast(
          result.SiteUrl
            ? 'Setup complete and site provisioning triggered.'
            : 'Setup saved but site provisioning is pending verification.',
          result.SiteUrl ? 'success' : 'warning'
        );
      } else {
        addToast('Financial setup saved. Provisioning can be triggered when ready.', 'info');
      }
      setSelectedRequestId(null);
      setSelectedRequestSnapshot(null);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ACCOUNTING_SETUP_QUEUE_KEY });
      await queryClient.invalidateQueries({ queryKey: PROJECT_NUMBER_REQUESTS_KEY });
    },
  });

  const onSubmit = React.useCallback((shouldProvision: boolean) => {
    if (!selectedRequest) return;
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      addToast('Please resolve the required accounting setup fields.', 'warning');
      return;
    }
    // Defer mutation kickoff to keep click handling responsive even when optimistic cache updates are expensive.
    Promise.resolve().then(() => {
      setupMutation.mutate({ request: selectedRequest, shouldProvision });
    });
  }, [selectedRequest, validate, addToast, setupMutation]);

  const queueTable = React.useMemo(() => (
    <HbcDataTable
      tableId="accounting-new-project-setup-queue"
      columns={columns}
      items={deferredQueueItems}
      keyExtractor={queueRowKeyExtractor}
      isLoading={queueQuery.isLoading}
      onRowClick={onQueueRowClick}
      emptyTitle="No Pending Setups"
      emptyDescription="New project financial setups will appear here when job numbers are requested."
      ariaLabel="Accounting project setup queue"
      virtualization={{
        enabled: true,
        threshold: 40,
        estimateRowHeight: 52,
        containerHeight: 500,
        overscan: 8,
        adaptiveOverscan: true,
      }}
    />
  ), [columns, deferredQueueItems, queueRowKeyExtractor, queueQuery.isLoading, onQueueRowClick]);

  return (
    <div className={styles.container}>
      <div className={styles.queuePane}>
        <PageHeader title="New Project Setup" subtitle="Configure project financial coding, budget initialization, and provisioning." />
        {queueQuery.isError ? (
          <MessageBar intent="error" className={styles.errorBanner}>
            <MessageBarBody>Unable to refresh accounting setup queue. Retrying automatically.</MessageBarBody>
          </MessageBar>
        ) : null}
        <HbcCard title="Project Setup Queue">
          {queueTable}
        </HbcCard>
      </div>

      <div className={styles.formPane}>
        <HbcCard title="Financial Coding & Budget Setup">
          {!selectedRequest ? (
            <HbcEmptyState
              title="Select A Request"
              description="Choose a request from the queue to complete accounting setup."
            />
          ) : (
            <>
              <p className={styles.helperText}>
                Preparing {selectedRequest.ProjectName || selectedRequest.ProjectAddress || `Request #${selectedRequest.id}`} for accounting handoff.
              </p>
              <div className={styles.formGrid}>
                <HbcField label="Assigned Job Number" required validationMessage={errors.jobNumber}>
                  <Input
                    value={form.jobNumber}
                    onChange={onJobNumberChange}
                    placeholder="e.g. 26-145-01"
                  />
                </HbcField>

                <HbcField label="Cost Center" required validationMessage={errors.costCenter}>
                  <Input
                    value={form.costCenter}
                    onChange={onCostCenterChange}
                    placeholder="e.g. CC-140"
                  />
                </HbcField>

                <HbcField label="Division Code" required validationMessage={errors.divisionCode}>
                  <Input
                    value={form.divisionCode}
                    onChange={onDivisionCodeChange}
                    placeholder="e.g. DIV-01"
                  />
                </HbcField>

                <HbcField label="Phase Code" required validationMessage={errors.phaseCode}>
                  <Input
                    value={form.phaseCode}
                    onChange={onPhaseCodeChange}
                    placeholder="e.g. PH-100"
                  />
                </HbcField>

                <HbcField label="Initial Budget" required validationMessage={errors.initialBudget}>
                  <Input
                    type="number"
                    value={form.initialBudget}
                    onChange={onInitialBudgetChange}
                    placeholder="0.00"
                  />
                </HbcField>

                <HbcField label="Contingency Budget" validationMessage={errors.contingencyBudget}>
                  <Input
                    type="number"
                    value={form.contingencyBudget}
                    onChange={onContingencyBudgetChange}
                    placeholder="0.00"
                  />
                </HbcField>

                <HbcField label="Budget Notes" className={styles.fullWidth}>
                  <Textarea
                    value={form.budgetNotes}
                    onChange={onBudgetNotesChange}
                    placeholder="Optional setup notes for accounting hand-off."
                  />
                </HbcField>
              </div>

              <div className={styles.actions}>
                <HbcButton
                  emphasis="default"
                  isLoading={setupMutation.isPending}
                  onClick={() => onSubmit(false)}
                >
                  Save Setup
                </HbcButton>
                <HbcButton
                  emphasis="strong"
                  isLoading={setupMutation.isPending}
                  onClick={() => onSubmit(true)}
                >
                  Save + Provision Site
                </HbcButton>
              </div>
            </>
          )}
        </HbcCard>
      </div>
    </div>
  );
};
