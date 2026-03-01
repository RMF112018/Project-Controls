/**
 * Phase 3 (GNG Plan) — Global discussion notes panel with @mention support.
 * Renders inside a CollapsibleSection with an append-only note list
 * and an input area with an @mention people picker.
 */
import * as React from 'react';
import {
  Avatar,
  Badge,
  Button,
  makeStyles,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  shorthands,
  Textarea,
  tokens,
} from '@fluentui/react-components';
import { Mention24Regular } from '@fluentui/react-icons';
import type { IScorecardNote } from '@hbc/sp-services';
import { CollapsibleSection } from './CollapsibleSection';
import { AzureADPeoplePicker } from './AzureADPeoplePicker';
import { HbcEmptyState } from './HbcEmptyState';

// ── Styles ──────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  noteList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  noteItem: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  noteBody: {
    flex: 1,
    minWidth: 0,
  },
  noteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  timestamp: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  noteText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalXXS,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  mentionList: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    marginTop: tokens.spacingVerticalXS,
  },
  inputArea: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
    marginTop: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
  },
  inputRow: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
    alignItems: 'flex-end',
  },
  selectedMentions: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
});

// ── Types ───────────────────────────────────────────────────────────────

export interface IScorecardNotePanelProps {
  scorecardId: number;
  notes: IScorecardNote[];
  currentUserEmail: string;
  onAddNote: (text: string, mentions: string[]) => void;
  canAddNote: boolean;
  isLocked: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// ── Note Item ───────────────────────────────────────────────────────────

interface INoteItemProps {
  note: IScorecardNote;
}

const NoteItem: React.FC<INoteItemProps> = React.memo(({ note }) => {
  const styles = useStyles();
  return (
    <div className={styles.noteItem}>
      <Avatar name={note.authorName} size={28} />
      <div className={styles.noteBody}>
        <div className={styles.noteHeader}>
          <span className={styles.authorName}>{note.authorName}</span>
          <span className={styles.timestamp}>{formatDate(note.createdDate)}</span>
        </div>
        <div className={styles.noteText}>{note.text}</div>
        {note.mentions.length > 0 && (
          <div className={styles.mentionList}>
            {note.mentions.map((email) => (
              <Badge key={email} size="small" appearance="outline" color="informative">
                @{email.split('@')[0]}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
NoteItem.displayName = 'NoteItem';

// ── Main Component ──────────────────────────────────────────────────────

export const ScorecardNotePanel: React.FC<IScorecardNotePanelProps> = React.memo(({
  notes,
  onAddNote,
  canAddNote,
  isLocked,
}) => {
  const styles = useStyles();
  const [noteText, setNoteText] = React.useState('');
  const [selectedMentions, setSelectedMentions] = React.useState<Array<{ email: string; displayName: string }>>([]);
  const [mentionPickerOpen, setMentionPickerOpen] = React.useState(false);

  const handleAddNote = React.useCallback(() => {
    if (noteText.trim()) {
      onAddNote(noteText.trim(), selectedMentions.map((m) => m.email));
      setNoteText('');
      setSelectedMentions([]);
    }
  }, [noteText, selectedMentions, onAddNote]);

  const handleMentionSelect = React.useCallback((person: { email: string; displayName: string }) => {
    setSelectedMentions((prev) => {
      if (prev.some((m) => m.email === person.email)) return prev;
      return [...prev, person];
    });
  }, []);

  const handleRemoveMention = React.useCallback((email: string) => {
    setSelectedMentions((prev) => prev.filter((m) => m.email !== email));
  }, []);

  const canSubmit = canAddNote && !isLocked;

  return (
    <CollapsibleSection title="Discussion Notes" defaultExpanded={false} badge={
      notes.length > 0 ? (
        <Badge size="small" appearance="filled" color="brand">{notes.length}</Badge>
      ) : undefined
    }>
      {notes.length === 0 ? (
        <HbcEmptyState title="No notes yet" description="Add a discussion note to collaborate with your team." />
      ) : (
        <div className={styles.noteList}>
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))}
        </div>
      )}

      {canSubmit && (
        <div className={styles.inputArea}>
          <Textarea
            placeholder="Add a discussion note..."
            value={noteText}
            onChange={(_, data) => setNoteText(data.value)}
            rows={3}
            resize="vertical"
            aria-label="Add discussion note"
          />
          {selectedMentions.length > 0 && (
            <div className={styles.selectedMentions}>
              {selectedMentions.map((m) => (
                <Badge
                  key={m.email}
                  size="small"
                  appearance="filled"
                  color="informative"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRemoveMention(m.email)}
                >
                  @{m.displayName} ✕
                </Badge>
              ))}
            </div>
          )}
          <div className={styles.inputRow}>
            <Popover open={mentionPickerOpen} onOpenChange={(_, data) => setMentionPickerOpen(data.open)}>
              <PopoverTrigger disableButtonEnhancement>
                <Button
                  size="small"
                  appearance="subtle"
                  icon={<Mention24Regular />}
                  aria-label="Add mention"
                >
                  @ Mention
                </Button>
              </PopoverTrigger>
              <PopoverSurface style={{ width: '300px' }}>
                <AzureADPeoplePicker
                  label="Select people to mention"
                  multiSelect
                  selectedUsers={selectedMentions.map((m) => ({
                    userId: m.email,
                    email: m.email,
                    displayName: m.displayName,
                  }))}
                  onSelectMulti={(users) => {
                    if (users.length > 0) {
                      const latest = users[users.length - 1];
                      handleMentionSelect({
                        email: latest.email,
                        displayName: latest.displayName,
                      });
                    }
                  }}
                />
              </PopoverSurface>
            </Popover>
            <div style={{ flex: 1 }} />
            <Button
              appearance="primary"
              disabled={!noteText.trim()}
              onClick={handleAddNote}
            >
              Add Note
            </Button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
});
ScorecardNotePanel.displayName = 'ScorecardNotePanel';
