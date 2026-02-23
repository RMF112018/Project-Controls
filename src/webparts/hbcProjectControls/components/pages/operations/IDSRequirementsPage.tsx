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

export const IDSRequirementsPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <PageHeader
        title="IDS Requirements"
        subtitle="Innovation and digital services project requirements"
      />

      <CollapsibleSection title="Digital Tools Required">
        <p className={styles.paragraph}>
          All projects must utilize the approved suite of digital tools including project
          management software, document control systems, and communication platforms.
          Ensure all team members have appropriate licenses and training before project
          mobilization. Contact IDS for tool provisioning and setup assistance.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="BIM Requirements">
        <p className={styles.paragraph}>
          Building Information Modeling requirements are determined by project scope and
          contract requirements. Coordinate with the IDS team to establish the BIM Execution
          Plan, model coordination schedule, and clash detection workflows. All BIM models
          must conform to company standards for naming conventions, level of development,
          and file management.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Technology Standards">
        <p className={styles.paragraph}>
          All project technology deployments must comply with company IT security policies
          and data governance requirements. Use approved cloud storage solutions for all
          project documentation. Maintain current antivirus software on all project devices.
          Report any security incidents or suspected breaches to IDS immediately.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="IDS Contact Information">
        <p className={styles.paragraph}>
          For IDS support requests, technology provisioning, or BIM coordination, contact the
          IDS department through the company help desk system. For urgent technology issues
          impacting project operations, use the IDS emergency hotline. Schedule technology
          planning meetings with IDS at least two weeks before project mobilization.
        </p>
      </CollapsibleSection>
    </div>
  );
};
