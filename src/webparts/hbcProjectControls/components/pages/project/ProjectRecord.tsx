import {
  PERMISSIONS,
  IMarketingProjectRecord,
  AuditAction,
  EntityType,
  formatCurrency,
  formatDate,
  buildBreadcrumbs,
  PROJECT_RECORD_SECTIONS,
  OPS_EDITABLE_SECTIONS,
  PROJECT_RECORD_CONTRACT_TYPES,
  PROJECT_RECORD_DELIVERY_METHODS
} from '@hbc/sp-services';
import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useMarketingRecord } from '../../hooks/useMarketingRecord';
import { useAppContext } from '../../contexts/AppContext';
import { PageHeader } from '../../shared/PageHeader';
import { Breadcrumb } from '../../shared/Breadcrumb';
import { SkeletonLoader } from '../../shared/SkeletonLoader';
import { ExportButtons } from '../../shared/ExportButtons';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

// ---------------------------------------------------------------------------
// Section field mappings for completion calculation
// ---------------------------------------------------------------------------
const SECTION_FIELDS: Record<string, (keyof IMarketingProjectRecord)[]> = {
  projectInfo: ['projectName', 'projectCode', 'contractType', 'deliveryMethod', 'architect', 'landscapeArchitect', 'interiorDesigner', 'engineer'],
  description: ['buildingSystemType', 'projectDescription', 'uniqueCharacteristics', 'renderingUrls', 'finalPhotoUrls'],
  budget: [
    'contractBudget', 'contractFinalCost', 'totalCostPerGSF', 'totalBudgetVariance', 'budgetExplanation',
    'CO_OwnerDirected_Count', 'CO_OwnerDirected_Value', 'CO_MunicipalityDirected_Count', 'CO_MunicipalityDirected_Value',
    'CO_EO_Count', 'CO_EO_Value', 'CO_ContractorDirected_Count', 'savingsReturned', 'savingsReturnedPct',
  ],
  schedule: [
    'scheduleStartAnticipated', 'scheduleStartActual', 'scheduleEndAnticipated', 'scheduleEndActual',
    'onSchedule', 'scheduleExplanation', 'substantialCompletionDate', 'finalCompletionDate',
  ],
  qc: ['punchListItems', 'punchListDaysToComplete'],
  safety: ['innovativeSafetyPrograms'],
  supplierDiversity: ['mwbeRequirement', 'mwbeAchievement', 'sbeRequirement', 'sbeAchievement', 'localRequirement', 'localAchievement'],
  sustainability: ['leedDesignation', 'sustainabilityFeatures', 'leedAdditionalCost'],
  caseStudy: [
    'CS_Conflicts', 'CS_CostControl', 'CS_ValueEngineering', 'CS_QualityControl', 'CS_Schedule',
    'CS_Team', 'CS_Safety', 'CS_LEED', 'CS_SupplierDiversity', 'CS_Challenges',
    'CS_InnovativeSolutions', 'CS_ProductsSystems', 'CS_ClientService', 'CS_LessonsLearned',
  ],
};

const CASE_STUDY_LABELS: Record<string, string> = {
  CS_Conflicts: 'Conflicts',
  CS_CostControl: 'Cost Control',
  CS_ValueEngineering: 'Value Engineering',
  CS_QualityControl: 'Quality Control',
  CS_Schedule: 'Schedule',
  CS_Team: 'Team',
  CS_Safety: 'Safety',
  CS_LEED: 'LEED',
  CS_SupplierDiversity: 'Supplier Diversity',
  CS_Challenges: 'Challenges',
  CS_InnovativeSolutions: 'Innovative Solutions',
  CS_ProductsSystems: 'Products/Systems',
  CS_ClientService: 'Client Service',
  CS_LessonsLearned: 'Lessons Learned',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const cardStyle: React.CSSProperties = {
  backgroundColor: HBC_COLORS.white,
  borderRadius: '8px',
  boxShadow: ELEVATION.level1,
  padding: '24px',
  marginBottom: '16px',
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  border: `1px solid ${HBC_COLORS.gray300}`,
  borderRadius: '4px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: '80px',
  resize: 'vertical',
};

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: HBC_COLORS.gray500,
  display: 'block',
  marginBottom: '4px',
};

