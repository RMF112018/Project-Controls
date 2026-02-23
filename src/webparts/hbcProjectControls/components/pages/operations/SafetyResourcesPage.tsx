import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { CollapsibleSection } from '../../shared/CollapsibleSection';
import { HbcCard } from '../../shared/HbcCard';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('16px'),
  },
  cardDescription: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground3,
  },
});

export const SafetyResourcesPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader title="Safety Resources" />
      <CollapsibleSection title="Tool-Box Talks" defaultExpanded>
        <HbcCard title="Tool-Box Talks">
          <span className={styles.cardDescription}>
            Weekly safety topic discussions for field teams.
          </span>
        </HbcCard>
      </CollapsibleSection>
      <CollapsibleSection title="Safety Updates" defaultExpanded>
        <HbcCard title="Safety Updates">
          <span className={styles.cardDescription}>
            Latest safety bulletins, policy changes, and industry updates.
          </span>
        </HbcCard>
      </CollapsibleSection>
      <CollapsibleSection title="Reference Materials" defaultExpanded>
        <HbcCard title="Reference Materials">
          <span className={styles.cardDescription}>
            OSHA standards, HBC safety manual, and emergency procedures.
          </span>
        </HbcCard>
      </CollapsibleSection>
    </div>
  );
};
