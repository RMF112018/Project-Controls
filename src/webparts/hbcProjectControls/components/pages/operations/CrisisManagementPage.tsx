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

export const CrisisManagementPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader
        title="Crisis Management & ICE Guide"
        subtitle="Emergency procedures and incident command structure"
      />

      <CollapsibleSection title="Emergency Response Plan">
        <p className={styles.paragraph}>
          In the event of an emergency, ensure the safety of all personnel as the first
          priority. Call 911 for life-threatening situations. Activate the site emergency
          action plan and begin evacuation procedures if necessary. Designate assembly
          points and conduct headcounts. Secure the scene to prevent additional injuries
          and preserve evidence for investigation.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Incident Command Structure">
        <p className={styles.paragraph}>
          The Incident Commander is the Project Superintendent unless otherwise designated.
          The IC is responsible for overall incident management, resource allocation, and
          communication with external agencies. Support roles include Safety Officer,
          Operations Section Chief, and Liaison Officer. All personnel must understand
          the chain of command and reporting procedures.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Communication Protocol">
        <p className={styles.paragraph}>
          Notify the Project Executive and Safety Director immediately following any
          significant incident. All external communications, including media inquiries,
          must be directed to the designated company spokesperson. Do not release any
          information to the media or third parties without authorization. Document all
          communications related to the incident with timestamps and participants.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Key Emergency Contacts">
        <p className={styles.paragraph}>
          Maintain current In Case of Emergency (ICE) contact information for all project
          personnel. Post emergency contact numbers prominently at the site office, entrance
          gates, and break areas. Include contacts for local fire department, police, hospital,
          poison control, and utility emergency services. Update contact lists monthly and
          distribute to all supervisory personnel.
        </p>
      </CollapsibleSection>
    </div>
  );
};
