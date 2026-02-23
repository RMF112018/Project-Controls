/**
 * ProjectNumberRequestForm — New Project Request Form (Phase 4E)
 *
 * Fluent UI v9 form with exact fields/options from plan spec.
 * Two submit buttons: "Submit (recommended)" → TYPICAL, "Submit and Create Site" → ALTERNATE.
 * Pre-populates when editing existing request (via $requestId route param).
 */
import * as React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Input,
  Dropdown,
  Option,
  RadioGroup,
  Radio,
  Divider,
  Text,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { HbcField } from '../../shared/HbcField';
import { HbcButton } from '../../shared/HbcButton';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';
import { useAppNavigate } from '../../hooks/router/useAppNavigate';
import { useAppParams } from '../../hooks/router/useAppParams';
import type { IJobNumberRequest } from '@hbc/sp-services';

// ── Exact Options from Plan Spec ────────────────────────────────────

const PROJECT_EXECUTIVES = [
  'Bob Cashin',
  'Joe Keating',
  'Duke Snyder',
  'Joe Morin',
  'Art Miller',
  'Dale Hedrick',
  'Gene Parker',
  'Burk Hedrick',
  'Ryan Hutchins - Commercial Estimating',
  'Chai Banthia - Residential Estimating',
  'Robin Lunsford',
  'Paul Faulks',
  'Matt Zaryk',
  'Bobby Fetting',
] as const;

const OFFICE_DIVISIONS = [
  { code: '01-10', label: 'Luxury Residential (01-10)' },
  { code: '01-41', label: 'HB HQ Aerospace (01-41)' },
  { code: '01-43', label: 'HB HQ General Commercial (01-43)' },
  { code: '01-44', label: 'HB HQ Country Clubs & Hospitality (01-44)' },
  { code: '01-45', label: 'HB HQ Educational & Municipal (01-45)' },
  { code: '01-48', label: 'HB HQ Multi-Family (01-48)' },
  { code: '01-51', label: 'South Aerospace (01-51)' },
  { code: '01-53', label: 'South General Commercial (01-53)' },
  { code: '01-44s', label: 'South Country Clubs & Hospitality (01-44)' },
  { code: '01-55', label: 'South Educational & Municipal (01-55)' },
  { code: '01-58', label: 'South Multi-Family (01-58)' },
  { code: '01-61', label: 'Central Aerospace (01-61)' },
  { code: '01-63', label: 'Central General Commercial (01-63)' },
  { code: '01-64', label: 'Central Country Clubs & Hospitality (01-64)' },
  { code: '01-65', label: 'Central Educational & Municipal (01-65)' },
  { code: '01-68', label: 'Central Multi-Family (01-68)' },
  { code: '01-31', label: 'Space Coast Aerospace (01-31)' },
  { code: '01-33', label: 'Space Coast General Commercial (01-33)' },
  { code: '01-34', label: 'Space Coast Country Clubs & Hospitality (01-34)' },
  { code: '01-35', label: 'Space Coast Educational & Municipal (01-35)' },
  { code: '01-38', label: 'Space Coast Multi-Family (01-38)' },
] as const;

// ── Form Data Interface ─────────────────────────────────────────────
interface IProjectNumberFormData {
  email: string;
  date: string;
  projectName: string;
  streetAddress: string;
  cityState: string;
  zipCode: string;
  county: string;
  projectExecutive: string;
  officeDivision: string;
  projectManager: string;
  managedInProcore: string;
  additionalSageAccess: string;
  timberscanApprover: string;
}

// ── Styles (Griffel + tokens — 4.75/10 elevation) ───────────────────
const useStyles = makeStyles({
  formCard: {
    maxWidth: '800px',
    ...shorthands.margin('0', 'auto'),
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    ...shorthands.gap(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    ...shorthands.margin(tokens.spacingVerticalL, '0', tokens.spacingVerticalS),
    display: 'block',
  },
  dividerSection: {
    ...shorthands.margin(tokens.spacingVerticalXL, '0', tokens.spacingVerticalM),
  },
  actions: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalL, '0', '0'),
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  backButton: {
    marginBottom: tokens.spacingVerticalM,
  },
  errorBar: {
    marginBottom: tokens.spacingVerticalM,
  },
});

