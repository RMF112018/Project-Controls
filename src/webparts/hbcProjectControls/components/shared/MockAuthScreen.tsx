import * as React from 'react';
import {
  Button,
  Card,
  RadioGroup,
  Radio,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { RoleName, ROLE_LANDING_ROUTES } from '@hbc/sp-services';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  [RoleName.Administrator]: 'Full system configuration, provisioning, and user management',
  [RoleName.Leadership]: 'Enterprise-wide oversight via Main Hub Dashboard',
  [RoleName.MarketingManager]: 'Marketing resources, requests, and tracking',
  [RoleName.PreconstructionManager]: 'Preconstruction pipeline and estimating oversight',
  [RoleName.BusinessDevelopmentManager]: 'Lead management, Go/No-Go, and pipeline',
  [RoleName.Estimator]: 'Estimate tracking, department tracking, and kick-offs',
  [RoleName.IDSManager]: 'Innovation & Digital Services tracking',
  [RoleName.CommercialOperationsManager]: 'Commercial project operations and delivery',
  [RoleName.LuxuryResidentialManager]: 'Luxury residential project operations',
  [RoleName.ManagerOfOperationalExcellence]: 'Operational excellence, onboarding, and training',
  [RoleName.SafetyManager]: 'Safety program management and compliance',
  [RoleName.QualityControlManager]: 'QC programs, inspections, and best practices',
  [RoleName.WarrantyManager]: 'Warranty tracking and resolution',
  [RoleName.HumanResourcesManager]: 'People & culture, openings, and initiatives',
  [RoleName.AccountingManager]: 'Accounts receivable, new project setup',
  [RoleName.RiskManager]: 'Risk management, knowledge center, and enrollment',
};

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F3F4F6',
    ...shorthands.padding('24px'),
  },
  header: {
    backgroundColor: '#1B2A4A',
    color: '#FFFFFF',
    width: '100%',
    ...shorthands.padding('16px', '24px'),
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
  },
  brandName: {
    fontWeight: '700',
    fontSize: '18px',
  },
  brandSub: {
    fontSize: '14px',
    opacity: 0.85,
  },
  card: {
    maxWidth: '560px',
    width: '100%',
    marginTop: '80px',
    ...shorthands.padding('32px'),
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    marginBottom: '24px',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
    maxHeight: '420px',
    overflowY: 'auto',
    ...shorthands.padding('4px', '0'),
  },
  radioItem: {
    display: 'flex',
    alignItems: 'flex-start',
  },
  roleDescription: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    marginLeft: '28px',
    marginTop: '-4px',
    marginBottom: '4px',
  },
  landingRoute: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'flex-end',
    width: '100%',
  },
});

export interface IMockAuthScreenProps {
  onRoleSelect: (role: RoleName) => void;
}

export const MockAuthScreen: React.FC<IMockAuthScreenProps> = ({ onRoleSelect }) => {
  const styles = useStyles();
  const [selectedRole, setSelectedRole] = React.useState<RoleName | ''>('');

  const handleContinue = React.useCallback(() => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
    }
  }, [selectedRole, onRoleSelect]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.brandName}>HBC</span>
        <span className={styles.brandSub}>Project Controls</span>
      </div>

      <Card className={styles.card}>
        <div className={styles.title}>Select Your Role</div>
        <div className={styles.subtitle}>
          Choose a role to enter the application. Every role has full admin-level access for pre-deployment testing.
        </div>

        <RadioGroup
          className={styles.radioGroup}
          value={selectedRole}
          onChange={(_e, data) => setSelectedRole(data.value as RoleName)}
          data-testid="role-picker"
        >
          {Object.values(RoleName).map((role) => (
            <div key={role}>
              <Radio
                className={styles.radioItem}
                value={role}
                label={role}
                data-testid={`role-option-${role}`}
              />
              <div className={styles.roleDescription}>
                {ROLE_DESCRIPTIONS[role]}{' '}
                <span className={styles.landingRoute}>
                  → {ROLE_LANDING_ROUTES[role] ?? '/'}
                </span>
              </div>
            </div>
          ))}
        </RadioGroup>

        <div className={styles.footer}>
          <Button
            appearance="primary"
            disabled={!selectedRole}
            onClick={handleContinue}
            data-testid="role-continue-btn"
          >
            Continue as {selectedRole || '...'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
