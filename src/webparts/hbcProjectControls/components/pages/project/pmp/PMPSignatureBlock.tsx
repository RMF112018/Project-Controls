import * as React from 'react';
import { HBC_COLORS } from '../../../../theme/tokens';
import { IPMPSignature } from '../../../../models/IProjectManagementPlan';

interface IPMPSignatureBlockProps {
  signature: IPMPSignature;
  canSign: boolean;
  onSign: (signatureId: number, comment: string) => void;
}

export const PMPSignatureBlock: React.FC<IPMPSignatureBlockProps> = ({ signature, canSign, onSign }) => {
  const [comment, setComment] = React.useState('');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 0', borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: HBC_COLORS.navy }}>{signature.role}{signature.isLead && <span style={{ fontSize: 10, color: HBC_COLORS.orange, marginLeft: 6 }}>LEAD</span>}</div>
        <div style={{ fontSize: 12, color: HBC_COLORS.gray500 }}>{signature.personName}</div>
      </div>
      <div style={{ width: 100, textAlign: 'center' }}>
        {signature.status === 'Signed' ? (
          <div>
            <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: `${HBC_COLORS.success}20`, color: HBC_COLORS.success }}>Signed</span>
            <div style={{ fontSize: 10, color: HBC_COLORS.gray400, marginTop: 2 }}>{signature.signedDate ? new Date(signature.signedDate).toLocaleDateString() : ''}</div>
          </div>
        ) : signature.status === 'Declined' ? (
          <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: `${HBC_COLORS.error}20`, color: HBC_COLORS.error }}>Declined</span>
        ) : canSign ? (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Comment..." style={{ width: 100, fontSize: 11, border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: 4, padding: '4px 6px' }} />
            <button onClick={() => onSign(signature.id, comment)} style={{ padding: '4px 10px', backgroundColor: HBC_COLORS.success, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, whiteSpace: 'nowrap' }}>Sign</button>
          </div>
        ) : (
          <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: `${HBC_COLORS.gray200}`, color: HBC_COLORS.gray500 }}>Pending</span>
        )}
      </div>
      {signature.isRequired && <span style={{ fontSize: 9, color: HBC_COLORS.error, fontWeight: 700 }}>REQ</span>}
    </div>
  );
};
