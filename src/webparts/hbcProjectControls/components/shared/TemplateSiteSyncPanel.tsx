import * as React from 'react';
import { Button, Spinner } from '@fluentui/react-components';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
  TemplateSyncService,
  IDiffResult,
  ITemplateManifestLog,
  ITemplateSiteConfig,
} from '@hbc/sp-services';
import { useAppContext } from '../contexts/AppContext';
import { HBC_COLORS, SPACING } from '../../theme/tokens';

// Azure Function URL for creating GitHub PRs.
// If empty, the panel operates in mock/simulation mode.
const GITOPS_FUNCTION_URL: string = (() => {
  const maybeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return maybeProcess?.env?.GITOPS_FUNCTION_URL ?? '';
})();

const useStyles = makeStyles({
  root: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    border: `1px solid ${HBC_COLORS.gray200}`,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    color: HBC_COLORS.navy,
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: HBC_COLORS.gray500,
    marginTop: '2px',
  },
  meta: {
    fontSize: '12px',
    color: HBC_COLORS.gray400,
    marginBottom: SPACING.md,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    marginBottom: SPACING.md,
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },
  diffBox: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: HBC_COLORS.gray50,
    borderRadius: '6px',
    border: `1px solid ${HBC_COLORS.gray200}`,
  },
  diffTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: HBC_COLORS.navy,
    marginBottom: '8px',
  },
  diffStats: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
    marginBottom: '8px',
  },
  diffStat: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    minWidth: '60px',
  },
  diffStatValue: {
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  diffStatLabel: {
    fontSize: '11px',
    color: HBC_COLORS.gray500,
    marginTop: '2px',
  },
  noChanges: {
    fontSize: '13px',
    color: HBC_COLORS.success,
    fontWeight: 500,
  },
  messageBar: {
    marginTop: SPACING.sm,
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
  },
  messageSuccess: {
    backgroundColor: HBC_COLORS.successLight,
    color: '#065F46',
  },
  messageError: {
    backgroundColor: HBC_COLORS.errorLight,
    color: '#991B1B',
  },
  prResult: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: HBC_COLORS.successLight,
    borderRadius: '6px',
    border: `1px solid ${HBC_COLORS.success}`,
  },
  prResultTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#065F46',
    marginBottom: '4px',
  },
  prLink: {
    color: HBC_COLORS.navy,
    fontSize: '13px',
    textDecoration: 'underline',
  },
});

interface IPRResult {
  prNumber: number;
  prUrl: string;
  branchName: string;
}

