import * as React from 'react';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface IToast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface IToastContext {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = React.createContext<IToastContext>({
  addToast: () => { /* noop */ },
});

export const useToast = (): IToastContext => React.useContext(ToastContext);

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: HBC_COLORS.successLight, border: HBC_COLORS.success, icon: '\u2713' },
  error: { bg: HBC_COLORS.errorLight, border: HBC_COLORS.error, icon: '\u2715' },
  warning: { bg: HBC_COLORS.warningLight, border: HBC_COLORS.warning, icon: '\u26A0' },
  info: { bg: HBC_COLORS.infoLight, border: HBC_COLORS.info, icon: '\u2139' },
};

let toastCounter = 0;

const ToastItem: React.FC<{ toast: IToast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const colors = TOAST_COLORS[toast.type];

  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        backgroundColor: colors.bg,
        borderLeft: `4px solid ${colors.border}`,
        borderRadius: '6px',
        boxShadow: ELEVATION.level2,
        fontSize: '14px',
        color: HBC_COLORS.gray800,
        animation: 'toastSlideIn 0.25s ease-out',
        maxWidth: '400px',
      }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0 }}>{colors.icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          color: HBC_COLORS.gray500,
          padding: '2px 4px',
          flexShrink: 0,
        }}
      >
        {'\u2715'}
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<IToast[]>([]);

  const addToast = React.useCallback((message: string, type: ToastType = 'success', duration?: number) => {
    const id = `toast-${++toastCounter}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {toasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>
      )}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes toastSlideIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
