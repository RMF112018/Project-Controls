import * as React from 'react';
import { useNavigate } from '@router';
import { Input, makeStyles, shorthands, tokens, mergeClasses } from '@fluentui/react-components';
import { useAppContext } from '../contexts/AppContext';
import { ILead, IEstimatingTracker, IGoNoGoScorecard, formatCurrencyCompact } from '@hbc/sp-services';
import { ELEVATION } from '../../theme/tokens';

const useStyles = makeStyles({
  root: {
    position: 'relative',
    minWidth: '280px',
    maxWidth: '400px',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('0', '0', '8px', '8px'),
    boxShadow: ELEVATION.level3,
    zIndex: 1000,
  },
  dropdownScrollable: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  groupHeader: {
    ...shorthands.padding('8px', '16px'),
    fontSize: '11px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase',
  },
  groupHeaderBg: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralBackground3}`,
  },
  resultItem: {
    ...shorthands.padding('10px', '16px'),
    cursor: 'pointer',
    borderBottom: `1px solid ${tokens.colorNeutralBackground3}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  resultItemActive: {
    backgroundColor: tokens.colorNeutralBackground3,
  },
  resultTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: tokens.colorBrandForeground1,
  },
  resultExtra: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
    fontFamily: 'monospace',
  },
  resultSubtitle: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginTop: '2px',
  },
  messageText: {
    ...shorthands.padding('12px', '16px'),
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
  recentItem: {
    ...shorthands.padding('8px', '16px'),
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    cursor: 'pointer',
    borderTop: `1px solid ${tokens.colorNeutralBackground3}`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

interface ISearchBarProps {
  placeholder?: string;
}

type SearchResultType = 'lead' | 'estimate' | 'scorecard';

interface ISearchResult {
  type: SearchResultType;
  id: number;
  title: string;
  subtitle: string;
  extra?: string;
  navigateTo: string;
}

const RECENT_SEARCHES_KEY = 'hbc-recent-searches';
const MAX_RECENT = 5;
const MAX_PER_GROUP = 4;
const MAX_TOTAL = 12;

function getRecentSearches(): string[] {
  try {
    const raw = sessionStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string): void {
  try {
    const recent = getRecentSearches().filter(s => s !== query);
    recent.unshift(query);
    sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}

export const SearchBar: React.FC<ISearchBarProps> = ({ placeholder = 'Search projects, clients, codes...' }) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { dataService } = useAppContext();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ISearchResult[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [showRecent, setShowRecent] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowRecent(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const handleSearch = React.useCallback((value: string) => {
    setQuery(value);
    setShowRecent(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const q = value.toLowerCase();

        const [leadResults, estResult, scorecards] = await Promise.all([
          dataService.searchLeads(value),
          dataService.getEstimatingRecords(),
          dataService.getScorecards(),
        ]);

        const leadItems: ISearchResult[] = leadResults.slice(0, MAX_PER_GROUP).map((l: ILead) => ({
          type: 'lead' as const,
          id: l.id,
          title: l.Title,
          subtitle: `${l.ClientName}${l.ProjectValue ? ` — ${formatCurrencyCompact(l.ProjectValue)}` : ''}`,
          extra: l.ProjectCode || undefined,
          navigateTo: `/lead/${l.id}`,
        }));

        const estItems: ISearchResult[] = estResult.items
          .filter((r: IEstimatingTracker) =>
            r.Title?.toLowerCase().includes(q) ||
            r.ProjectCode?.toLowerCase().includes(q) ||
            r.LeadEstimator?.toLowerCase().includes(q)
          )
          .slice(0, MAX_PER_GROUP)
          .map((r: IEstimatingTracker) => ({
            type: 'estimate' as const,
            id: r.id,
            title: r.Title,
            subtitle: `${r.LeadEstimator || 'Unassigned'}${r.EstimatedCostValue ? ` — ${formatCurrencyCompact(r.EstimatedCostValue)}` : ''}`,
            extra: r.ProjectCode || undefined,
            navigateTo: `/preconstruction/pursuit/${r.id}`,
          }));

        const scItems: ISearchResult[] = scorecards
          .filter((s: IGoNoGoScorecard) =>
            s.ProjectCode?.toLowerCase().includes(q)
          )
          .slice(0, MAX_PER_GROUP)
          .map((s: IGoNoGoScorecard) => ({
            type: 'scorecard' as const,
            id: s.id,
            title: s.ProjectCode || `Scorecard #${s.id}`,
            subtitle: `${s.Decision || 'Pending'}${s.TotalScore_Orig ? ` — Score: ${s.TotalScore_Orig}` : ''}`,
            navigateTo: `/lead/${s.LeadID}/gonogo/detail`,
          }));

        const all = [...leadItems, ...estItems, ...scItems].slice(0, MAX_TOTAL);
        setResults(all);
        setIsOpen(true);

        saveRecentSearch(value.trim());
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  }, [dataService]);

  const handleSelect = (result: ISearchResult): void => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setShowRecent(false);
    navigate(result.navigateTo);
  };

  const handleFocus = (): void => {
    if (results.length > 0) {
      setIsOpen(true);
    } else if (!query.trim()) {
      const recent = getRecentSearches();
      if (recent.length > 0) setShowRecent(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setShowRecent(false);
      setQuery('');
      return;
    }

    if (!isOpen || results.length === 0) return;

    const selectableCount = results.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % selectableCount);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + selectableCount) % selectableCount);
    } else if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < selectableCount) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    }
  };

  const groupedResults = React.useMemo(() => {
    const groups: { type: SearchResultType; label: string; items: ISearchResult[] }[] = [];
    const typeLabels: Record<SearchResultType, string> = {
      lead: 'Leads',
      estimate: 'Estimates',
      scorecard: 'Scorecards',
    };

    for (const type of ['lead', 'estimate', 'scorecard'] as SearchResultType[]) {
      const items = results.filter(r => r.type === type);
      if (items.length > 0) {
        groups.push({ type, label: typeLabels[type], items });
      }
    }
    return groups;
  }, [results]);

  const flatIndexMap = React.useMemo(() => {
    const map: ISearchResult[] = [];
    groupedResults.forEach(g => g.items.forEach(item => map.push(item)));
    return map;
  }, [groupedResults]);

  const recentSearches = showRecent ? getRecentSearches() : [];

  return (
    <div ref={containerRef} className={styles.root}>
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(_, data) => handleSearch(data.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        style={{ width: '100%' }}
        size="small"
      />

      {/* Recent Searches */}
      {showRecent && recentSearches.length > 0 && !isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.groupHeader}>Recent Searches</div>
          {recentSearches.map((s, i) => (
            <div
              key={i}
              onClick={() => { setShowRecent(false); handleSearch(s); }}
              className={styles.recentItem}
            >
              {s}
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      {isOpen && (
        <div className={mergeClasses(styles.dropdown, styles.dropdownScrollable)}>
          {isSearching && (
            <div className={styles.messageText}>Searching...</div>
          )}
          {!isSearching && results.length === 0 && query.trim() && (
            <div className={styles.messageText}>No results found</div>
          )}
          {groupedResults.map(group => (
            <div key={group.type}>
              <div className={mergeClasses(styles.groupHeader, styles.groupHeaderBg)}>
                {group.label}
              </div>
              {group.items.map(result => {
                const flatIdx = flatIndexMap.indexOf(result);
                const isActiveItem = flatIdx === activeIndex;
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={mergeClasses(styles.resultItem, isActiveItem ? styles.resultItemActive : undefined)}
                    onMouseEnter={() => setActiveIndex(flatIdx)}
                  >
                    <div className={styles.resultHeader}>
                      <span className={styles.resultTitle}>{result.title}</span>
                      {result.extra && (
                        <span className={styles.resultExtra}>{result.extra}</span>
                      )}
                    </div>
                    <div className={styles.resultSubtitle}>{result.subtitle}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
