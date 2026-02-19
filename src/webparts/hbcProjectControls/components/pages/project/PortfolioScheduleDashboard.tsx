import * as React from 'react';
import { IPortfolioScheduleHealth, IFieldReadinessScore } from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

interface IPortfolioScheduleDashboardProps {
  healthRows: IPortfolioScheduleHealth[];
  fieldReadinessRows: IFieldReadinessScore[];
}

export const PortfolioScheduleDashboard: React.FC<IPortfolioScheduleDashboardProps> = ({ healthRows, fieldReadinessRows }) => {
  const readinessByProject = React.useMemo(() => {
    const map = new Map<string, IFieldReadinessScore>();
    fieldReadinessRows.forEach(r => map.set(r.projectCode, r));
    return map;
  }, [fieldReadinessRows]);

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 16, fontWeight: 700, color: HBC_COLORS.navy, marginBottom: 4 }}>Portfolio Schedule Dashboard</div>
      <div style={{ fontSize: 12, color: HBC_COLORS.gray500, marginBottom: 12 }}>
        Hub roll-up includes Field Readiness Score for office-to-field bridge visibility.
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${HBC_COLORS.gray200}` }}>
              <Th>Project</Th>
              <Th align="right">Health</Th>
              <Th align="right">SPI</Th>
              <Th align="right">CPI</Th>
              <Th align="right">Critical</Th>
              <Th align="right">Neg Float</Th>
              <Th align="right">Field Readiness</Th>
            </tr>
          </thead>
          <tbody>
            {healthRows.map(row => {
              const readiness = readinessByProject.get(row.projectCode)?.score ?? row.fieldReadinessScore;
              return (
                <tr key={row.projectCode} style={{ borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
                  <Td>{row.projectName || row.projectCode}</Td>
                  <Td align="right">{row.scheduleHealthScore}</Td>
                  <Td align="right">{row.spi ?? 'N/A'}</Td>
                  <Td align="right">{row.cpi ?? 'N/A'}</Td>
                  <Td align="right">{row.criticalCount}</Td>
                  <Td align="right">{row.negativeFloatCount}</Td>
                  <Td align="right"><b>{readiness}</b></Td>
                </tr>
              );
            })}
            {healthRows.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 12, color: HBC_COLORS.gray500 }}>No portfolio schedule rows available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: 8,
  border: `1px solid ${HBC_COLORS.gray200}`,
  padding: 16,
  boxShadow: ELEVATION.level1,
};

const Th: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({ children, align = 'left' }) => (
  <th style={{ textAlign: align, padding: '8px 10px', fontSize: 11, color: HBC_COLORS.gray600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{children}</th>
);

const Td: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' }> = ({ children, align = 'left' }) => (
  <td style={{ textAlign: align, padding: '8px 10px' }}>{children}</td>
);
