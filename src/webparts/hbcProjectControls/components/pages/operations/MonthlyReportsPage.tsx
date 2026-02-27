import * as React from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import { Add24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { StatusBadge } from '../../shared/StatusBadge';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcButton } from '../../shared/HbcButton';
import { ExportButtons } from '../../shared/ExportButtons';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';
import { formatDate, type IMonthlyProjectReview } from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  NotStarted: { color: HBC_COLORS.gray500, bg: HBC_COLORS.gray100 },
  InProgress: { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  PendingPXReview: { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  PXReviewComplete: { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
  PMRevising: { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  PendingPXValidation: { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  SubmittedToLeadership: { color: HBC_COLORS.info, bg: HBC_COLORS.infoLight },
  FollowUpPending: { color: HBC_COLORS.warning, bg: HBC_COLORS.warningLight },
  Complete: { color: HBC_COLORS.success, bg: HBC_COLORS.successLight },
};

const STATUS_LABELS: Record<string, string> = {
  NotStarted: 'Not Started',
  InProgress: 'In Progress',
  PendingPXReview: 'Pending PX Review',
  PXReviewComplete: 'PX Review Complete',
  PMRevising: 'PM Revising',
  PendingPXValidation: 'Pending PX Validation',
  SubmittedToLeadership: 'Submitted to Leadership',
  FollowUpPending: 'Follow-Up Pending',
  Complete: 'Complete',
};

const useStyles = makeStyles({
  root: {
    display: 'grid',
    ...shorthands.gap('16px'),
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
});

export const MonthlyReportsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const { addToast } = useToast();

  const [reviews, setReviews] = React.useState<IMonthlyProjectReview[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadReviews = React.useCallback(async (): Promise<void> => {
    if (!projectCode) return;
    setIsLoading(true);
    try {
      const data = await dataService.getMonthlyReviews(projectCode);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load monthly reviews:', err);
      addToast('Failed to load monthly reviews.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dataService, projectCode, addToast]);

  React.useEffect(() => {
    loadReviews().catch(console.error);
  }, [loadReviews]);

  const handleCreate = React.useCallback(async (): Promise<void> => {
    try {
      const now = new Date();
      const reviewMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await dataService.createMonthlyReview({
        projectCode,
        reviewMonth,
        status: 'NotStarted',
        dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15).toISOString(),
        checklistItems: [],
        followUps: [],
        reportDocumentUrls: [],
      });
      addToast('Monthly review created.', 'success');
      await loadReviews();
    } catch (err) {
      console.error('Failed to create monthly review:', err);
      addToast('Failed to create monthly review.', 'error');
    }
  }, [dataService, projectCode, addToast, loadReviews]);

  const exportData = React.useMemo(() =>
    reviews.map((r) => ({
      Period: r.reviewMonth,
      Status: STATUS_LABELS[r.status] || r.status,
      'PM Review': r.pmSubmittedDate ? 'Complete' : 'Pending',
      'PX Review': r.pxReviewDate ? 'Complete' : 'Pending',
      'Last Updated': r.lastUpdatedAt,
    })),
    [reviews]
  );

  const columns = React.useMemo<IHbcDataTableColumn<IMonthlyProjectReview>[]>(() => [
    {
      key: 'Period',
      header: 'Period',
      render: (row) => row.reviewMonth,
      sortable: true,
    },
    {
      key: 'Status',
      header: 'Status',
      render: (row) => {
        const label = STATUS_LABELS[row.status] || row.status;
        const colors = STATUS_COLORS[row.status] || STATUS_COLORS.NotStarted;
        return <StatusBadge label={label} color={colors.color} backgroundColor={colors.bg} />;
      },
    },
    {
      key: 'PMReview',
      header: 'PM Review',
      render: (row) => (row.pmSubmittedDate ? 'Complete' : 'Pending'),
    },
    {
      key: 'PXReview',
      header: 'PX Review',
      render: (row) => (row.pxReviewDate ? 'Complete' : 'Pending'),
    },
    {
      key: 'Modified',
      header: 'Last Updated',
      render: (row) => formatDate(row.lastUpdatedAt, { dateStyle: 'numeric', placeholder: '\u2014', fallbackOnInvalid: '\u2014' }),
      sortable: true,
    },
  ], []);

  if (!projectCode) {
    return (
      <div className={styles.root}>
        <PageHeader title="Monthly Reports" />
        <HbcEmptyState title="No Project Selected" description="Select a project to view monthly reports." />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <PageHeader
        title="Monthly Reports"
        subtitle="Monthly project review status and history"
        actions={
          <div className={styles.headerActions}>
            <ExportButtons data={exportData} filename="monthly-reports" title="Monthly Reports" />
            <HbcButton emphasis="strong" icon={<Add24Regular />} onClick={handleCreate}>
              Create New Review
            </HbcButton>
          </div>
        }
      />

      {isLoading ? (
        <HbcSkeleton variant="table" rows={5} />
      ) : (
        <HbcDataTable<IMonthlyProjectReview>
          tableId="monthly-reports"
          columns={columns}
          items={reviews}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          emptyTitle="No Monthly Reviews"
          emptyDescription="No monthly reviews have been created for this project."
          ariaLabel="Monthly reports table"
          pageSize={12}
        />
      )}
    </div>
  );
};
