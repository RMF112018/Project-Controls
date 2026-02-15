import * as React from 'react';
import {
  makeStyles,
  shorthands,
  tokens,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Input,
  Button,
} from '@fluentui/react-components';
import {
  DismissRegular,
  SearchRegular,
  DocumentRegular,
  VideoClipRegular,
  LightbulbRegular,
  BookOpenRegular,
  MailRegular,
  CallRegular,
  GlobeRegular,
  OpenRegular,
} from '@fluentui/react-icons';
import { IHelpGuide, HelpGuideType, ISupportConfig } from '@hbc/sp-services';
import { useHelp } from '../contexts/HelpContext';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { HBC_COLORS, SPACING, ELEVATION } from '../../theme/tokens';
import type { HelpPanelMode } from '../contexts/HelpContext';

const PANEL_WIDTH = 420;

const useStyles = makeStyles({
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 1100,
  },
  panel: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: `${PANEL_WIDTH}px`,
    maxWidth: '90vw',
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: ELEVATION.level4,
    zIndex: 1101,
    display: 'flex',
    flexDirection: 'column',
    animationName: {
      from: { transform: 'translateX(100%)' },
      to: { transform: 'translateX(0)' },
    },
    animationDuration: '0.25s',
    animationTimingFunction: 'ease-out',
    '@media (prefers-reduced-motion: reduce)': {
      animationName: {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('16px', '20px'),
    ...shorthands.borderBottom('1px', 'solid', HBC_COLORS.gray200),
    flexShrink: 0,
  },
  headerTitle: {
    ...shorthands.margin('0'),
    fontSize: '16px',
    fontWeight: 600 as unknown as string,
    color: HBC_COLORS.navy,
  },
  searchContainer: {
    ...shorthands.padding('0', '20px', '12px', '20px'),
    flexShrink: 0,
  },
  body: {
    flexGrow: 1,
    overflowY: 'auto',
    ...shorthands.padding('0', '20px', '20px', '20px'),
  },
  emptyState: {
    textAlign: 'center',
    ...shorthands.padding(SPACING.xl),
    color: tokens.colorNeutralForeground3,
  },
  emptyTitle: {
    fontSize: '14px',
    fontWeight: 600 as unknown as string,
    marginBottom: SPACING.xs,
  },
  emptyDescription: {
    fontSize: '13px',
  },
  guideContent: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'pre-wrap' as unknown as string,
  },
  videoEmbed: {
    marginTop: SPACING.sm,
    width: '100%',
    aspectRatio: '16 / 9',
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('0'),
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '11px',
    fontWeight: 500 as unknown as string,
    lineHeight: '1',
    flexShrink: 0,
    marginLeft: 'auto',
  },
  accordionHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    width: '100%',
  },
  accordionIcon: {
    flexShrink: 0,
    color: HBC_COLORS.navy,
  },
  accordionTitle: {
    flexGrow: 1,
    fontSize: '13px',
    fontWeight: 600 as unknown as string,
  },
  supportSection: {
    marginTop: SPACING.lg,
    ...shorthands.padding(SPACING.md),
    ...shorthands.borderRadius('8px'),
    backgroundColor: HBC_COLORS.gray50,
    ...shorthands.border('1px', 'solid', HBC_COLORS.gray200),
  },
  supportTitle: {
    fontSize: '14px',
    fontWeight: 600 as unknown as string,
    color: HBC_COLORS.navy,
    marginBottom: SPACING.sm,
    ...shorthands.margin('0', '0', SPACING.sm, '0'),
  },
  supportItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    marginBottom: SPACING.xs,
    fontSize: '13px',
  },
  supportLink: {
    color: HBC_COLORS.navy,
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
      color: HBC_COLORS.orange,
    },
  },
  supportIcon: {
    color: HBC_COLORS.gray500,
    flexShrink: 0,
  },
});

const GUIDE_TYPE_CONFIG: Record<HelpGuideType, { color: string; bgColor: string; icon: React.ReactElement; label: string }> = {
  article: { color: '#1E40AF', bgColor: '#DBEAFE', icon: <DocumentRegular fontSize={12} />, label: 'Article' },
  walkthrough: { color: '#065F46', bgColor: '#D1FAE5', icon: <LightbulbRegular fontSize={12} />, label: 'Walkthrough' },
  video: { color: '#7C3AED', bgColor: '#EDE9FE', icon: <VideoClipRegular fontSize={12} />, label: 'Video' },
  tooltip: { color: '#92400E', bgColor: '#FEF3C7', icon: <BookOpenRegular fontSize={12} />, label: 'Tooltip' },
};

