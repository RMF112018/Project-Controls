import * as React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import {
  Folder24Regular,
  Document24Regular,
  Image24Regular,
  DocumentPdf24Regular,
  ArrowDownload24Regular,
} from '@fluentui/react-icons';
import { PageHeader } from '../../shared/PageHeader';
import { HbcCard } from '../../shared/HbcCard';
import { KPICard } from '../../shared/KPICard';
import { useAppContext } from '../../contexts/AppContext';
import { HBC_COLORS } from '../../../theme/tokens';

interface IDocumentCategory {
  name: string;
  icon: React.ReactNode;
  fileCount: number;
  lastModified: string;
  description: string;
  recentFiles: { name: string; type: string; size: string; modified: string }[];
}

const MOCK_CATEGORIES: IDocumentCategory[] = [
  {
    name: 'Contracts',
    icon: <DocumentPdf24Regular />,
    fileCount: 24,
    lastModified: '2026-02-18',
    description: 'Prime contract, subcontracts, purchase orders, and amendments.',
    recentFiles: [
      { name: 'Prime Contract - Executed.pdf', type: 'PDF', size: '4.2 MB', modified: '2025-09-15' },
      { name: 'CO-003 - Roof Drain - Approved.pdf', type: 'PDF', size: '890 KB', modified: '2026-01-20' },
      { name: 'Atlas Steel - Subcontract.pdf', type: 'PDF', size: '2.1 MB', modified: '2025-11-10' },
    ],
  },
  {
    name: 'Drawings',
    icon: <Document24Regular />,
    fileCount: 156,
    lastModified: '2026-02-20',
    description: 'Construction documents, shop drawings, and as-built drawings.',
    recentFiles: [
      { name: 'S-301 - 3rd Floor Framing Plan.pdf', type: 'PDF', size: '18.5 MB', modified: '2026-02-20' },
      { name: 'M-201 - HVAC Ductwork Layout Rev3.pdf', type: 'PDF', size: '12.3 MB', modified: '2026-02-15' },
      { name: 'A-101 - Floor Plan Rev5.pdf', type: 'PDF', size: '8.7 MB', modified: '2026-02-10' },
    ],
  },
  {
    name: 'Submittals',
    icon: <Folder24Regular />,
    fileCount: 89,
    lastModified: '2026-02-19',
    description: 'Product submittals, material certifications, and shop drawings.',
    recentFiles: [
      { name: 'SUB-045 - Fire Sprinkler Shop Dwgs.pdf', type: 'PDF', size: '6.4 MB', modified: '2026-02-19' },
      { name: 'SUB-044 - Curtain Wall System.pdf', type: 'PDF', size: '15.2 MB', modified: '2026-02-12' },
      { name: 'SUB-043 - Elevator Equipment.pdf', type: 'PDF', size: '3.8 MB', modified: '2026-02-05' },
    ],
  },
  {
    name: 'RFIs',
    icon: <Document24Regular />,
    fileCount: 67,
    lastModified: '2026-02-21',
    description: 'Requests for information with architect and engineer responses.',
    recentFiles: [
      { name: 'RFI-067 - Curtain Wall Spec Clarification.pdf', type: 'PDF', size: '420 KB', modified: '2026-02-21' },
      { name: 'RFI-066 - Elec Room Relocation Details.pdf', type: 'PDF', size: '1.1 MB', modified: '2026-02-18' },
      { name: 'RFI-065 - Waterproofing at Grade.pdf', type: 'PDF', size: '680 KB', modified: '2026-02-14' },
    ],
  },
  {
    name: 'Meeting Minutes',
    icon: <Document24Regular />,
    fileCount: 42,
    lastModified: '2026-02-20',
    description: 'OAC meeting minutes, subcontractor meeting notes, and safety meeting records.',
    recentFiles: [
      { name: 'OAC Meeting #22 - 2026-02-20.pdf', type: 'PDF', size: '350 KB', modified: '2026-02-20' },
      { name: 'Sub Coordination Mtg #18.pdf', type: 'PDF', size: '280 KB', modified: '2026-02-18' },
      { name: 'Safety Meeting - Week 8.pdf', type: 'PDF', size: '195 KB', modified: '2026-02-17' },
    ],
  },
  {
    name: 'Photos',
    icon: <Image24Regular />,
    fileCount: 1_284,
    lastModified: '2026-02-21',
    description: 'Daily progress photos, milestone documentation, and inspection records.',
    recentFiles: [
      { name: '2026-02-21_Steel-Erection-L2.jpg', type: 'Image', size: '5.2 MB', modified: '2026-02-21' },
      { name: '2026-02-20_Slab-Prep-L3.jpg', type: 'Image', size: '4.8 MB', modified: '2026-02-20' },
      { name: '2026-02-19_MEP-Coordination.jpg', type: 'Image', size: '3.9 MB', modified: '2026-02-19' },
    ],
  },
];

