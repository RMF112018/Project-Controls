import * as React from 'react';
import { Textarea, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { CollapsibleSection } from '../../shared/CollapsibleSection';
import { HbcButton } from '../../shared/HbcButton';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { ComingSoonPage } from '../../shared/ComingSoonPage';
import { useToast } from '../../shared/ToastContainer';
import { useAppContext } from '../../contexts/AppContext';
import type { ISuperintendentPlan, ISuperintendentPlanSection } from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  sectionActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.padding('8px', '0', '0', '0'),
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
  },
  sectionMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    ...shorthands.padding('4px', '0'),
  },
});

export const SuperintendentPlanPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';
  const { addToast } = useToast();

  const [plan, setPlan] = React.useState<ISuperintendentPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editedSections, setEditedSections] = React.useState<Record<number, string>>({});
  const [savingSectionId, setSavingSectionId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!projectCode) {
      setLoading(false);
      return;
    }

    dataService.getSuperintendentPlan(projectCode)
      .then(result => setPlan(result))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  const handleSectionChange = React.useCallback((sectionId: number, value: string): void => {
    setEditedSections(prev => ({ ...prev, [sectionId]: value }));
  }, []);

  const handleSaveSection = React.useCallback(async (section: ISuperintendentPlanSection): Promise<void> => {
    const updatedContent = editedSections[section.id];
    if (updatedContent === undefined) return;

    setSavingSectionId(section.id);
    try {
      const updated = await dataService.updateSuperintendentPlanSection(
        projectCode,
        section.id,
        { content: updatedContent }
      );
      setPlan(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map(s => s.id === section.id ? { ...s, ...updated } : s),
        };
      });
      setEditedSections(prev => {
        const next = { ...prev };
        delete next[section.id];
        return next;
      });
      addToast(`"${section.sectionTitle}" saved.`, 'success');
    } catch {
      addToast(`Failed to save "${section.sectionTitle}".`, 'error');
    } finally {
      setSavingSectionId(null);
    }
  }, [dataService, projectCode, editedSections, addToast]);

  if (!projectCode) {
    return (
      <div>
        <PageHeader title="Superintendent's Plan" />
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
        <PageHeader title="Superintendent's Plan" />
        <HbcSkeleton variant="card" />
      </div>
    );
  }

  if (!plan) {
    return (
      <ComingSoonPage title="Superintendent's Plan" />
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="Superintendent's Plan"
        subtitle={`${plan.superintendentName} - ${selectedProject?.projectName || ''}`}
      />

      {plan.sections.map(section => {
        const currentContent = editedSections[section.id] ?? section.content;
        const hasChanges = editedSections[section.id] !== undefined;

        return (
          <CollapsibleSection
            key={section.id}
            title={section.sectionTitle}
            defaultExpanded={false}
          >
            <Textarea
              className={styles.textarea}
              value={currentContent}
              onChange={(_e, data) => handleSectionChange(section.id, data.value)}
              resize="vertical"
            />
            <div className={styles.sectionMeta}>
              {section.isComplete ? 'Complete' : 'In Progress'}
            </div>
            <div className={styles.sectionActions}>
              <HbcButton
                emphasis="strong"
                onClick={() => handleSaveSection(section)}
                isLoading={savingSectionId === section.id}
                disabled={!hasChanges}
              >
                Save Section
              </HbcButton>
            </div>
          </CollapsibleSection>
        );
      })}
    </div>
  );
};
