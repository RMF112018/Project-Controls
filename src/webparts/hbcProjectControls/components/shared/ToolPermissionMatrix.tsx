import * as React from 'react';
import { IToolAccess, PermissionLevel, TOOL_DEFINITIONS, TOOL_GROUPS, getToolsByGroup } from '@hbc/sp-services';
import { GranularFlagEditor } from './GranularFlagEditor';
import { HBC_COLORS } from '../../theme/tokens';

interface IToolPermissionMatrixProps {
  toolAccess: IToolAccess[];
  onChange: (toolAccess: IToolAccess[]) => void;
  disabled?: boolean;
}

const LEVELS: PermissionLevel[] = [
  PermissionLevel.NONE,
  PermissionLevel.READ_ONLY,
  PermissionLevel.STANDARD,
  PermissionLevel.ADMIN,
];

const LEVEL_LABELS: Record<PermissionLevel, string> = {
  [PermissionLevel.NONE]: 'None',
  [PermissionLevel.READ_ONLY]: 'Read Only',
  [PermissionLevel.STANDARD]: 'Standard',
  [PermissionLevel.ADMIN]: 'Admin',
};

const GROUP_LABELS: Record<string, string> = {
  marketing: 'Marketing',
  preconstruction: 'Preconstruction',
  operations: 'Operations',
  admin: 'Administration',
};

export const ToolPermissionMatrix: React.FC<IToolPermissionMatrixProps> = ({
  toolAccess,
  onChange,
  disabled = false,
}) => {
  const [expandedTool, setExpandedTool] = React.useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(new Set());

  const accessMap = React.useMemo(() => {
    const map: Record<string, IToolAccess> = {};
    for (const a of toolAccess) {
      map[a.toolKey] = a;
    }
    return map;
  }, [toolAccess]);

  const getLevel = (toolKey: string): PermissionLevel => {
    return accessMap[toolKey]?.level || PermissionLevel.NONE;
  };

  const getFlags = (toolKey: string): string[] => {
    return accessMap[toolKey]?.granularFlags || [];
  };

  const handleLevelChange = (toolKey: string, level: PermissionLevel): void => {
    if (disabled) return;
    const existing = accessMap[toolKey];
    const updated: IToolAccess = {
      toolKey,
      level,
      granularFlags: existing?.granularFlags || [],
    };
    const newAccess = toolAccess.filter(a => a.toolKey !== toolKey);
    if (level !== PermissionLevel.NONE || (updated.granularFlags && updated.granularFlags.length > 0)) {
      newAccess.push(updated);
    }
    onChange(newAccess);
  };

  const handleFlagsChange = (toolKey: string, flags: string[]): void => {
    if (disabled) return;
    const existing = accessMap[toolKey];
    const level = existing?.level || PermissionLevel.NONE;
    const updated: IToolAccess = { toolKey, level, granularFlags: flags };
    const newAccess = toolAccess.filter(a => a.toolKey !== toolKey);
    if (level !== PermissionLevel.NONE || flags.length > 0) {
      newAccess.push(updated);
    }
    onChange(newAccess);
  };

  const toggleGroup = (group: string): void => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  return (
    <div style={{ border: `1px solid ${HBC_COLORS.gray200}`, borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr repeat(4, 90px)',
        backgroundColor: HBC_COLORS.gray50,
        borderBottom: `1px solid ${HBC_COLORS.gray200}`,
        padding: '10px 16px',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: HBC_COLORS.gray500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Tool
        </div>
        {LEVELS.map(level => (
          <div key={level} style={{
            fontSize: '11px', fontWeight: 600, color: HBC_COLORS.gray500,
            textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center',
          }}>
            {LEVEL_LABELS[level]}
          </div>
        ))}
      </div>

      {/* Tool groups */}
      {TOOL_GROUPS.map(group => {
        const tools = getToolsByGroup(group);
        const isCollapsed = collapsedGroups.has(group);
        return (
          <div key={group}>
            {/* Group header */}
            <div
              onClick={() => toggleGroup(group)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: HBC_COLORS.navy,
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <span style={{ fontSize: '11px', color: HBC_COLORS.white, transition: 'transform 0.15s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                &#9660;
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: HBC_COLORS.white, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {GROUP_LABELS[group] || group}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginLeft: 'auto' }}>
                {tools.length} tool{tools.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Tool rows */}
            {!isCollapsed && tools.map(tool => {
              const currentLevel = getLevel(tool.toolKey);
              const currentFlags = getFlags(tool.toolKey);
              const hasFlags = tool.granularFlags.length > 0;
              const isExpanded = expandedTool === tool.toolKey;

              return (
                <div key={tool.toolKey} style={{ borderBottom: `1px solid ${HBC_COLORS.gray100}` }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr repeat(4, 90px)',
                    padding: '10px 16px',
                    alignItems: 'center',
                    backgroundColor: isExpanded ? HBC_COLORS.gray50 : '#fff',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: HBC_COLORS.gray800 }}>
                          {tool.label}
                        </div>
                        <div style={{ fontSize: '11px', color: HBC_COLORS.gray400 }}>
                          {tool.description}
                        </div>
                      </div>
                      {hasFlags && (
                        <button
                          onClick={() => setExpandedTool(isExpanded ? null : tool.toolKey)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: '11px', color: HBC_COLORS.info, padding: '2px 6px',
                            borderRadius: '4px', marginLeft: 'auto', flexShrink: 0,
                          }}
                          title="Toggle granular flags"
                        >
                          {currentFlags.length > 0 && (
                            <span style={{
                              display: 'inline-block', width: '16px', height: '16px',
                              borderRadius: '50%', backgroundColor: HBC_COLORS.info,
                              color: '#fff', fontSize: '10px', lineHeight: '16px',
                              textAlign: 'center', marginRight: '4px',
                            }}>
                              {currentFlags.length}
                            </span>
                          )}
                          {isExpanded ? 'Hide' : 'Flags'}
                        </button>
                      )}
                    </div>
                    {LEVELS.map(level => (
                      <div key={level} style={{ textAlign: 'center' }}>
                        <input
                          type="radio"
                          name={`tool-${tool.toolKey}`}
                          checked={currentLevel === level}
                          onChange={() => handleLevelChange(tool.toolKey, level)}
                          disabled={disabled}
                          style={{ accentColor: HBC_COLORS.navy, cursor: disabled ? 'default' : 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Granular flags expansion */}
                  {isExpanded && hasFlags && (
                    <div style={{
                      padding: '0 16px 12px 32px',
                      backgroundColor: HBC_COLORS.gray50,
                      borderTop: `1px solid ${HBC_COLORS.gray100}`,
                    }}>
                      <GranularFlagEditor
                        flags={tool.granularFlags}
                        selectedFlags={currentFlags}
                        onChange={(flags) => handleFlagsChange(tool.toolKey, flags)}
                        disabled={disabled}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