const useStyles = makeStyles({
  container: {
    display: 'grid',
    ...shorthands.gap('24px'),
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    ...shorthands.gap('16px'),
  },
  categoriesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    ...shorthands.gap('16px'),
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
  },
  categoryIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.infoLight,
    color: HBC_COLORS.info,
    flexShrink: 0,
  },
  categoryInfo: {
    display: 'grid',
    ...shorthands.gap('2px'),
  },
  categoryName: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
  },
  categoryMeta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  categoryDesc: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: '8px',
    marginBottom: '12px',
  },
  fileList: {
    display: 'grid',
    ...shorthands.gap('0'),
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    ':last-child': {
      ...shorthands.borderBottom('0', 'none', 'transparent'),
    },
  },
  fileInfo: {
    display: 'grid',
    ...shorthands.gap('2px'),
    minWidth: 0,
  },
  fileName: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: HBC_COLORS.navy,
    ...shorthands.overflow('hidden'),
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileMeta: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
  },
  downloadIcon: {
    color: tokens.colorNeutralForeground3,
    cursor: 'pointer',
    flexShrink: 0,
    ':hover': {
      color: HBC_COLORS.info,
    },
  },
  integrationBanner: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px', '20px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'dashed', HBC_COLORS.gray300),
  },
  bannerText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
});

export const PHDocumentsPage: React.FC = () => {
  const styles = useStyles();
  const { selectedProject } = useAppContext();

  const projectName = selectedProject?.projectName || 'Unknown Project';
  const projectCode = selectedProject?.projectCode || '\u2014';

  const totalFiles = MOCK_CATEGORIES.reduce((sum, cat) => sum + cat.fileCount, 0);
  const totalCategories = MOCK_CATEGORIES.length;

  return (
    <div className={styles.container}>
      <PageHeader
        title="Project Documents"
        subtitle={`${projectCode} \u2014 ${projectName}`}
      />

      <div className={styles.kpiGrid}>
        <KPICard
          title="Total Documents"
          value={totalFiles.toLocaleString()}
          subtitle={`Across ${totalCategories} categories`}
        />
        <KPICard
          title="RFIs Filed"
          value="67"
          subtitle="12 open, 3 overdue"
        />
        <KPICard
          title="Submittals Tracked"
          value="89"
          subtitle="8 pending review"
        />
        <KPICard
          title="Photos This Month"
          value="148"
          subtitle="Daily progress documentation"
        />
      </div>

      <div className={styles.integrationBanner}>
        <Folder24Regular style={{ color: HBC_COLORS.gray400 }} />
        <span className={styles.bannerText}>
          <strong>SharePoint Document Library Integration:</strong> When connected to a SharePoint
          project site, this view will display the embedded document library with full navigation,
          search, and version history. Currently showing document category summary.
        </span>
      </div>

      <div className={styles.categoriesGrid}>
        {MOCK_CATEGORIES.map((category) => (
          <HbcCard key={category.name} title={category.name}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryIcon}>{category.icon}</div>
              <div className={styles.categoryInfo}>
                <span className={styles.categoryMeta}>
                  {category.fileCount.toLocaleString()} files
                </span>
                <span className={styles.categoryMeta}>
                  Updated {new Date(category.lastModified).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className={styles.categoryDesc}>{category.description}</div>
            <div className={styles.fileList}>
              {category.recentFiles.map((file) => (
                <div key={file.name} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileMeta}>
                      {file.type} | {file.size} | {new Date(file.modified).toLocaleDateString()}
                    </span>
                  </div>
                  <ArrowDownload24Regular className={styles.downloadIcon} />
                </div>
              ))}
            </div>
          </HbcCard>
        ))}
      </div>
    </div>
  );
};
