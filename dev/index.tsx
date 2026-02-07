import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from '@components/App';
import { MockDataService } from '@services/MockDataService';
import { RenderMode } from '@models/enums';

const dataService = new MockDataService();

const DevBadge: React.FC = () => (
  <div
    style={{
      position: 'fixed',
      bottom: 12,
      right: 12,
      padding: '4px 12px',
      background: 'rgba(232, 119, 34, 0.85)',
      color: '#fff',
      fontSize: 11,
      fontWeight: 700,
      borderRadius: 4,
      zIndex: 9999,
      letterSpacing: 1,
      pointerEvents: 'none',
      userSelect: 'none',
    }}
  >
    DEV PREVIEW
  </div>
);

const Root: React.FC = () => (
  <>
    <App dataService={dataService} renderMode={RenderMode.Full} />
    <DevBadge />
  </>
);

ReactDOM.render(<Root />, document.getElementById('root'));