const fieldWrap: React.CSSProperties = { marginBottom: '12px' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0 && value.some(v => v !== '');
  if (typeof value === 'number') return true;
  return true;
}

function computeSectionCompletion(record: IMarketingProjectRecord, sectionKey: string): number {
  const fields = SECTION_FIELDS[sectionKey];
  if (!fields || fields.length === 0) return 0;
  const filled = fields.filter(f => isFieldFilled((record as unknown as Record<string, unknown>)[f])).length;
  return Math.round((filled / fields.length) * 100);
}

function completionColor(pct: number): string {
  if (pct > 75) return HBC_COLORS.success;
  if (pct > 50) return HBC_COLORS.warning;
  return HBC_COLORS.error;
}

function getEmptyRecord(projectName: string, projectCode: string): IMarketingProjectRecord {
  return {
    projectName,
    projectCode,
    leadId: null,
    contractType: [],
    deliveryMethod: '',
    architect: '',
    landscapeArchitect: '',
    interiorDesigner: '',
    engineer: '',
    buildingSystemType: '',
    projectDescription: '',
    uniqueCharacteristics: '',
    renderingUrls: [],
    finalPhotoUrls: [],
    contractBudget: null,
    contractFinalCost: null,
    totalCostPerGSF: null,
    totalBudgetVariance: null,
    budgetExplanation: '',
    CO_OwnerDirected_Count: null,
    CO_OwnerDirected_Value: null,
    CO_MunicipalityDirected_Count: null,
    CO_MunicipalityDirected_Value: null,
    CO_EO_Count: null,
    CO_EO_Value: null,
    CO_ContractorDirected_Count: null,
    savingsReturned: null,
    savingsReturnedPct: null,
    scheduleStartAnticipated: null,
    scheduleStartActual: null,
    scheduleEndAnticipated: null,
    scheduleEndActual: null,
    onSchedule: '',
    scheduleExplanation: '',
    substantialCompletionDate: null,
    finalCompletionDate: null,
    punchListItems: null,
    punchListDaysToComplete: null,
    innovativeSafetyPrograms: '',
    mwbeRequirement: '',
    mwbeAchievement: '',
    sbeRequirement: '',
    sbeAchievement: '',
    localRequirement: '',
    localAchievement: '',
    leedDesignation: '',
    sustainabilityFeatures: '',
    leedAdditionalCost: null,
    CS_Conflicts: '',
    CS_CostControl: '',
    CS_ValueEngineering: '',
    CS_QualityControl: '',
    CS_Schedule: '',
    CS_Team: '',
    CS_Safety: '',
    CS_LEED: '',
    CS_SupplierDiversity: '',
    CS_Challenges: '',
    CS_InnovativeSolutions: '',
    CS_ProductsSystems: '',
    CS_ClientService: '',
    CS_LessonsLearned: '',
    sectionCompletion: {},
    overallCompletion: 0,
    lastUpdatedBy: '',
    lastUpdatedAt: '',
    createdBy: '',
    createdAt: '',
  };
}

