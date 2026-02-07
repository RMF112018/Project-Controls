import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@fluentui/react-components';
import { useAppContext } from '../contexts/AppContext';
import { ILead } from '../../models';
import { HBC_COLORS } from '../../theme/tokens';
import { formatCurrencyCompact } from '../../utils/formatters';

interface ISearchBarProps {
  placeholder?: string;
}

export const SearchBar: React.FC<ISearchBarProps> = ({ placeholder = 'Search projects, clients, codes...' }) => {
  const navigate = useNavigate();
  const { dataService } = useAppContext();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<ILead[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = React.useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const items = await dataService.searchLeads(value);
        setResults(items.slice(0, 8));
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  }, [dataService]);

  const handleSelect = (lead: ILead): void => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    navigate(`/lead/${lead.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: '280px', maxWidth: '400px' }}>
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(_, data) => handleSearch(data.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        style={{ width: '100%' }}
        size="small"
      />
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxHeight: '360px',
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
          {results.map(lead => (
            <div
              key={lead.id}
              onClick={() => handleSelect(lead)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                borderBottom: `1px solid ${HBC_COLORS.gray100}`,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.backgroundColor = HBC_COLORS.gray50)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.backgroundColor = '')}
            >
              <div style={{ fontSize: '13px', fontWeight: 500, color: HBC_COLORS.navy }}>
                {lead.Title}
                {lead.ProjectCode && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: HBC_COLORS.gray400 }}>
                    {lead.ProjectCode}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: HBC_COLORS.gray500, marginTop: '2px' }}>
                {lead.ClientName}
                {lead.ProjectValue ? ` — ${formatCurrencyCompact(lead.ProjectValue)}` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
