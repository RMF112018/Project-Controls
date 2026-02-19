import * as React from 'react';
import {
  Button,
  ProgressBar,
  makeStyles,
  mergeClasses,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';
import { useHbcMotionStyles } from './HbcMotion';
import { useAppContext } from '../contexts/AppContext';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface IToast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  progress?: number;
  actionLabel?: string;
  onAction?: () => void;
  undoLabel?: string;
  onUndo?: () => void;
  contextKey?: string;
}

export interface IToastOptions {
  progress?: number;
  actionLabel?: string;
  onAction?: () => void;
  undoLabel?: string;
  onUndo?: () => void;
  contextKey?: string;
}

interface IToastContext {
  addToast: (message: string, type?: ToastType, duration?: number, options?: IToastOptions) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = React.createContext<IToastContext>({
  addToast: () => '',
  dismissToast: () => { /* noop */ },
});

const useStyles = makeStyles({
  viewport: {
    position: 'fixed',
    top: tokens.spacingVerticalM,
    right: tokens.spacingHorizontalM,
    zIndex: 2000,
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalS),
    maxInlineSize: 'min(96vw, 420px)',
  },
  toast: {
    display: 'grid',
    ...shorthands.gap(tokens.spacingVerticalXS),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow16,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems: 'start',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  message: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  badge: {
    inlineSize: tokens.spacingHorizontalM,
    blockSize: tokens.spacingHorizontalM,
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    marginTop: tokens.spacingVerticalXXS,
  },
  badgeInfo: { backgroundColor: tokens.colorBrandForeground1 },
  badgeSuccess: { backgroundColor: tokens.colorStatusSuccessForeground1 },
  badgeWarning: { backgroundColor: tokens.colorStatusWarningForeground1 },
  badgeError: { backgroundColor: tokens.colorStatusDangerForeground1 },
  actions: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
  dismissBtn: {
    minInlineSize: 'unset',
  },
  progressWrap: {
    inlineSize: '100%',
  },
});

export const useToast = (): IToastContext => React.useContext(ToastContext);

let toastCounter = 0;

function getBadgeClass(
  styles: ReturnType<typeof useStyles>,
  type: ToastType
): string {
  switch (type) {
    case 'success':
      return styles.badgeSuccess;
    case 'warning':
      return styles.badgeWarning;
    case 'error':
      return styles.badgeError;
    case 'info':
    default:
      return styles.badgeInfo;
  }
}

const ToastItem: React.FC<{ toast: IToast; onDismiss: (id: string) => void; enableMotion: boolean }> = ({
  toast,
  onDismiss,
  enableMotion,
}) => {
  const styles = useStyles();
  const motionStyles = useHbcMotionStyles();

  React.useEffect(() => {
    if (toast.duration === 0) {
      return;
    }
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.duration || 4000);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.duration, toast.id]);

  return (
    <div
      role="alert"
      className={mergeClasses(styles.toast, enableMotion && motionStyles.dialogEntrance)}
      aria-label={toast.type}
    >
      <div className={styles.row}>
        <span className={mergeClasses(styles.badge, getBadgeClass(styles, toast.type))} aria-hidden />
        <span className={styles.message}>{toast.message}</span>
        <div className={styles.actions}>
          {toast.actionLabel && toast.onAction ? (
            <Button size="small" appearance="subtle" onClick={() => toast.onAction?.()}>
              {toast.actionLabel}
            </Button>
          ) : null}
          {toast.undoLabel && toast.onUndo ? (
            <Button size="small" appearance="subtle" onClick={() => toast.onUndo?.()}>
              {toast.undoLabel}
            </Button>
          ) : null}
          <Button
            size="small"
            appearance="subtle"
            className={styles.dismissBtn}
            icon={<DismissRegular />}
            aria-label="Dismiss toast"
            onClick={() => onDismiss(toast.id)}
          />
        </div>
      </div>
      {typeof toast.progress === 'number' ? (
        <div className={styles.progressWrap}>
          <ProgressBar value={Math.max(0, Math.min(1, toast.progress / 100))} />
        </div>
      ) : null}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const styles = useStyles();
  const { isFeatureEnabled } = useAppContext();
  const [toasts, setToasts] = React.useState<IToast[]>([]);

  const addToast = React.useCallback((
    message: string,
    type: ToastType = 'success',
    duration?: number,
    options?: IToastOptions
  ): string => {
    const id = `toast-${++toastCounter}`;
    setToasts((prev) => [...prev, { id, message, type, duration, ...options }]);
    return id;
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const enableEnhancements = isFeatureEnabled('uxToastEnhancementsV1');
  const enableMotion = isFeatureEnabled('uxDelightMotionV1');

  return (
    <ToastContext.Provider value={{ addToast, dismissToast }}>
      {children}
      {toasts.length > 0 ? (
        <div aria-live="polite" className={styles.viewport}>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={enableEnhancements ? toast : { ...toast, progress: undefined, actionLabel: undefined, onAction: undefined, undoLabel: undefined, onUndo: undefined }}
              onDismiss={dismissToast}
              enableMotion={enableMotion}
            />
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
};
