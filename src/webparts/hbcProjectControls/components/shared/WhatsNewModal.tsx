import * as React from 'react';
import { HBC_COLORS } from '../../theme/tokens';
import { APP_VERSION } from '../../utils/constants';

interface IChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

export const CHANGELOG: IChangelogEntry[] = [
  {
    version: '1.0.0',
    date: '2026-02-07',
    items: [
      'Executive Dashboard with 6 KPI cards, 4 charts, and 3 summary tables',
      'Cross-entity search across leads, estimates, and scorecards',
      '5-tab Admin Panel: connections, roles, feature flags, provisioning, audit log',
      'Audit trail integration across all workflows',
      'Offline status indicator and queue processing',
      'Mobile-responsive layouts and collapsible sidebar',
      'Go/No-Go Scorecard with originator and committee scoring',
      'Estimating Tracker with 4-tab dashboard and pursuit detail forms',
      'Site provisioning engine with 7-step workflow',
      'Meeting scheduler with calendar availability',
      'Pipeline dashboard with stage distribution charts',
      'Role-based access control and feature flags',
    ],
  },
];

const STORAGE_KEY = 'hbc-last-seen-version';

interface IWhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsNewModal: React.FC<IWhatsNewModalProps> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (isOpen) {
      try { localStorage.setItem(STORAGE_KEY, APP_VERSION); } catch { /* ignore */ }
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: HBC_COLORS.navy,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>What's New</span>
            <span style={{
              padding: '2px 10px',
              borderRadius: '12px',
              backgroundColor: HBC_COLORS.orange,
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
            }}>
              v{APP_VERSION}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflow: 'auto', maxHeight: 'calc(80vh - 80px)' }}>
          {CHANGELOG.map(entry => (
            <div key={entry.version} style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy }}>
                  Version {entry.version}
                </span>
                <span style={{ fontSize: '12px', color: HBC_COLORS.gray400 }}>
                  {entry.date}
                </span>
              </div>
              <ul style={{
                margin: 0,
                padding: '0 0 0 20px',
                listStyle: 'none',
              }}>
                {entry.items.map((item, idx) => (
                  <li key={idx} style={{
                    fontSize: '13px',
                    color: HBC_COLORS.gray700,
                    marginBottom: '8px',
                    position: 'relative',
                    paddingLeft: '4px',
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: '-16px',
                      color: HBC_COLORS.orange,
                      fontWeight: 700,
                    }}>
                      &bull;
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export function shouldShowWhatsNew(): boolean {
  try {
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    return lastSeen !== APP_VERSION;
  } catch {
    return false;
  }
}
