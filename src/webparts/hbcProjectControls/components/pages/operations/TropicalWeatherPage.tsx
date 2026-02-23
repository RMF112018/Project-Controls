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

export const TropicalWeatherPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader
        title="Tropical Weather Guide"
        subtitle="Hurricane and tropical weather preparedness procedures"
      />

      <CollapsibleSection title="Hurricane Preparedness">
        <p className={styles.paragraph}>
          Monitor the National Hurricane Center for tropical weather advisories throughout
          hurricane season (June 1 through November 30). Maintain an updated hurricane
          preparedness plan for each active project site. Ensure all temporary structures,
          materials, and equipment are evaluated for wind resistance ratings. Pre-position
          securing materials including tie-down straps, plywood, and sandbags.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Tropical Storm Procedures">
        <p className={styles.paragraph}>
          When a tropical storm watch is issued, initiate the 72-hour preparation timeline.
          Secure all loose materials, scaffolding, and temporary structures. Ensure all cranes
          are properly weathervaned or lowered per manufacturer specifications. Back up all
          project documentation and ensure digital copies are stored offsite. Coordinate fuel
          supplies for generators and essential vehicles.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Post-Storm Recovery">
        <p className={styles.paragraph}>
          Do not return to the job site until authorities have confirmed it is safe to do so.
          Conduct a thorough damage assessment and document all conditions with photographs
          and written reports. Coordinate with insurance carriers and document all losses.
          Prioritize life safety hazards, then structural assessments, then debris removal.
          Prepare a recovery schedule and communicate updated timelines to all stakeholders.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Emergency Contacts">
        <p className={styles.paragraph}>
          Maintain current contact lists for all project personnel, emergency services,
          utility companies, and insurance representatives. Establish a communication tree
          with designated alternates. Ensure all personnel have access to emergency contact
          information both digitally and in printed form. Coordinate with local emergency
          management agencies for evacuation routes and shelter locations.
        </p>
      </CollapsibleSection>
    </div>
  );
};
