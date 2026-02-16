import * as React from 'react';
import {
  Button,
  Input,
  makeStyles,
  shorthands,
  tokens,
  Spinner,
} from '@fluentui/react-components';
import { SaveRegular } from '@fluentui/react-icons';
import { useAppContext } from '../../contexts/AppContext';
import { useHelp } from '../../contexts/HelpContext';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { DataTable } from '../../shared/DataTable';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { useToast } from '../../shared/ToastContainer';
import {
  ISupportConfig,
  IHelpGuide,
  AuditAction,
  EntityType,
} from '@hbc/sp-services';
import { HBC_COLORS } from '../../../theme/tokens';

const useStyles = makeStyles({
  page: {
    maxWidth: '1000px',
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('24px'),
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: '24px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: HBC_COLORS.navy,
    marginTop: '0',
    marginBottom: '16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('16px'),
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '16px',
  },
  badge: {
    display: 'inline-block',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('4px'),
    fontSize: '11px',
    fontWeight: '600',
  },
});

const BREADCRUMB_ITEMS = [
  { label: 'Admin', path: '/admin' },
  { label: 'Application Support' },
];

export const ApplicationSupportPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { guides, isLoading: guidesLoading } = useHelp();
  const { addToast } = useToast();

  const [, setConfig] = React.useState<ISupportConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form state
  const [supportEmail, setSupportEmail] = React.useState('');
  const [supportPhone, setSupportPhone] = React.useState('');
  const [knowledgeBaseUrl, setKnowledgeBaseUrl] = React.useState('');
  const [feedbackFormUrl, setFeedbackFormUrl] = React.useState('');
  const [responseTimeHours, setResponseTimeHours] = React.useState('');

  // Load support config
  React.useEffect(() => {
    dataService.getSupportConfig().then((cfg) => {
      setConfig(cfg);
      setSupportEmail(cfg.supportEmail || '');
      setSupportPhone(cfg.supportPhone || '');
      setKnowledgeBaseUrl(cfg.knowledgeBaseUrl || '');
      setFeedbackFormUrl(cfg.feedbackFormUrl || '');
      setResponseTimeHours(cfg.responseTimeHours?.toString() || '');
    }).catch((err) => {
      console.error('Failed to load support config:', err);
      addToast('Failed to load support configuration', 'error');
    }).finally(() => {
      setIsLoadingConfig(false);
    });
  }, [dataService, addToast]);

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    try {
      const updated = await dataService.updateSupportConfig({
        supportEmail: supportEmail.trim(),
        supportPhone: supportPhone.trim() || undefined,
        knowledgeBaseUrl: knowledgeBaseUrl.trim() || undefined,
        feedbackFormUrl: feedbackFormUrl.trim() || undefined,
        responseTimeHours: responseTimeHours ? Number(responseTimeHours) : undefined,
      });
      setConfig(updated);

      dataService.logAudit({
        Action: AuditAction.SupportConfigUpdated,
        EntityType: EntityType.Config,
        EntityId: 'support-config',
        User: currentUser?.email ?? 'unknown',
        Details: `Support email: ${supportEmail.trim()}`,
      }).catch(() => { /* fire-and-forget */ });

      addToast('Support configuration saved', 'success');
    } catch (err) {
      console.error('Failed to save support config:', err);
      addToast('Failed to save configuration', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [dataService, currentUser, supportEmail, supportPhone, knowledgeBaseUrl, feedbackFormUrl, responseTimeHours, addToast]);

  const guideColumns = React.useMemo(() => [
    { key: 'moduleKey', header: 'Module', render: (g: IHelpGuide) => g.moduleKey, sortable: true, width: '150px' },
    { key: 'title', header: 'Title', render: (g: IHelpGuide) => g.title, sortable: true },
    { key: 'guideType', header: 'Type', render: (g: IHelpGuide) => (
      <span
        className={styles.badge}
        style={{
          backgroundColor: g.guideType === 'walkthrough' ? '#DBEAFE' : g.guideType === 'article' ? '#D1FAE5' : g.guideType === 'video' ? '#FEF3C7' : '#F3F4F6',
          color: g.guideType === 'walkthrough' ? '#1D4ED8' : g.guideType === 'article' ? '#047857' : g.guideType === 'video' ? '#92400E' : '#374151',
        }}
      >
        {g.guideType}
      </span>
    ), sortable: true, width: '110px' },
    { key: 'isActive', header: 'Active', render: (g: IHelpGuide) => g.isActive ? 'Yes' : 'No', sortable: true, width: '70px' },
    { key: 'hasSelector', header: 'Tour Target', render: (g: IHelpGuide) => g.targetSelector ? 'Yes' : 'No', width: '100px' },
    { key: 'sortOrder', header: 'Order', render: (g: IHelpGuide) => String(g.sortOrder), sortable: true, width: '70px' },
  ], [styles.badge]);

  if (isLoadingConfig) {
    return (
      <div className={styles.page}>
        <PageHeader title="Application Support" breadcrumb={<Breadcrumb items={BREADCRUMB_ITEMS} />} />
        <SkeletonLoader variant="form" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Application Support"
        subtitle="Manage support configuration and review help guides"
        breadcrumb={<Breadcrumb items={BREADCRUMB_ITEMS} />}
      />

      {/* Support Configuration */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Support Configuration</h3>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Support Email</label>
            <Input
              value={supportEmail}
              onChange={(_, data) => setSupportEmail(data.value)}
              placeholder="support@company.com"
              type="email"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Support Phone</label>
            <Input
              value={supportPhone}
              onChange={(_, data) => setSupportPhone(data.value)}
              placeholder="(555) 000-0000"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Knowledge Base URL</label>
            <Input
              value={knowledgeBaseUrl}
              onChange={(_, data) => setKnowledgeBaseUrl(data.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Feedback Form URL</label>
            <Input
              value={feedbackFormUrl}
              onChange={(_, data) => setFeedbackFormUrl(data.value)}
              placeholder="https://..."
              type="url"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Response Time (hours)</label>
            <Input
              value={responseTimeHours}
              onChange={(_, data) => setResponseTimeHours(data.value)}
              placeholder="24"
              type="number"
            />
          </div>
        </div>
        <div className={styles.actions}>
          <Button
            appearance="primary"
            icon={isSaving ? <Spinner size="tiny" /> : <SaveRegular />}
            onClick={handleSave}
            disabled={isSaving || !supportEmail.trim()}
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {/* Help Guide Overview */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Help Guide Overview</h3>
        <DataTable
          columns={guideColumns}
          items={guides}
          keyExtractor={(g: IHelpGuide) => String(g.id)}
          isLoading={guidesLoading}
          pageSize={20}
        />
      </div>
    </div>
  );
};