// ---------------------------------------------------------------------------
// Completion Circle sub-component
// ---------------------------------------------------------------------------
const CompletionCircle: React.FC<{ pct: number }> = ({ pct }) => {
  const color = completionColor(pct);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: `3px solid ${color}`,
        fontSize: '11px',
        fontWeight: 700,
        color,
        flexShrink: 0,
      }}
    >
      {pct}%
    </span>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export const ProjectRecord: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = buildBreadcrumbs(location.pathname);
  const { selectedProject, hasPermission, currentUser, dataService } = useAppContext();
  const { record, isLoading, fetchRecord, updateRecord, createRecord } = useMarketingRecord();

  const [localRecord, setLocalRecord] = React.useState<IMarketingProjectRecord | null>(null);
  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = React.useState<string>(PROJECT_RECORD_SECTIONS[0].key);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  // RBAC
  const canEditAll = hasPermission(PERMISSIONS.PROJECT_RECORD_EDIT);
  const canEditOps = hasPermission(PERMISSIONS.PROJECT_RECORD_OPS_EDIT);
  const canEditSection = (sectionKey: string): boolean =>
    canEditAll || (canEditOps && OPS_EDITABLE_SECTIONS.includes(sectionKey));

  // Fetch on mount
  React.useEffect(() => {
    if (selectedProject?.projectCode) {
      fetchRecord(selectedProject?.projectCode).catch(console.error);
    }
  }, [selectedProject?.projectCode, fetchRecord]);

  // Sync fetched record to local state
  React.useEffect(() => {
    if (record) {
      setLocalRecord({ ...record });
    }
  }, [record]);

  // ---------------------------------------------------------------------------
  // Field change helpers
  // ---------------------------------------------------------------------------
  const handleFieldChange = (field: keyof IMarketingProjectRecord, value: unknown): void => {
    if (!localRecord) return;
    setLocalRecord(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleBlurSave = async (field: keyof IMarketingProjectRecord): Promise<void> => {
    if (!localRecord || !selectedProject?.projectCode) return;
    const currentVal = (localRecord as unknown as Record<string, unknown>)[field];
    const origVal = record ? (record as unknown as Record<string, unknown>)[field] : undefined;
    if (JSON.stringify(currentVal) === JSON.stringify(origVal)) return;

    try {
      setIsSaving(true);
      await updateRecord(selectedProject?.projectCode, { [field]: currentVal } as Partial<IMarketingProjectRecord>);
      // Fire-and-forget audit
      dataService.logAudit({
        Action: AuditAction.ProjectRecordUpdated,
        EntityType: EntityType.ProjectRecord,
        EntityId: selectedProject?.projectCode,
        ProjectCode: selectedProject?.projectCode,
        User: currentUser?.displayName || 'Unknown',
        UserId: currentUser?.id,
        FieldChanged: field,
        NewValue: String(currentVal ?? ''),
        Details: `Updated ${field} on project record ${selectedProject?.projectCode}`,
      }).catch(console.error);
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateRecord = async (): Promise<void> => {
    if (!selectedProject?.projectCode) return;
    try {
      setIsCreating(true);
      const created = await createRecord({
        projectName: selectedProject?.projectCode,
        projectCode: selectedProject?.projectCode,
      });
      setLocalRecord({ ...created });
      dataService.logAudit({
        Action: AuditAction.ProjectRecordCreated,
        EntityType: EntityType.ProjectRecord,
        EntityId: selectedProject?.projectCode,
        ProjectCode: selectedProject?.projectCode,
        User: currentUser?.displayName || 'Unknown',
        UserId: currentUser?.id,
        Details: `Project record created for ${selectedProject?.projectCode}`,
      }).catch(console.error);
    } catch (err) {
      console.error('Failed to create record:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Section navigation
  // ---------------------------------------------------------------------------
  const scrollToSection = (key: string): void => {
    setActiveSection(key);
    const el = document.getElementById(`section-${key}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleCollapse = (key: string): void => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ---------------------------------------------------------------------------
  // Completion calculations
  // ---------------------------------------------------------------------------
  const sectionCompletions: Record<string, number> = React.useMemo(() => {
    if (!localRecord) return {};
    const result: Record<string, number> = {};
    PROJECT_RECORD_SECTIONS.forEach(s => {
      result[s.key] = computeSectionCompletion(localRecord, s.key);
    });
    return result;
  }, [localRecord]);

  const overallCompletion = React.useMemo(() => {
    const values = Object.values(sectionCompletions);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [sectionCompletions]);

  // ---------------------------------------------------------------------------
  // URL list helpers
  // ---------------------------------------------------------------------------
  const renderUrlList = (
    field: 'renderingUrls' | 'finalPhotoUrls',
    label: string,
    disabled: boolean
  ): React.ReactElement => {
    const urls = localRecord ? (localRecord[field] as string[]) || [] : [];
    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>{label}</label>
        {urls.map((url, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
            <input
              style={inputStyle}
              value={url}
              disabled={disabled}
              placeholder="https://..."
              onChange={e => {
                const updated = [...urls];
                updated[idx] = e.target.value;
                handleFieldChange(field, updated);
              }}
              onBlur={() => handleBlurSave(field)}
            />
            {!disabled && (
              <button
                type="button"
                style={{
                  padding: '4px 10px',
                  border: `1px solid ${HBC_COLORS.gray300}`,
                  borderRadius: '4px',
                  backgroundColor: HBC_COLORS.white,
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: HBC_COLORS.error,
                }}
                onClick={() => {
                  const updated = urls.filter((_, i) => i !== idx);
                  handleFieldChange(field, updated);
                  // save after removing
                  setTimeout(() => handleBlurSave(field), 0);
                }}
              >
                X
              </button>
            )}
          </div>
        ))}
        {!disabled && (
          <button
            type="button"
            style={{
              padding: '6px 14px',
              border: `1px solid ${HBC_COLORS.gray300}`,
              borderRadius: '4px',
              backgroundColor: HBC_COLORS.gray50,
              cursor: 'pointer',
              fontSize: '13px',
              color: HBC_COLORS.navy,
              marginTop: '4px',
            }}
            onClick={() => handleFieldChange(field, [...urls, ''])}
          >
            + Add URL
          </button>
        )}
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render helpers for common inputs
  // ---------------------------------------------------------------------------
  const renderTextInput = (
    field: keyof IMarketingProjectRecord,
    label: string,
    sectionKey: string,
    opts?: { readOnly?: boolean; type?: string; prefix?: string }
  ): React.ReactElement => {
    const disabled = opts?.readOnly || !canEditSection(sectionKey);
    const val = localRecord ? (localRecord as unknown as Record<string, unknown>)[field] : '';
    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>{label}</label>
        <div style={{ position: 'relative' }}>
          {opts?.prefix && (
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: HBC_COLORS.gray500, fontSize: '14px', pointerEvents: 'none' }}>
              {opts.prefix}
            </span>
          )}
          <input
            style={{ ...inputStyle, ...(opts?.prefix ? { paddingLeft: '28px' } : {}), ...(disabled ? { backgroundColor: HBC_COLORS.gray50 } : {}) }}
            type={opts?.type || 'text'}
            value={val !== null && val !== undefined ? String(val) : ''}
            disabled={disabled}
            onChange={e => {
              const newVal = opts?.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value;
              handleFieldChange(field, newVal);
            }}
            onBlur={() => handleBlurSave(field)}
          />
        </div>
      </div>
    );
  };

  const renderTextarea = (
    field: keyof IMarketingProjectRecord,
    label: string,
    sectionKey: string
  ): React.ReactElement => {
    const disabled = !canEditSection(sectionKey);
    const val = localRecord ? (localRecord as unknown as Record<string, unknown>)[field] : '';
    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>{label}</label>
        <textarea
          style={{ ...textareaStyle, ...(disabled ? { backgroundColor: HBC_COLORS.gray50 } : {}) }}
          value={val !== null && val !== undefined ? String(val) : ''}
          disabled={disabled}
          onChange={e => handleFieldChange(field, e.target.value)}
          onBlur={() => handleBlurSave(field)}
        />
      </div>
    );
  };

  const renderDateInput = (
    field: keyof IMarketingProjectRecord,
    label: string,
    sectionKey: string
  ): React.ReactElement => {
    const disabled = !canEditSection(sectionKey);
    const val = localRecord ? (localRecord as unknown as Record<string, unknown>)[field] : '';
    const dateVal = val ? String(val).substring(0, 10) : '';
    return (
      <div style={fieldWrap}>
        <label style={labelStyle}>{label}</label>
        <input
          style={{ ...inputStyle, ...(disabled ? { backgroundColor: HBC_COLORS.gray50 } : {}) }}
          type="date"
          value={dateVal}
          disabled={disabled}
          onChange={e => handleFieldChange(field, e.target.value || null)}
          onBlur={() => handleBlurSave(field)}
        />
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Loading / no record states
  // ---------------------------------------------------------------------------
  if (isLoading) return <SkeletonLoader variant="form" rows={8} />;

  if (!localRecord && !record) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <PageHeader title="Marketing Project Record" subtitle={selectedProject?.projectCode || ''} breadcrumb={<Breadcrumb items={breadcrumbs} />} />
        <div style={cardStyle}>
          <h3 style={{ color: HBC_COLORS.gray500, marginBottom: '16px' }}>No Project Record Found</h3>
          <p style={{ color: HBC_COLORS.gray400, marginBottom: '24px' }}>
            A marketing project record has not been created for this project yet.
          </p>
          {(canEditAll || canEditOps) && (
            <button
              type="button"
              disabled={isCreating}
              onClick={handleCreateRecord}
              style={{
                padding: '10px 24px',
                backgroundColor: HBC_COLORS.navy,
                color: HBC_COLORS.white,
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isCreating ? 'not-allowed' : 'pointer',
                opacity: isCreating ? 0.6 : 1,
              }}
            >
              {isCreating ? 'Creating...' : 'Create Record'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!localRecord) return null;

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <div>
      <PageHeader
        title="Marketing Project Record"
        subtitle={`${localRecord.projectName} (${localRecord.projectCode})`}
        breadcrumb={<Breadcrumb items={breadcrumbs} />}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isSaving && <span style={{ fontSize: '12px', color: HBC_COLORS.gray400 }}>Saving...</span>}
            <ExportButtons
              pdfElementId="project-record-export"
              data={[localRecord as unknown as Record<string, unknown>]}
              filename={`ProjectRecord-${localRecord.projectCode}`}
              title="Marketing Project Record"
            />
          </div>
        }
      />

      {/* Overall Completion Bar */}
      <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: HBC_COLORS.navy, whiteSpace: 'nowrap' }}>
          Overall Completion
        </span>
        <div style={{ flex: 1, height: '12px', backgroundColor: HBC_COLORS.gray200, borderRadius: '6px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${overallCompletion}%`,
              height: '100%',
              backgroundColor: completionColor(overallCompletion),
              borderRadius: '6px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 700, color: completionColor(overallCompletion), whiteSpace: 'nowrap' }}>
          {overallCompletion}%
        </span>
      </div>

      {/* Section Jump Nav */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
        {PROJECT_RECORD_SECTIONS.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => scrollToSection(s.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: activeSection === s.key ? `2px solid ${HBC_COLORS.navy}` : `1px solid ${HBC_COLORS.gray300}`,
              backgroundColor: activeSection === s.key ? HBC_COLORS.navy : HBC_COLORS.white,
              color: activeSection === s.key ? HBC_COLORS.white : HBC_COLORS.gray700,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Export wrapper */}
      <div id="project-record-export">

        {/* ----------------------------------------------------------------- */}
        {/* Section 1: Project Information */}
        {/* ----------------------------------------------------------------- */}
        <div id="section-projectInfo" style={cardStyle}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: collapsedSections.projectInfo ? 0 : '16px' }}
            onClick={() => toggleCollapse('projectInfo')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CompletionCircle pct={sectionCompletions.projectInfo || 0} />
              <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>1. Project Information</h3>
            </div>
            <span style={{ fontSize: '18px', color: HBC_COLORS.gray400 }}>{collapsedSections.projectInfo ? '+' : '-'}</span>
          </div>
          {!collapsedSections.projectInfo && (
            <div>
              {renderTextInput('projectName', 'Project Name', 'projectInfo', { readOnly: true })}
              {renderTextInput('projectCode', 'Project Code', 'projectInfo', { readOnly: true })}

              {/* Contract Type - multi-select checkboxes */}
              <div style={fieldWrap}>
                <label style={labelStyle}>Contract Type</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {PROJECT_RECORD_CONTRACT_TYPES.map(ct => {
                    const checked = localRecord.contractType.includes(ct);
                    const disabled = !canEditSection('projectInfo');
                    return (
                      <label
                        key={ct}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '13px',
                          color: HBC_COLORS.gray700,
                          cursor: disabled ? 'default' : 'pointer',
                          opacity: disabled ? 0.6 : 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => {
                            const updated = checked
                              ? localRecord.contractType.filter(t => t !== ct)
                              : [...localRecord.contractType, ct];
                            handleFieldChange('contractType', updated);
                            // save on change for checkboxes
                            setTimeout(() => handleBlurSave('contractType'), 0);
                          }}
                        />
                        {ct}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Method select */}
              <div style={fieldWrap}>
                <label style={labelStyle}>Delivery Method</label>
                <select
                  style={{ ...inputStyle, ...((!canEditSection('projectInfo')) ? { backgroundColor: HBC_COLORS.gray50 } : {}) }}
                  value={localRecord.deliveryMethod}
                  disabled={!canEditSection('projectInfo')}
                  onChange={e => handleFieldChange('deliveryMethod', e.target.value)}
                  onBlur={() => handleBlurSave('deliveryMethod')}
                >
                  <option value="">Select...</option>
                  {PROJECT_RECORD_DELIVERY_METHODS.map(dm => (
                    <option key={dm} value={dm}>{dm}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {renderTextInput('architect', 'Architect', 'projectInfo')}
                {renderTextInput('landscapeArchitect', 'Landscape Architect', 'projectInfo')}
                {renderTextInput('interiorDesigner', 'Interior Designer', 'projectInfo')}
                {renderTextInput('engineer', 'Engineer', 'projectInfo')}
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Section 2: Description */}
        {/* ----------------------------------------------------------------- */}
        <div id="section-description" style={cardStyle}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: collapsedSections.description ? 0 : '16px' }}
            onClick={() => toggleCollapse('description')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CompletionCircle pct={sectionCompletions.description || 0} />
              <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>2. Project Description</h3>
            </div>
            <span style={{ fontSize: '18px', color: HBC_COLORS.gray400 }}>{collapsedSections.description ? '+' : '-'}</span>
          </div>
          {!collapsedSections.description && (
            <div>
              {renderTextInput('buildingSystemType', 'Building System Type', 'description')}
              {renderTextarea('projectDescription', 'Project Description', 'description')}
              {renderTextarea('uniqueCharacteristics', 'Unique Characteristics', 'description')}
              {renderUrlList('renderingUrls', 'Rendering URLs', !canEditSection('description'))}
              {renderUrlList('finalPhotoUrls', 'Final Photo URLs', !canEditSection('description'))}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Section 3: Budget */}
        {/* ----------------------------------------------------------------- */}
        <div id="section-budget" style={cardStyle}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: collapsedSections.budget ? 0 : '16px' }}
            onClick={() => toggleCollapse('budget')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CompletionCircle pct={sectionCompletions.budget || 0} />
              <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>3. Budget &amp; Cost</h3>
            </div>
            <span style={{ fontSize: '18px', color: HBC_COLORS.gray400 }}>{collapsedSections.budget ? '+' : '-'}</span>
          </div>
          {!collapsedSections.budget && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {renderTextInput('contractBudget', 'Contract Budget', 'budget', { type: 'number', prefix: '$' })}
                {renderTextInput('contractFinalCost', 'Contract Final Cost', 'budget', { type: 'number', prefix: '$' })}
                {renderTextInput('totalCostPerGSF', 'Total Cost per GSF', 'budget', { type: 'number', prefix: '$' })}
                {renderTextInput('totalBudgetVariance', 'Total Budget Variance', 'budget', { type: 'number', prefix: '$' })}
              </div>
              {renderTextarea('budgetExplanation', 'Budget Explanation', 'budget')}

              {/* Change Order Rows */}
              <h4 style={{ color: HBC_COLORS.navy, margin: '16px 0 8px' }}>Change Orders</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `2px solid ${HBC_COLORS.gray200}`, color: HBC_COLORS.gray500, fontSize: '12px' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `2px solid ${HBC_COLORS.gray200}`, color: HBC_COLORS.gray500, fontSize: '12px' }}>Count</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: `2px solid ${HBC_COLORS.gray200}`, color: HBC_COLORS.gray500, fontSize: '12px' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    { label: 'Owner Directed', countField: 'CO_OwnerDirected_Count' as keyof IMarketingProjectRecord, valueField: 'CO_OwnerDirected_Value' as keyof IMarketingProjectRecord },
                    { label: 'Municipality Directed', countField: 'CO_MunicipalityDirected_Count' as keyof IMarketingProjectRecord, valueField: 'CO_MunicipalityDirected_Value' as keyof IMarketingProjectRecord },
                    { label: 'E&O', countField: 'CO_EO_Count' as keyof IMarketingProjectRecord, valueField: 'CO_EO_Value' as keyof IMarketingProjectRecord },
                    { label: 'Contractor Directed', countField: 'CO_ContractorDirected_Count' as keyof IMarketingProjectRecord, valueField: null },
                  ]).map(row => {
                    const disabled = !canEditSection('budget');
                    const countVal = (localRecord as unknown as Record<string, unknown>)[row.countField];
                    const valVal = row.valueField ? (localRecord as unknown as Record<string, unknown>)[row.valueField] : undefined;
                    return (
                      <tr key={row.label}>
                        <td style={{ padding: '6px 8px', borderBottom: `1px solid ${HBC_COLORS.gray100}`, color: HBC_COLORS.gray700 }}>{row.label}</td>
                        <td style={{ padding: '6px 8px', borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
                          <input
                            style={{ ...inputStyle, width: '100px', ...(disabled ? { backgroundColor: HBC_COLORS.gray50 } : {}) }}
                            type="number"
                            value={countVal !== null && countVal !== undefined ? String(countVal) : ''}
                            disabled={disabled}
                            onChange={e => handleFieldChange(row.countField, e.target.value === '' ? null : Number(e.target.value))}
                            onBlur={() => handleBlurSave(row.countField)}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
                          {row.valueField ? (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: HBC_COLORS.gray500, fontSize: '14px', pointerEvents: 'none' }}>$</span>
                              <input
                                style={{ ...inputStyle, width: '140px', paddingLeft: '28px', ...(disabled ? { backgroundColor: HBC_COLORS.gray50 } : {}) }}
                                type="number"
                                value={valVal !== null && valVal !== undefined ? String(valVal) : ''}
                                disabled={disabled}
                                onChange={e => handleFieldChange(row.valueField as keyof IMarketingProjectRecord, e.target.value === '' ? null : Number(e.target.value))}
                                onBlur={() => handleBlurSave(row.valueField as keyof IMarketingProjectRecord)}
                              />
                            </div>
                          ) : (
                            <span style={{ color: HBC_COLORS.gray400, fontSize: '12px' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                {renderTextInput('savingsReturned', 'Savings Returned', 'budget', { type: 'number', prefix: '$' })}
                {renderTextInput('savingsReturnedPct', 'Savings Returned %', 'budget', { type: 'number' })}
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Section 4: Schedule */}
        {/* ----------------------------------------------------------------- */}
        <div id="section-schedule" style={cardStyle}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: collapsedSections.schedule ? 0 : '16px' }}
            onClick={() => toggleCollapse('schedule')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CompletionCircle pct={sectionCompletions.schedule || 0} />
              <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>4. Schedule</h3>
            </div>
            <span style={{ fontSize: '18px', color: HBC_COLORS.gray400 }}>{collapsedSections.schedule ? '+' : '-'}</span>
          </div>
          {!collapsedSections.schedule && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {renderDateInput('scheduleStartAnticipated', 'Anticipated Start', 'schedule')}
                {renderDateInput('scheduleStartActual', 'Actual Start', 'schedule')}
                {renderDateInput('scheduleEndAnticipated', 'Anticipated End', 'schedule')}
                {renderDateInput('scheduleEndActual', 'Actual End', 'schedule')}
              </div>

              <div style={fieldWrap}>
                <label style={labelStyle}>On Schedule</label>
                <select
                  style={{ ...inputStyle, ...((!canEditSection('schedule')) ? { backgroundColor: HBC_COLORS.gray50 } : {}) }}
                  value={localRecord.onSchedule}
                  disabled={!canEditSection('schedule')}
                  onChange={e => handleFieldChange('onSchedule', e.target.value)}
                  onBlur={() => handleBlurSave('onSchedule')}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {renderTextarea('scheduleExplanation', 'Schedule Explanation', 'schedule')}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {renderDateInput('substantialCompletionDate', 'Substantial Completion Date', 'schedule')}
                {renderDateInput('finalCompletionDate', 'Final Completion Date', 'schedule')}
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Section 5: Quality Control */}
        {/* ----------------------------------------------------------------- */}
        <div id="section-qc" style={cardStyle}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: collapsedSections.qc ? 0 : '16px' }}
            onClick={() => toggleCollapse('qc')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CompletionCircle pct={sectionCompletions.qc || 0} />
              <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>5. Quality Control</h3>
            </div>
            <span style={{ fontSize: '18px', color: HBC_COLORS.gray400 }}>{collapsedSections.qc ? '+' : '-'}</span>
          </div>
          {!collapsedSections.qc && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {renderTextInput('punchListItems', 'Punch List Items', 'qc', { type: 'number' })}
              {renderTextInput('punchListDaysToComplete', 'Days to Complete Punch List', 'qc', { type: 'number' })}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Section 6: Safety */}
        {/* ----------------------------------------------------------------- */}
        <div id="section-safety" style={cardStyle}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: collapsedSections.safety ? 0 : '16px' }}
            onClick={() => toggleCollapse('safety')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CompletionCircle pct={sectionCompletions.safety || 0} />
              <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>6. Safety</h3>
            </div>
            <span style={{ fontSize: '18px', color: HBC_COLORS.gray400 }}>{collapsedSections.safety ? '+' : '-'}</span>
          </div>
          {!collapsedSections.safety && (
            <div>
              {renderTextarea('innovativeSafetyPrograms', 'Innovative Safety Programs', 'safety')}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Section 7: Supplier Diversity */}
        {/* ----------------------------------------------------------------- */}
        <div id="section-supplierDiversity" style={cardStyle}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: collapsedSections.supplierDiversity ? 0 : '16px' }}
            onClick={() => toggleCollapse('supplierDiversity')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CompletionCircle pct={sectionCompletions.supplierDiversity || 0} />
              <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>7. Supplier Diversity</h3>
            </div>
            <span style={{ fontSize: '18px', color: HBC_COLORS.gray400 }}>{collapsedSections.supplierDiversity ? '+' : '-'}</span>
          </div>
          {!collapsedSections.supplierDiversity && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {renderTextInput('mwbeRequirement', 'MWBE Requirement', 'supplierDiversity')}
                {renderTextInput('mwbeAchievement', 'MWBE Achievement', 'supplierDiversity')}
                {renderTextInput('sbeRequirement', 'SBE Requirement', 'supplierDiversity')}
                {renderTextInput('sbeAchievement', 'SBE Achievement', 'supplierDiversity')}
                {renderTextInput('localRequirement', 'Local Requirement', 'supplierDiversity')}
                {renderTextInput('localAchievement', 'Local Achievement', 'supplierDiversity')}
              </div>
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Section 8: Sustainability */}
        {/* ----------------------------------------------------------------- */}
        <div id="section-sustainability" style={cardStyle}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: collapsedSections.sustainability ? 0 : '16px' }}
            onClick={() => toggleCollapse('sustainability')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CompletionCircle pct={sectionCompletions.sustainability || 0} />
              <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>8. Sustainability</h3>
            </div>
            <span style={{ fontSize: '18px', color: HBC_COLORS.gray400 }}>{collapsedSections.sustainability ? '+' : '-'}</span>
          </div>
          {!collapsedSections.sustainability && (
            <div>
              {renderTextInput('leedDesignation', 'LEED Designation', 'sustainability')}
              {renderTextarea('sustainabilityFeatures', 'Sustainability Features', 'sustainability')}
              {renderTextInput('leedAdditionalCost', 'LEED Additional Cost', 'sustainability', { type: 'number', prefix: '$' })}
            </div>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Section 9: Case Study */}
        {/* ----------------------------------------------------------------- */}
        <div id="section-caseStudy" style={cardStyle}>
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: collapsedSections.caseStudy ? 0 : '16px' }}
            onClick={() => toggleCollapse('caseStudy')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CompletionCircle pct={sectionCompletions.caseStudy || 0} />
              <h3 style={{ margin: 0, color: HBC_COLORS.navy }}>9. Case Study</h3>
            </div>
            <span style={{ fontSize: '18px', color: HBC_COLORS.gray400 }}>{collapsedSections.caseStudy ? '+' : '-'}</span>
          </div>
          {!collapsedSections.caseStudy && (
            <div>
              {Object.entries(CASE_STUDY_LABELS).map(([field, label]) => (
                <div key={field}>
                  {renderTextarea(field as keyof IMarketingProjectRecord, label, 'caseStudy')}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Footer with last updated */}
      {localRecord.lastUpdatedAt && (
        <div style={{ textAlign: 'right', fontSize: '12px', color: HBC_COLORS.gray400, marginTop: '8px' }}>
          Last updated: {formatDate(localRecord.lastUpdatedAt)} by {localRecord.lastUpdatedBy || 'Unknown'}
        </div>
      )}
    </div>
  );
};
