import * as React from 'react';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';

interface ISlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
  children: React.ReactNode;
}

export const SlideDrawer: React.FC<ISlideDrawerProps> = ({
  isOpen,
  onClose,
  title,
  width = 420,
  children,
}) => {
  const triggerRef = React.useRef<Element | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();

  // Save trigger element on open; restore focus on close
  React.useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      // Focus close button after render
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    } else if (triggerRef.current) {
      (triggerRef.current as HTMLElement).focus?.();
      triggerRef.current = null;
    }
  }, [isOpen]);

  // Close on Escape + focus trap
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableEls = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableEls.length === 0) return;
        const first = focusableEls[0];
        const last = focusableEls[focusableEls.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.35)',
          zIndex: 1100,
        }}
      />
      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Details'}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${width}px`,
          maxWidth: '90vw',
          backgroundColor: '#fff',
          boxShadow: ELEVATION.level4,
          zIndex: 1101,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideDrawerIn 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${HBC_COLORS.gray200}`,
            flexShrink: 0,
          }}
        >
          {title && (
            <h3 id={titleId} style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: HBC_COLORS.navy }}>{title}</h3>
          )}
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: HBC_COLORS.gray500,
              padding: '4px 8px',
              borderRadius: 4,
              marginLeft: 'auto',
            }}
          >
            {'\u2715'}
          </button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes slideDrawerIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes slideDrawerIn {
            from { transform: translateX(0); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        }
      `}</style>
    </>
  );
};
