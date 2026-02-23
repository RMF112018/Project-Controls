import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useAppContext } from '../../contexts/AppContext';
import type { IMeeting } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  meetingList: {
    display: 'grid',
    ...shorthands.gap('12px'),
  },
  meetingMeta: {
    display: 'flex',
    ...shorthands.gap('16px'),
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

export const MeetingTemplatesPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';

  const [meetings, setMeetings] = React.useState<IMeeting[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectCode) {
      setLoading(false);
      return;
    }

    dataService.getMeetings(projectCode)
      .then(result => setMeetings(result))
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  if (!projectCode) {
    return (
      <div>
        <PageHeader title="Meeting Agenda Templates" />
        <HbcEmptyState
          title="No Project Selected"
          description="Select a project to continue."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Meeting Agenda Templates" />
        <HbcSkeleton variant="card" columns={2} />
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div>
        <PageHeader title="Meeting Agenda Templates" />
        <HbcEmptyState
          title="No Meetings Found"
          description="No meeting templates have been configured for this project."
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Meeting Agenda Templates" subtitle={selectedProject?.projectName} />

      <div className={styles.meetingList}>
        {meetings.map(meeting => (
          <HbcCard
            key={meeting.id}
            title={meeting.subject}
            subtitle={meeting.type}
          >
            <div className={styles.meetingMeta}>
              <span>Date: {meeting.startTime}</span>
              <span>Attendees: {meeting.attendees.length}</span>
              {meeting.location && <span>Location: {meeting.location}</span>}
            </div>
          </HbcCard>
        ))}
      </div>
    </div>
  );
};
