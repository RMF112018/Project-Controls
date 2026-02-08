import * as React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { useRiskCostManagement } from '../../hooks/useRiskCostManagement';
import { PageHeader } from '../../shared/PageHeader';
import { LoadingSpinner } from '../../shared/LoadingSpinner';
import { HBC_COLORS } from '../../../theme/tokens';
import { PERMISSIONS } from '../../../utils/permissions';
import { AuditAction, EntityType } from '../../../models/enums';
import { IRiskCostItem, RiskCostCategory, RiskCostItemStatus } from '../../../models/IRiskCostManagement';

const STATUS_COLORS: Record<string, string> = {
  Open: HBC_COLORS.warning,
  Realized: HBC_COLORS.success,
  Mitigated: '#3B82F6',
  Closed: HBC_COLORS.gray400,
};

const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 16 };

export const RiskCostManagement: React.FC = () => {
  const { siteContext, hasPermission, dataService, currentUser } = useAppContext();
  const { data, isLoading, error, fetchData, updateContractInfo, addItem, updateItem } = useRiskCostManagement();
  const projectCode = siteContext.projectCode ?? '';
  const canEdit = hasPermission(PERMISSIONS.RISK_EDIT);

  React.useEffect(() => { if (projectCode) fetchData(projectCode).catch(console.error); }, [projectCode, fetchData]);

  const handleContractBlur = React.useCallback((field: 'contractType' | 'contractAmount', value: string) => {
    if (!data || !canEdit) return;
    const contractType = field === 'contractType' ? value : data.contractType;
    const contractAmount = field === 'contractAmount' ? parseFloat(value) || 0 : data.contractAmount;
    updateContractInfo(projectCode, contractType, contractAmount).then(() => {
      dataService.logAudit({ Action: AuditAction.RiskItemUpdated, EntityType: EntityType.RiskCost, EntityId: projectCode, User: currentUser?.email ?? '', Details: `Updated ${field}`, ProjectCode: projectCode }).catch(console.error);
    }).catch(console.error);
  }, [data, canEdit, projectCode, updateContractInfo, dataService, currentUser]);

  const handleAddItem = React.useCallback(async (category: RiskCostCategory) => {
    if (!data) return;
    const items = category === 'Buyout' ? data.buyoutOpportunities : category === 'Risk' ? data.potentialRisks : data.potentialSavings;
    const nextLetter = String.fromCharCode(65 + items.length);
    await addItem(projectCode, { category, letter: nextLetter, description: '', estimatedValue: 0 });
    dataService.logAudit({ Action: AuditAction.RiskItemUpdated, EntityType: EntityType.RiskCost, EntityId: projectCode, User: currentUser?.email ?? '', Details: `Added ${category} item ${nextLetter}`, ProjectCode: projectCode }).catch(console.error);
  }, [data, projectCode, addItem, dataService, currentUser]);

  const handleItemBlur = React.useCallback(async (itemId: number, field: string, value: string) => {
    if (!canEdit) return;
    const updateData: Partial<IRiskCostItem> = {};
    if (field === 'description') updateData.description = value;
    else if (field === 'estimatedValue') updateData.estimatedValue = parseFloat(value) || 0;
    else if (field === 'notes') updateData.notes = value;
    else if (field === 'status') updateData.status = value as RiskCostItemStatus;
    await updateItem(projectCode, itemId, updateData);
    dataService.logAudit({ Action: AuditAction.RiskItemUpdated, EntityType: EntityType.RiskCost, EntityId: projectCode, User: currentUser?.email ?? '', Details: `Updated item ${itemId} field ${field}`, ProjectCode: projectCode }).catch(console.error);
  }, [canEdit, projectCode, updateItem, dataService, currentUser]);

  if (isLoading) return <LoadingSpinner label="Loading risk & cost data..." />;
  if (error) return <div style={{ padding: 24, color: HBC_COLORS.error }}>{error}</div>;

  const renderTable = (title: string, items: IRiskCostItem[], category: RiskCostCategory, borderColor: string): React.ReactElement => (
    <div style={{ ...cardStyle, borderLeft: `4px solid ${borderColor}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: HBC_COLORS.navy, fontSize: 16 }}>{title}</h3>
        {canEdit && <button onClick={() => handleAddItem(category)} style={{ padding: '6px 12px', backgroundColor: HBC_COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>+ Add</button>}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
            <th style={{ textAlign: 'left', padding: '8px 4px', width: 40 }}>#</th>
            <th style={{ textAlign: 'left', padding: '8px 4px' }}>Description</th>
            <th style={{ textAlign: 'right', padding: '8px 4px', width: 120 }}>Est. Value</th>
            <th style={{ textAlign: 'center', padding: '8px 4px', width: 100 }}>Status</th>
            <th style={{ textAlign: 'left', padding: '8px 4px', width: 200 }}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} style={{ borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
              <td style={{ padding: '8px 4px', fontWeight: 600 }}>{item.letter}</td>
              <td style={{ padding: '8px 4px' }}>
                {canEdit ? <input defaultValue={item.description} onBlur={e => handleItemBlur(item.id, 'description', e.target.value)} style={{ width: '100%', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '4px 8px', fontSize: 13 }} /> : item.description}
              </td>
              <td style={{ padding: '8px 4px', textAlign: 'right' }}>
                {canEdit ? <input type="number" defaultValue={item.estimatedValue} onBlur={e => handleItemBlur(item.id, 'estimatedValue', e.target.value)} style={{ width: 100, border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '4px 8px', fontSize: 13, textAlign: 'right' }} /> : `$${item.estimatedValue.toLocaleString()}`}
              </td>
              <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                {canEdit ? (
                  <select defaultValue={item.status} onChange={e => handleItemBlur(item.id, 'status', e.target.value)} style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '4px', fontSize: 12 }}>
                    <option value="Open">Open</option>
                    <option value="Realized">Realized</option>
                    <option value="Mitigated">Mitigated</option>
                    <option value="Closed">Closed</option>
                  </select>
                ) : (
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: `${STATUS_COLORS[item.status]}20`, color: STATUS_COLORS[item.status] }}>{item.status}</span>
                )}
              </td>
              <td style={{ padding: '8px 4px' }}>
                {canEdit ? <input defaultValue={item.notes} onBlur={e => handleItemBlur(item.id, 'notes', e.target.value)} style={{ width: '100%', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '4px 8px', fontSize: 13 }} /> : item.notes}
              </td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: HBC_COLORS.gray400 }}>No items yet</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <PageHeader title="Risk & Cost Management" subtitle={projectCode} />
      {data && (
        <>
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 12px', color: HBC_COLORS.navy, fontSize: 16 }}>Contract Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: HBC_COLORS.gray500, display: 'block', marginBottom: 4 }}>Contract Type</label>
                {canEdit ? (
                  <select defaultValue={data.contractType} onBlur={e => handleContractBlur('contractType', e.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, fontSize: 14 }}>
                    <option value="GMP">GMP</option>
                    <option value="Lump Sum">Lump Sum</option>
                    <option value="Cost Plus">Cost Plus</option>
                    <option value="Design-Build">Design-Build</option>
                  </select>
                ) : <span style={{ fontSize: 14 }}>{data.contractType}</span>}
              </div>
              <div>
                <label style={{ fontSize: 12, color: HBC_COLORS.gray500, display: 'block', marginBottom: 4 }}>Contract Amount</label>
                {canEdit ? <input type="number" defaultValue={data.contractAmount} onBlur={e => handleContractBlur('contractAmount', e.target.value)} style={{ width: '100%', padding: '8px', border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, fontSize: 14 }} /> : <span style={{ fontSize: 14 }}>${data.contractAmount.toLocaleString()}</span>}
              </div>
            </div>
          </div>
          {renderTable('Buyout Opportunities', data.buyoutOpportunities, 'Buyout', HBC_COLORS.success)}
          {renderTable('Potential Risks', data.potentialRisks, 'Risk', HBC_COLORS.error)}
          {renderTable('Potential Savings', data.potentialSavings, 'Savings', '#3B82F6')}
        </>
      )}
      {!data && !isLoading && <div style={{ padding: 24, textAlign: 'center', color: HBC_COLORS.gray400 }}>No risk/cost data for this project yet.</div>}
    </div>
  );
};
