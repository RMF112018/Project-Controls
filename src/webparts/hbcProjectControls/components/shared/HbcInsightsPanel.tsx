import * as React from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { useHbcMotionStyles } from './HbcMotion';

export interface IHbcInsightItem {
  id: string;
  title: string;
  description?: string;
  severity?: 'info' | 'warning' | 'critical';
  actionLabel?: string;
  onAction?: () => void;
  isVisible?: boolean;
}

export interface IHbcInsightsPanelProps {
  title?: string;
  items: IHbcInsightItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contextKey?: string;
}

const useStyles = makeStyles({
  surface: {
    inlineSize: 'min(560px, calc(100vw - 2 * 24px))',
    maxBlockSize: 'min(80vh, 760px)',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    boxShadow: tokens.shadow64,
  },
  list: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  item: {
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
  },
  itemInfo: {
    ...shorthands.borderLeft(tokens.strokeWidthThick, 'solid', tokens.colorBrandStroke1),
  },
  itemWarning: {
    ...shorthands.borderLeft(tokens.strokeWidthThick, 'solid', tokens.colorStatusWarningForeground1),
  },
  itemCritical: {
    ...shorthands.borderLeft(tokens.strokeWidthThick, 'solid', tokens.colorStatusDangerForeground1),
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    marginBottom: tokens.spacingVerticalXXS,
  },
  description: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  action: {
    marginTop: tokens.spacingVerticalS,
  },
  empty: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  },
});

function getSeverityClass(styles: ReturnType<typeof useStyles>, severity: IHbcInsightItem['severity']): string {
  switch (severity) {
    case 'warning':
      return styles.itemWarning;
    case 'critical':
      return styles.itemCritical;
    case 'info':
    default:
      return styles.itemInfo;
  }
}

export const HbcInsightsPanel: React.FC<IHbcInsightsPanelProps> = ({
  title = 'Insights',
  items,
  open,
  onOpenChange,
}) => {
  const styles = useStyles();
  const motionStyles = useHbcMotionStyles();
  const visibleItems = React.useMemo(
    () => items.filter((item) => item.isVisible !== false),
    [items]
  );

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface className={`${styles.surface} ${motionStyles.panelEntrance}`}>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <div className={styles.list}>
              {visibleItems.length === 0 ? (
                <div className={styles.empty}>No contextual insights are currently available.</div>
              ) : (
                visibleItems.map((item) => (
                  <section key={item.id} className={`${styles.item} ${getSeverityClass(styles, item.severity)}`}>
                    <div className={styles.title}>{item.title}</div>
                    {item.description ? <div className={styles.description}>{item.description}</div> : null}
                    {item.actionLabel && item.onAction ? (
                      <div className={styles.action}>
                        <Button appearance="subtle" onClick={item.onAction}>{item.actionLabel}</Button>
                      </div>
                    ) : null}
                  </section>
                ))
              )}
            </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default HbcInsightsPanel;