// ── Component ───────────────────────────────────────────────────────
export const ProjectNumberRequestForm: React.FC = () => {
  const styles = useStyles();
  const { dataService, currentUser } = useAppContext();
  const navigate = useAppNavigate();
  const params = useAppParams();
  const { addToast } = useToast();

  const requestId = (params as Record<string, string>).requestId;
  const isEditing = Boolean(requestId);

  // ── Form State ────────────────────────────────────────────────────
  const [formData, setFormData] = React.useState<IProjectNumberFormData>({
    email: currentUser?.email ?? '',
    date: new Date().toISOString().split('T')[0],
    projectName: '',
    streetAddress: '',
    cityState: '',
    zipCode: '',
    county: '',
    projectExecutive: '',
    officeDivision: '',
    projectManager: '',
    managedInProcore: '',
    additionalSageAccess: '',
    timberscanApprover: '',
  });

  const [submitting, setSubmitting] = React.useState<'typical' | 'alternate' | null>(null);
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});
  const [loadingExisting, setLoadingExisting] = React.useState(isEditing);

  // ── Pre-populate from existing request ────────────────────────────
  React.useEffect(() => {
    if (!requestId) return;
    dataService.getJobNumberRequestById(Number(requestId))
      .then((request: IJobNumberRequest | null) => {
        if (request) {
          setFormData({
            email: request.Email ?? request.Originator ?? '',
            date: request.RequestDate ?? '',
            projectName: request.ProjectName ?? '',
            streetAddress: request.StreetAddress ?? '',
            cityState: request.CityState ?? '',
            zipCode: request.ZipCode ?? '',
            county: request.County ?? '',
            projectExecutive: request.ProjectExecutive ?? '',
            officeDivision: request.OfficeDivision ?? '',
            projectManager: request.ProjectManager ?? '',
            managedInProcore: request.ManagedInProcore === true ? 'yes' : request.ManagedInProcore === false ? 'no' : '',
            additionalSageAccess: request.AdditionalSageAccess ?? '',
            timberscanApprover: request.TimberscanApprover ?? '',
          });
        }
      })
      .catch(() => {
        addToast('Failed to load request details.', 'error');
      })
      .finally(() => setLoadingExisting(false));
  }, [requestId, dataService, addToast]);

  // ── Field Change Handler ──────────────────────────────────────────
  const handleChange = React.useCallback((field: keyof IProjectNumberFormData) =>
    (_: unknown, data: { value: string }) => {
      setFormData(prev => ({ ...prev, [field]: data.value }));
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
  []);

  // ── Validation ────────────────────────────────────────────────────
  const validate = React.useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.projectName.trim()) errors.projectName = 'Project Name is required';
    if (!formData.streetAddress.trim()) errors.streetAddress = 'Street Address is required';
    if (!formData.cityState.trim()) errors.cityState = 'City, State is required';
    if (!formData.zipCode.trim()) errors.zipCode = 'Zip Code is required';
    if (!formData.county.trim()) errors.county = 'County is required';
    if (!formData.projectExecutive) errors.projectExecutive = 'Project Executive is required';
    if (!formData.officeDivision) errors.officeDivision = 'Office & Division is required';
    return errors;
  }, [formData]);

  // ── Submit Handler ────────────────────────────────────────────────
  const handleSubmit = React.useCallback(async (workflowType: 'typical' | 'alternate') => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      addToast('Please fill in all required fields.', 'warning');
      return;
    }

    setSubmitting(workflowType);
    try {
      const selectedDivision = OFFICE_DIVISIONS.find(d => d.code === formData.officeDivision);
      const requestData: Partial<IJobNumberRequest> = {
        Email: formData.email.trim(),
        RequestDate: formData.date,
        ProjectName: formData.projectName.trim(),
        StreetAddress: formData.streetAddress.trim(),
        ProjectAddress: formData.streetAddress.trim(),
        CityState: formData.cityState.trim(),
        ZipCode: formData.zipCode.trim(),
        County: formData.county.trim(),
        ProjectExecutive: formData.projectExecutive,
        OfficeDivision: formData.officeDivision,
        OfficeDivisionLabel: selectedDivision?.label ?? formData.officeDivision,
        ProjectManager: formData.projectManager.trim() || undefined,
        ManagedInProcore: formData.managedInProcore === 'yes' ? true : formData.managedInProcore === 'no' ? false : undefined,
        AdditionalSageAccess: formData.additionalSageAccess.trim() || undefined,
        TimberscanApprover: formData.timberscanApprover.trim() || undefined,
        Originator: currentUser?.email ?? '',
        SubmittedBy: currentUser?.displayName ?? currentUser?.email ?? '',
      };

      await dataService.submitProjectNumberRequest(requestData, workflowType);
      addToast(
        workflowType === 'typical'
          ? 'Request submitted. Notification sent to Controller.'
          : 'Request submitted. Site provisioning initiated.',
        'success'
      );
      navigate('/preconstruction/project-number-requests');
    } catch {
      addToast('Failed to submit request. Please try again.', 'error');
    } finally {
      setSubmitting(null);
    }
  }, [formData, validate, dataService, currentUser, navigate, addToast]);

  // ── Back Navigation ───────────────────────────────────────────────
  const onBack = React.useCallback(() => {
    navigate('/preconstruction/project-number-requests');
  }, [navigate]);

  // ── Loading State ─────────────────────────────────────────────────
  if (loadingExisting) {
    return (
      <div>
        <PageHeader title="Project Number Request" />
        <div className={styles.formCard}>
          <HbcCard title="Loading...">
            <div>Loading request details...</div>
          </HbcCard>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  const hasErrors = Object.keys(validationErrors).length > 0;

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit Project Number Request' : 'New Project Number Request'}
        subtitle="Submit a request for a new project number and SharePoint site."
      />

      <HbcButton
        emphasis="subtle"
        icon={<ArrowLeft24Regular />}
        onClick={onBack}
        className={styles.backButton}
      >
        Back to Tracking Log
      </HbcButton>

      <div className={styles.formCard}>
        <HbcCard title="Request Details">
          {hasErrors && (
            <MessageBar intent="error" className={styles.errorBar}>
              <MessageBarBody>Please correct the highlighted fields below.</MessageBarBody>
            </MessageBar>
          )}

          {/* ── Required Fields ── */}
          <Text className={styles.sectionTitle}>Required Information</Text>

          <div className={styles.fieldGrid}>
            <HbcField label="Email" required validationMessage={validationErrors.email}>
              <Input
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="your.email@hedrickbrothers.com"
              />
            </HbcField>

            <HbcField label="Date" required validationMessage={validationErrors.date}>
              <Input
                type="date"
                value={formData.date}
                onChange={handleChange('date')}
              />
            </HbcField>

            <HbcField label="Project Name" required validationMessage={validationErrors.projectName}>
              <Input
                value={formData.projectName}
                onChange={handleChange('projectName')}
                placeholder="Enter project name"
              />
            </HbcField>

            <HbcField label="Street Address" required validationMessage={validationErrors.streetAddress}>
              <Input
                value={formData.streetAddress}
                onChange={handleChange('streetAddress')}
                placeholder="Enter street address"
              />
            </HbcField>

            <HbcField label="City, State" required validationMessage={validationErrors.cityState}>
              <Input
                value={formData.cityState}
                onChange={handleChange('cityState')}
                placeholder="e.g. West Palm Beach, FL"
              />
            </HbcField>

            <HbcField label="Zip Code" required validationMessage={validationErrors.zipCode}>
              <Input
                value={formData.zipCode}
                onChange={handleChange('zipCode')}
                placeholder="e.g. 33401"
              />
            </HbcField>

            <HbcField label="County" required validationMessage={validationErrors.county}>
              <Input
                value={formData.county}
                onChange={handleChange('county')}
                placeholder="e.g. Palm Beach"
              />
            </HbcField>

            <HbcField label="Project Executive" required validationMessage={validationErrors.projectExecutive}>
              <Dropdown
                value={formData.projectExecutive}
                selectedOptions={formData.projectExecutive ? [formData.projectExecutive] : []}
                onOptionSelect={(_, data) => {
                  setFormData(prev => ({ ...prev, projectExecutive: data.optionValue ?? '' }));
                  setValidationErrors(prev => {
                    const next = { ...prev };
                    delete next.projectExecutive;
                    return next;
                  });
                }}
                placeholder="Select Project Executive"
              >
                {PROJECT_EXECUTIVES.map(name => (
                  <Option key={name} value={name}>{name}</Option>
                ))}
              </Dropdown>
            </HbcField>

            <div className={styles.fullWidth}>
              <HbcField label="Office & Division" required validationMessage={validationErrors.officeDivision}>
                <Dropdown
                  value={OFFICE_DIVISIONS.find(d => d.code === formData.officeDivision)?.label ?? ''}
                  selectedOptions={formData.officeDivision ? [formData.officeDivision] : []}
                  onOptionSelect={(_, data) => {
                    setFormData(prev => ({ ...prev, officeDivision: data.optionValue ?? '' }));
                    setValidationErrors(prev => {
                      const next = { ...prev };
                      delete next.officeDivision;
                      return next;
                    });
                  }}
                  placeholder="Select Office & Division"
                >
                  {OFFICE_DIVISIONS.map(div => (
                    <Option key={div.code} value={div.code}>{div.label}</Option>
                  ))}
                </Dropdown>
              </HbcField>
            </div>
          </div>

          {/* ── Optional Fields ── */}
          <div className={styles.dividerSection}>
            <Divider />
          </div>
          <Text className={styles.sectionTitle}>Optional Information</Text>

          <div className={styles.fieldGrid}>
            <HbcField label="Project Manager">
              <Input
                value={formData.projectManager}
                onChange={handleChange('projectManager')}
                placeholder="Enter project manager name"
              />
            </HbcField>

            <HbcField label="Will this project be managed in Procore?">
              <RadioGroup
                value={formData.managedInProcore}
                onChange={(_, data) => setFormData(prev => ({ ...prev, managedInProcore: data.value }))}
                layout="horizontal"
              >
                <Radio value="yes" label="Yes" />
                <Radio value="no" label="No" />
              </RadioGroup>
            </HbcField>

            <div className={styles.fullWidth}>
              <HbcField
                label="In addition to the above PX & PM, who else needs access to this project in SAGE?"
                hint="Enter additional names or emails"
              >
                <Input
                  value={formData.additionalSageAccess}
                  onChange={handleChange('additionalSageAccess')}
                  placeholder="Enter names or emails"
                />
              </HbcField>
            </div>

            <div className={styles.fullWidth}>
              <HbcField label="Who will approve Timberscan invoices/pay apps?">
                <Input
                  value={formData.timberscanApprover}
                  onChange={handleChange('timberscanApprover')}
                  placeholder="Enter name"
                />
              </HbcField>
            </div>
          </div>

          {/* ── Submit Buttons ── */}
          <div className={styles.actions}>
            <HbcButton
              emphasis="strong"
              isLoading={submitting === 'typical'}
              disabled={submitting !== null}
              onClick={() => handleSubmit('typical')}
            >
              Submit (recommended)
            </HbcButton>
            <HbcButton
              emphasis="default"
              isLoading={submitting === 'alternate'}
              disabled={submitting !== null}
              onClick={() => handleSubmit('alternate')}
            >
              Submit and Create Site
            </HbcButton>
          </div>
        </HbcCard>
      </div>
    </div>
  );
};
