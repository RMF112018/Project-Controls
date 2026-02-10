import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@fluentui/react-components';
import { useAppContext } from '../contexts/AppContext';
import { ILead, IEstimatingTracker, IGoNoGoScorecard } from '../../models';
import { HBC_COLORS, ELEVATION } from '../../theme/tokens';
import { formatCurrencyCompact } from '../../utils/formatters';

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

  // Reset active index when results change
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

        // Fetch all entities in parallel
        const [leadResults, estResult, scorecards] = await Promise.all([
          dataService.searchLeads(value),
          dataService.getEstimatingRecords(),
          dataService.getScorecards(),
        ]);

        // Map leads
        const leadItems: ISearchResult[] = leadResults.slice(0, MAX_PER_GROUP).map((l: ILead) => ({
          type: 'lead' as const,
          id: l.id,
          title: l.Title,
          subtitle: `${l.ClientName}${l.ProjectValue ? ` — ${formatCurrencyCompact(l.ProjectValue)}` : ''}`,
          extra: l.ProjectCode || undefined,
          navigateTo: `/lead/${l.id}`,
        }));

        // Filter estimates client-side
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

        // Filter scorecards client-side
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

        // Save to recent
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

    // Get flat list of selectable items (skip group headers)
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

  // Group results by type
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

  // Build a flat index mapping for keyboard nav
  const flatIndexMap = React.useMemo(() => {
    const map: ISearchResult[] = [];
    groupedResults.forEach(g => g.items.forEach(item => map.push(item)));
    return map;
  }, [groupedResults]);

  const recentSearches = showRecent ? getRecentSearches() : [];

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: '280px', maxWidth: '400px' }}>
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
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderRadius: '0 0 8px 8px',
          boxShadow: ELEVATION.level3,
          zIndex: 1000,
        }}>
          <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 600, color: HBC_COLORS.gray400, textTransform: 'uppercase' }}>
            Recent Searches
          </div>
          {recentSearches.map((s, i) => (
            <div
              key={i}
              onClick={() => { setShowRecent(false); handleSearch(s); }}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                color: HBC_COLORS.gray600,
                cursor: 'pointer',
                borderTop: `1px solid ${HBC_COLORS.gray100}`,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = HBC_COLORS.gray50)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '')}
            >
              {s}
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderRadius: '0 0 8px 8px',
          boxShadow: ELEVATION.level3,
          zIndex: 1000,
          maxHeight: '400px',
          overflow: 'auto',
        }}>
          {isSearching && (
            <div style={{ padding: '12px 16px', fontSize: '13px', color: HBC_COLORS.gray500 }}>
              Searching...
            </div>
          )}
          {!isSearching && results.length === 0 && query.trim() && (
            <div style={{ padding: '12px 16px', fontSize: '13px', color: HBC_COLORS.gray500 }}>
              No results found
            </div>
          )}
          {groupedResults.map(group => (
            <div key={group.type}>
              <div style={{
                padding: '8px 16px',
                fontSize: '11px',
                fontWeight: 600,
                color: HBC_COLORS.gray400,
                textTransform: 'uppercase',
                backgroundColor: HBC_COLORS.gray50,
                borderTop: `1px solid ${HBC_COLORS.gray100}`,
              }}>
                {group.label}
              </div>
              {group.items.map(result => {
                const flatIdx = flatIndexMap.indexOf(result);
                const isActive = flatIdx === activeIndex;
                return (
                  <div
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${HBC_COLORS.gray100}`,
                      backgroundColor: isActive ? HBC_COLORS.gray100 : undefined,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = HBC_COLORS.gray50;
                      setActiveIndex(flatIdx);
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = isActive ? HBC_COLORS.gray100 : '';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: HBC_COLORS.navy }}>
                        {result.title}
                      </span>
                      {result.extra && (
                        <span style={{ fontSize: '11px', color: HBC_COLORS.gray400, fontFamily: 'monospace' }}>
                          {result.extra}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: HBC_COLORS.gray500, marginTop: '2px' }}>
                      {result.subtitle}
                    </div>
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
