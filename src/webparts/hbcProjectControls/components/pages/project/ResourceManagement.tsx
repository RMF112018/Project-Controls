import * as React from 'react';
import { IResourceLevelingResult, IScheduleEngineRuntimeInfo } from '@hbc/sp-services';
import { HBC_COLORS, ELEVATION } from '../../../theme/tokens';

interface IResourceManagementProps {
  leveling: IResourceLevelingResult | null;
  runtimeInfo: IScheduleEngineRuntimeInfo | null;
}

export const ResourceManagement: React.FC<IResourceManagementProps> = ({ leveling, runtimeInfo }) => {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: HBC_COLORS.navy }}>Resource Management</div>
          <div style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>
            Resource leveling and overallocation detection (worker default, optional WASM offload)
          </div>
        </div>
        <div style={{ fontSize: 11, color: HBC_COLORS.gray600 }}>
          Runtime: {runtimeInfo ? `${runtimeInfo.workerEnabled ? 'Worker' : 'Main'} / ${runtimeInfo.wasmEnabled ? 'WASM' : 'JS'}` : 'Unknown'}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 13, marginBottom: 6 }}>
          Overallocated resources: <b>{leveling ? leveling.overallocatedResourceCount : 'N/A'}</b>
        </div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: HBC_COLORS.gray700 }}>
          {(leveling?.recommendations || ['No resource analysis yet.']).map((r, i) => <li key={i}>{r}</li>)}
        </ul>
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