export const TemplateSiteSyncPanel: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();

  const [config, setConfig] = React.useState<ITemplateSiteConfig | null>(null);
  const [configLoading, setConfigLoading] = React.useState(true);
  const [configError, setConfigError] = React.useState<string | null>(null);

  const [diffResult, setDiffResult] = React.useState<IDiffResult | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [checkError, setCheckError] = React.useState<string | null>(null);

  const [creating, setCreating] = React.useState(false);
  const [prResult, setPrResult] = React.useState<IPRResult | null>(null);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Load config on mount
  React.useEffect(() => {
    let cancelled = false;
    setConfigLoading(true);
    setConfigError(null);
    dataService.getTemplateSiteConfig()
      .then(cfg => { if (!cancelled) setConfig(cfg); })
      .catch((err: unknown) => {
        if (!cancelled) setConfigError(err instanceof Error ? err.message : 'Failed to load template site config.');
      })
      .finally(() => { if (!cancelled) setConfigLoading(false); });
    return () => { cancelled = true; };
  }, [dataService]);

  const handleCheckForChanges = React.useCallback(async (): Promise<void> => {
    setChecking(true);
    setCheckError(null);
    setDiffResult(null);
    setPrResult(null);
    setCreateError(null);
    try {
      const syncService = new TemplateSyncService(dataService);
      const diff = await syncService.computeDiff();
      setDiffResult(diff);
    } catch (err: unknown) {
      setCheckError(err instanceof Error ? err.message : 'Failed to compute diff.');
    } finally {
      setChecking(false);
    }
  }, [dataService]);

  const handleCreatePR = React.useCallback(async (): Promise<void> => {
    if (!diffResult) return;
    setCreating(true);
    setCreateError(null);
    setPrResult(null);

    try {
      let result: IPRResult;

      if (!GITOPS_FUNCTION_URL) {
        // Mock/simulation mode — no Azure Function available
        await new Promise<void>(resolve => setTimeout(resolve, 800));
        result = {
          prNumber: 999,
          prUrl: config ? `https://github.com/${config.githubRepoOwner}/${config.githubRepoName}/pull/999` : 'https://github.com/example/project/pull/999',
          branchName: 'templates/sync-mock',
        };
      } else {
        // Real mode — POST to Azure Function
        const body = {
          diffSummary: {
            added: diffResult.added.length,
            modified: diffResult.modified.length,
            removed: diffResult.removed.length,
          },
          triggeredBy: currentUser?.email ?? 'unknown',
        };
        const response = await fetch(`${GITOPS_FUNCTION_URL}/api/create-template-pr`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          throw new Error(`Azure Function returned ${response.status}: ${response.statusText}`);
        }
        result = (await response.json()) as IPRResult;
      }

      // Log the PR creation to SharePoint
      const logEntry: Omit<ITemplateManifestLog, 'id'> = {
        syncDate: new Date().toISOString(),
        triggeredBy: currentUser?.email ?? 'unknown',
        diffSummary: {
          added: diffResult.added.length,
          modified: diffResult.modified.length,
          removed: diffResult.removed.length,
        },
        prNumber: result.prNumber,
        prUrl: result.prUrl,
        status: 'Pending',
      };
      await dataService.logTemplateSyncPR(logEntry);

      setPrResult(result);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create GitHub PR.');
    } finally {
      setCreating(false);
    }
  }, [dataService, diffResult, currentUser]);

  // --- Render states ---

  if (configLoading) {
    return (
      <div
        data-testid="template-site-sync-panel"
        className={styles.root}
        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
      >
        <Spinner size="tiny" />
        <span style={{ fontSize: '13px', color: HBC_COLORS.gray500 }}>Loading template site config...</span>
      </div>
    );
  }

  if (configError) {
    return (
      <div data-testid="template-site-sync-panel" className={styles.root}>
        <div className={`${styles.messageBar} ${styles.messageError}`}>
          {configError}
        </div>
      </div>
    );
  }

  const hasChanges = diffResult?.hasChanges ?? false;

  return (
    <div data-testid="template-site-sync-panel" className={styles.root}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Template Site Sync</h3>
          <p className={styles.subtitle}>
            Detect drift between the live template site and the committed registry, then open a GitHub PR.
          </p>
        </div>
      </div>

      {config && (
        <div className={styles.meta}>
          Repo: <strong>{config.githubRepoOwner}/{config.githubRepoName}</strong>
          {' '}&bull;{' '}
          Branch: <strong>{config.githubBranch}</strong>
          {config.lastSnapshotDate && (
            <>
              {' '}&bull;{' '}
              Last snapshot: <strong>{new Date(config.lastSnapshotDate).toLocaleDateString()}</strong>
            </>
          )}
          {!GITOPS_FUNCTION_URL && (
            <>
              {' '}&bull;{' '}
              <span style={{ color: HBC_COLORS.warning }}>Simulation mode (no function URL configured)</span>
            </>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <Button
          data-testid="check-for-changes-btn"
          appearance="secondary"
          size="small"
          disabled={checking || creating}
          onClick={() => { handleCheckForChanges().catch(console.error); }}
          icon={checking ? <Spinner size="tiny" /> : undefined}
        >
          {checking ? 'Checking...' : 'Check for Changes'}
        </Button>

        {hasChanges && !prResult && (
          <Button
            data-testid="create-pr-btn"
            appearance="primary"
            size="small"
            disabled={creating || checking}
            onClick={() => { handleCreatePR().catch(console.error); }}
            icon={creating ? <Spinner size="tiny" /> : undefined}
            style={{ backgroundColor: HBC_COLORS.navy }}
          >
            {creating ? 'Creating PR...' : 'Create GitHub PR'}
          </Button>
        )}
      </div>

      {checkError && (
        <div className={`${styles.messageBar} ${styles.messageError}`}>
          {checkError}
        </div>
      )}

      {diffResult && (
        <div data-testid="diff-result" className={styles.diffBox}>
          <div className={styles.diffTitle}>Diff Result</div>
          {!hasChanges ? (
            <div className={styles.noChanges}>No changes detected — template site matches committed registry.</div>
          ) : (
            <div className={styles.diffStats}>
              <div className={styles.diffStat}>
                <span className={styles.diffStatValue} style={{ color: HBC_COLORS.success }}>
                  {diffResult.added.length}
                </span>
                <span className={styles.diffStatLabel}>Added</span>
              </div>
              <div className={styles.diffStat}>
                <span className={styles.diffStatValue} style={{ color: HBC_COLORS.info }}>
                  {diffResult.modified.length}
                </span>
                <span className={styles.diffStatLabel}>Modified</span>
              </div>
              <div className={styles.diffStat}>
                <span className={styles.diffStatValue} style={{ color: HBC_COLORS.error }}>
                  {diffResult.removed.length}
                </span>
                <span className={styles.diffStatLabel}>Removed</span>
              </div>
              <div className={styles.diffStat}>
                <span className={styles.diffStatValue} style={{ color: HBC_COLORS.gray400 }}>
                  {diffResult.unchanged.length}
                </span>
                <span className={styles.diffStatLabel}>Unchanged</span>
              </div>
            </div>
          )}
        </div>
      )}

      {createError && (
        <div className={`${styles.messageBar} ${styles.messageError}`}>
          {createError}
        </div>
      )}

      {prResult && (
        <div className={styles.prResult}>
          <div className={styles.prResultTitle}>
            GitHub PR #{prResult.prNumber} created successfully
          </div>
          <div style={{ fontSize: '13px', marginBottom: '4px' }}>
            Branch: <code>{prResult.branchName}</code>
          </div>
          <a
            href={prResult.prUrl}
            target="_blank"
            rel="noreferrer noopener"
            className={styles.prLink}
          >
            {prResult.prUrl}
          </a>
        </div>
      )}
    </div>
  );
};