const GuideTypeBadge: React.FC<{ guideType: HelpGuideType }> = ({ guideType }) => {
  const styles = useStyles();
  const config = GUIDE_TYPE_CONFIG[guideType];
  return (
    <span className={styles.badge} style={{ color: config.color, backgroundColor: config.bgColor }}>
      {config.icon}
      {config.label}
    </span>
  );
};

const SupportSection: React.FC<{ config: ISupportConfig }> = ({ config }) => {
  const styles = useStyles();
  return (
    <div className={styles.supportSection}>
      <h4 className={styles.supportTitle}>Need More Help?</h4>
      <div className={styles.supportItem}>
        <MailRegular className={styles.supportIcon} />
        <a href={`mailto:${config.supportEmail}`} className={styles.supportLink}>
          {config.supportEmail}
        </a>
      </div>
      {config.supportPhone && (
        <div className={styles.supportItem}>
          <CallRegular className={styles.supportIcon} />
          <a href={`tel:${config.supportPhone}`} className={styles.supportLink}>
            {config.supportPhone}
          </a>
        </div>
      )}
      {config.knowledgeBaseUrl && (
        <div className={styles.supportItem}>
          <GlobeRegular className={styles.supportIcon} />
          <a
            href={config.knowledgeBaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.supportLink}
          >
            Knowledge Base
          </a>
        </div>
      )}
      {config.feedbackFormUrl && (
        <div className={styles.supportItem}>
          <OpenRegular className={styles.supportIcon} />
          <a
            href={config.feedbackFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.supportLink}
          >
            Submit Feedback
          </a>
        </div>
      )}
    </div>
  );
};

interface IHelpPanelProps {
  mode: HelpPanelMode;
}

export const HelpPanel: React.FC<IHelpPanelProps> = ({ mode }) => {
  const styles = useStyles();
  const { guides, supportConfig, closeHelpPanel, currentModuleKey, isLoading } = useHelp();
  const [searchQuery, setSearchQuery] = React.useState('');
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  // Focus close button on open
  React.useEffect(() => {
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeHelpPanel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeHelpPanel]);

  // Filter guides based on mode and search
  const filteredGuides = React.useMemo(() => {
    let result: IHelpGuide[];
    if (mode === 'targeted') {
      result = guides.filter((g) => g.isActive && g.moduleKey === currentModuleKey);
    } else {
      const q = searchQuery.toLowerCase().trim();
      result = guides.filter((g) => {
        if (!g.isActive) return false;
        if (!q) return true;
        return g.title.toLowerCase().includes(q) || g.content.toLowerCase().includes(q);
      });
    }
    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [guides, mode, currentModuleKey, searchQuery]);

  const title = mode === 'targeted' ? 'Help for This Page' : 'Help Library';

  return (
    <>
      <div className={styles.backdrop} onClick={closeHelpPanel} />
      <div role="dialog" aria-modal="true" aria-label={title} className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>{title}</h3>
          <Button
            ref={closeButtonRef}
            appearance="transparent"
            size="small"
            icon={<DismissRegular />}
            onClick={closeHelpPanel}
            aria-label="Close help panel"
          />
        </div>

        {/* Search (library mode only) */}
        {mode === 'library' && (
          <div className={styles.searchContainer}>
            <Input
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(_, data) => setSearchQuery(data.value)}
              contentBefore={<SearchRegular />}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {/* Body */}
        <div className={styles.body}>
          {isLoading ? (
            <LoadingSpinner size="medium" label="Loading guides..." />
          ) : filteredGuides.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyTitle}>
                {mode === 'targeted' ? 'No guides for this page' : 'No matching guides'}
              </div>
              <div className={styles.emptyDescription}>
                {mode === 'targeted'
                  ? 'Try the Full Help Library for all available guides.'
                  : 'Adjust your search terms and try again.'}
              </div>
            </div>
          ) : (
            <Accordion multiple collapsible>
              {filteredGuides.map((guide) => {
                const typeConfig = GUIDE_TYPE_CONFIG[guide.guideType];
                return (
                  <AccordionItem key={guide.id} value={String(guide.id)}>
                    <AccordionHeader>
                      <div className={styles.accordionHeader}>
                        <span className={styles.accordionIcon}>{typeConfig.icon}</span>
                        <span className={styles.accordionTitle}>{guide.title}</span>
                        <GuideTypeBadge guideType={guide.guideType} />
                      </div>
                    </AccordionHeader>
                    <AccordionPanel>
                      <div className={styles.guideContent}>{guide.content}</div>
                      {guide.videoUrl && (
                        <iframe
                          src={guide.videoUrl}
                          title={guide.title}
                          className={styles.videoEmbed}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          {/* Support section */}
          {supportConfig && <SupportSection config={supportConfig} />}
        </div>
      </div>
    </>
  );
};
