import * as React from 'react';
import { Switch, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { CollapsibleSection } from '../../shared/CollapsibleSection';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { useAppContext } from '../../contexts/AppContext';
import { useToast } from '../../shared/ToastContainer';
import { AuditAction, EntityType } from '@hbc/sp-services';
import type { IFeatureFlag, FeatureFlagCategory } from '@hbc/sp-services';

const CATEGORY_ORDER: ReadonlyArray<FeatureFlagCategory | 'Other'> = [
  'Core Platform',
  'Preconstruction',
  'Project Execution',
  'Infrastructure',
  'Integrations',
  'Debug',
  'Other',
];

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('16px', '0'),
    display: 'grid',
    ...shorthands.gap('8px'),
  },
  flagRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
  },
  flagInfo: {
    display: 'grid',
    ...shorthands.gap('2px'),
    flex: '1 1 auto',
    minWidth: 0,
  },
  flagDisplayName: {
    fontWeight: 600 as const,
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
  },
  flagFeatureName: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  flagNotes: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
  },
  badgePill: {
    display: 'inline-block',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '11px',
    fontWeight: 500 as const,
    color: tokens.colorNeutralForeground3,
    backgroundColor: tokens.colorNeutralBackground3,
  },
});

export const FeatureFlagsPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const { addToast } = useToast();

  const [flags, setFlags] = React.useState<IFeatureFlag[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [togglingId, setTogglingId] = React.useState<number | null>(null);

  const fetchFlags = React.useCallback(() => {
    setLoading(true);
    dataService.getFeatureFlags()
      .then(result => setFlags(result))
      .catch(() => setFlags([]))
      .finally(() => setLoading(false));
  }, [dataService]);

  React.useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggle = React.useCallback(async (flag: IFeatureFlag) => {
    setTogglingId(flag.id);
    const nextEnabled = !flag.Enabled;
    try {
      await dataService.updateFeatureFlag(flag.id, { Enabled: nextEnabled });
      await dataService.logAudit({
        Action: AuditAction.ConfigFeatureFlagChanged,
        EntityType: EntityType.Config,
        EntityId: String(flag.id),
        User: currentUser?.email || 'unknown',
        Details: `Feature "${flag.FeatureName}" ${nextEnabled ? 'enabled' : 'disabled'}`,
      });
      addToast(`"${flag.DisplayName}" ${nextEnabled ? 'enabled' : 'disabled'}.`, 'success');
      fetchFlags();
    } catch {
      addToast('Failed to toggle feature flag.', 'error');
    } finally {
      setTogglingId(null);
    }
  }, [dataService, currentUser, addToast, fetchFlags]);

  const groupedFlags = React.useMemo(() => {
    const groups = new Map<string, IFeatureFlag[]>();
    for (const category of CATEGORY_ORDER) {
      groups.set(category, []);
    }
    for (const flag of flags) {
      const category = flag.Category || 'Other';
      const existing = groups.get(category);
      if (existing) {
        existing.push(flag);
      } else {
        const otherGroup = groups.get('Other');
        if (otherGroup) {
          otherGroup.push(flag);
        }
      }
    }
    return groups;
  }, [flags]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Feature Flags" />
        <div className={styles.container}>
          <HbcSkeleton variant="text" rows={5} />
          <HbcSkeleton variant="text" rows={5} />
          <HbcSkeleton variant="text" rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        subtitle="Toggle application features by category. Changes take effect immediately."
      />
      <div className={styles.container}>
        {CATEGORY_ORDER.map(category => {
          const categoryFlags = groupedFlags.get(category) || [];
          if (categoryFlags.length === 0) return null;
          const enabledCount = categoryFlags.filter(f => f.Enabled).length;
          return (
            <CollapsibleSection
              key={category}
              title={category}
              badge={
                <span className={styles.badgePill}>
                  {enabledCount} of {categoryFlags.length} enabled
                </span>
              }
            >
              {categoryFlags.map(flag => (
                <div key={flag.id} className={styles.flagRow}>
                  <Switch
                    checked={flag.Enabled}
                    disabled={togglingId === flag.id}
                    onChange={() => handleToggle(flag)}
                    aria-label={`Toggle ${flag.DisplayName}`}
                  />
                  <div className={styles.flagInfo}>
                    <span className={styles.flagDisplayName}>{flag.DisplayName}</span>
                    <span className={styles.flagFeatureName}>{flag.FeatureName}</span>
                    {flag.Notes && <span className={styles.flagNotes}>{flag.Notes}</span>}
                  </div>
                </div>
              ))}
            </CollapsibleSection>
          );
        })}
      </div>
    </div>
  );
};
