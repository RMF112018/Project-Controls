import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { CollapsibleSection } from '../../shared/CollapsibleSection';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('16px'),
  },
  paragraph: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase400,
    ...shorthands.margin('0'),
  },
});

export const OSHAGuidePage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader
        title="OSHA Site Visit Guide"
        subtitle="Inspection preparation and compliance procedures"
      />

      <CollapsibleSection title="Before the Visit">
        <p className={styles.paragraph}>
          Ensure all safety documentation is current and accessible. Verify that safety data sheets
          are organized and up to date. Review recent inspection reports and confirm all identified
          deficiencies have been addressed. Brief the site team on OSHA inspection protocols and
          designate an escort for the compliance officer.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="During the Visit">
        <p className={styles.paragraph}>
          Accompany the compliance officer at all times during the site inspection. Take detailed
          notes of all observations, questions, and areas of interest. Document any photographs
          taken by the inspector and take your own corresponding photographs. Do not volunteer
          information beyond what is specifically requested.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="After the Visit">
        <p className={styles.paragraph}>
          Immediately document all findings and observations from the visit. Prepare a summary
          report for project leadership and the safety department. Develop a corrective action
          plan for any identified deficiencies with assigned responsibilities and target dates.
          Track all corrective actions to completion.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Key Contacts">
        <p className={styles.paragraph}>
          Contact the Safety Director for guidance on OSHA interactions and compliance
          requirements. Notify the Project Executive and legal counsel immediately upon receiving
          notice of an OSHA inspection. Maintain current contact information for the local OSHA
          area office and emergency response resources.
        </p>
      </CollapsibleSection>
    </div>
  );
};
