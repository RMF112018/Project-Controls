import * as React from 'react';
import { TabList, Tab, makeStyles, shorthands } from '@fluentui/react-components';
import type { SelectTabData, SelectTabEvent } from '@fluentui/react-components';
import { PageHeader } from '../../shared/PageHeader';
import { HbcDataTable } from '../../shared/HbcDataTable';
import type { IHbcDataTableColumn } from '../../shared/HbcDataTable';
import { HbcSkeleton } from '../../shared/HbcSkeleton';
import { HbcEmptyState } from '../../shared/HbcEmptyState';
import { useAppContext } from '../../contexts/AppContext';
import type {
  IInternalMatrixTask,
  IOwnerContractArticle,
  ISubContractClause,
} from '@hbc/sp-services';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  tabContent: {
    ...shorthands.padding('16px', '0'),
  },
});

const INTERNAL_COLUMNS: IHbcDataTableColumn<IInternalMatrixTask>[] = [
  { key: 'taskCategory', header: 'Task', render: item => item.taskCategory },
  { key: 'taskDescription', header: 'Description', render: item => item.taskDescription },
  { key: 'PX', header: 'PX', render: item => item.PX },
  { key: 'SrPM', header: 'Sr PM', render: item => item.SrPM },
  { key: 'PM2', header: 'PM2', render: item => item.PM2 },
];

const OWNER_COLUMNS: IHbcDataTableColumn<IOwnerContractArticle>[] = [
  { key: 'articleNumber', header: 'Article', render: item => item.articleNumber },
  { key: 'description', header: 'Description', render: item => item.description },
  { key: 'responsibleParty', header: 'Responsible', render: item => item.responsibleParty },
  { key: 'pageNumber', header: 'Page', render: item => item.pageNumber },
];

const SUB_COLUMNS: IHbcDataTableColumn<ISubContractClause>[] = [
  { key: 'refNumber', header: 'Clause', render: item => item.refNumber },
  { key: 'clauseDescription', header: 'Description', render: item => item.clauseDescription },
  { key: 'ProjExec', header: 'PX', render: item => item.ProjExec },
  { key: 'ProjMgr', header: 'PM', render: item => item.ProjMgr },
  { key: 'Super', header: 'Super', render: item => item.Super },
];

export const ResponsibilityMatrixPage: React.FC = () => {
  const styles = useStyles();
  const { dataService, selectedProject } = useAppContext();
  const projectCode = selectedProject?.projectCode || '';

  const [activeTab, setActiveTab] = React.useState<string>('internal');
  const [internalTasks, setInternalTasks] = React.useState<IInternalMatrixTask[]>([]);
  const [ownerArticles, setOwnerArticles] = React.useState<IOwnerContractArticle[]>([]);
  const [subClauses, setSubClauses] = React.useState<ISubContractClause[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!projectCode) {
      setLoading(false);
      return;
    }

    Promise.all([
      dataService.getInternalMatrix(projectCode),
      dataService.getOwnerContractMatrix(projectCode),
      dataService.getSubContractMatrix(projectCode),
    ])
      .then(([internal, owner, sub]) => {
        setInternalTasks(internal);
        setOwnerArticles(owner);
        setSubClauses(sub);
      })
      .catch(() => {
        setInternalTasks([]);
        setOwnerArticles([]);
        setSubClauses([]);
      })
      .finally(() => setLoading(false));
  }, [dataService, projectCode]);

  const handleTabSelect = React.useCallback((_event: SelectTabEvent, data: SelectTabData): void => {
    setActiveTab(data.value as string);
  }, []);

  if (!projectCode) {
    return (
      <div>
        <PageHeader title="Responsibility Matrix" />
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
        <PageHeader title="Responsibility Matrix" />
        <HbcSkeleton variant="table" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Responsibility Matrix" subtitle={selectedProject?.projectName} />

      <TabList selectedValue={activeTab} onTabSelect={handleTabSelect}>
        <Tab value="internal">Internal Matrix</Tab>
        <Tab value="owner">Owner Contract</Tab>
        <Tab value="sub">Sub-Contract</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {activeTab === 'internal' && (
          <HbcDataTable
            tableId="internal-matrix"
            columns={INTERNAL_COLUMNS}
            items={internalTasks}
            keyExtractor={item => item.id}
            emptyTitle="No Internal Matrix Items"
            emptyDescription="No internal responsibility matrix items found for this project."
            ariaLabel="Internal responsibility matrix"
          />
        )}

        {activeTab === 'owner' && (
          <HbcDataTable
            tableId="owner-contract-matrix"
            columns={OWNER_COLUMNS}
            items={ownerArticles}
            keyExtractor={item => item.id}
            emptyTitle="No Owner Contract Articles"
            emptyDescription="No owner contract articles found for this project."
            ariaLabel="Owner contract responsibility matrix"
          />
        )}

        {activeTab === 'sub' && (
          <HbcDataTable
            tableId="sub-contract-matrix"
            columns={SUB_COLUMNS}
            items={subClauses}
            keyExtractor={item => item.id}
            emptyTitle="No Sub-Contract Clauses"
            emptyDescription="No sub-contract clauses found for this project."
            ariaLabel="Sub-contract responsibility matrix"
          />
        )}
      </div>
    </div>
  );
};
