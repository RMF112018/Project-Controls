/**
 * Phase 3 (GNG Plan) — Per-criterion comment popover.
 * Renders a comment icon button that opens a Fluent UI Popover
 * with a scrollable list of comments and an input to add new ones.
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
  Tooltip,
} from '@fluentui/react-components';
import { Comment24Regular, Comment24Filled, Delete16Regular, Edit16Regular } from '@fluentui/react-icons';
import type { IScorecardCriterionComment } from '@hbc/sp-services';

// ── Styles ──────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  trigger: {
    position: 'relative' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-4px',
  },
  surface: {
    width: '320px',
    maxHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
  },
  list: {
    ...shorthands.overflow('auto'),
    maxHeight: '260px',
    ...shorthands.padding(tokens.spacingVerticalXS, '0'),
  },
  commentItem: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  commentBody: {
    flex: 1,
    minWidth: 0,
  },
  commentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
  authorName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
  },
  timestamp: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
  },
  commentText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    marginTop: tokens.spacingVerticalXXS,
    wordBreak: 'break-word' as const,
  },
  actions: {
    display: 'flex',
    ...shorthands.gap('2px'),
    marginLeft: 'auto',
  },
  inputArea: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXS),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
    ...shorthands.borderTop('1px', 'solid', tokens.colorNeutralStroke2),
  },
  empty: {
    ...shorthands.padding(tokens.spacingVerticalM),
    textAlign: 'center' as const,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

// ── Types ───────────────────────────────────────────────────────────────

export interface ICriterionCommentPopoverProps {
  scorecardId: number;
  criterionId: number;
  criterionLabel: string;
  comments: IScorecardCriterionComment[];
  currentUserEmail: string;
  onAddComment: (criterionId: number, text: string) => void;
  onEditComment: (commentId: number, text: string) => void;
  onDeleteComment: (commentId: number) => void;
  canComment: boolean;
  isLocked: boolean;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// ── Comment Item ────────────────────────────────────────────────────────

interface ICommentItemProps {
  comment: IScorecardCriterionComment;
  isOwn: boolean;
  onEdit: (commentId: number, text: string) => void;
  onDelete: (commentId: number) => void;
  canModify: boolean;
}

const CommentItem: React.FC<ICommentItemProps> = React.memo(({
  comment, isOwn, onEdit, onDelete, canModify,
}) => {
  const styles = useStyles();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editText, setEditText] = React.useState(comment.text);

  const handleSaveEdit = React.useCallback(() => {
    if (editText.trim()) {
      onEdit(comment.id, editText.trim());
      setIsEditing(false);
    }
  }, [comment.id, editText, onEdit]);

  return (
    <div className={styles.commentItem}>
      <Avatar name={comment.authorName} size={24} />
      <div className={styles.commentBody}>
        <div className={styles.commentHeader}>
          <span className={styles.authorName}>{comment.authorName}</span>
          <span className={styles.timestamp}>
            {formatDate(comment.editedDate ?? comment.createdDate)}
            {comment.editedDate ? ' (edited)' : ''}
          </span>
        </div>
        {isEditing ? (
          <div style={{ marginTop: '4px' }}>
            <Textarea
              size="small"
              value={editText}
              onChange={(_, data) => setEditText(data.value)}
              rows={2}
              aria-label="Edit comment"
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              <Button size="small" appearance="primary" onClick={handleSaveEdit}>Save</Button>
              <Button size="small" appearance="subtle" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className={styles.commentText}>{comment.text}</div>
        )}
        {isOwn && canModify && !isEditing && (
          <div className={styles.actions}>
            <Tooltip content="Edit" relationship="label">
              <Button
                size="small"
                appearance="subtle"
                icon={<Edit16Regular />}
                onClick={() => { setEditText(comment.text); setIsEditing(true); }}
                aria-label="Edit comment"
              />
            </Tooltip>
            <Tooltip content="Delete" relationship="label">
              <Button
                size="small"
                appearance="subtle"
                icon={<Delete16Regular />}
                onClick={() => onDelete(comment.id)}
                aria-label="Delete comment"
              />
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
});
CommentItem.displayName = 'CommentItem';

// ── Main Component ──────────────────────────────────────────────────────

export const CriterionCommentPopover: React.FC<ICriterionCommentPopoverProps> = React.memo(({
  criterionId,
  criterionLabel,
  comments,
  currentUserEmail,
  onAddComment,
  onEditComment,
  onDeleteComment,
  canComment,
  isLocked,
}) => {
  const styles = useStyles();
  const [newText, setNewText] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  const filteredComments = React.useMemo(
    () => comments.filter((c) => c.criterionId === criterionId),
    [comments, criterionId],
  );

  const handleAdd = React.useCallback(() => {
    if (newText.trim()) {
      onAddComment(criterionId, newText.trim());
      setNewText('');
    }
  }, [criterionId, newText, onAddComment]);

  const hasComments = filteredComments.length > 0;
  const Icon = hasComments ? Comment24Filled : Comment24Regular;
  const canModify = canComment && !isLocked;

  return (
    <Popover open={isOpen} onOpenChange={(_, data) => setIsOpen(data.open)}>
      <PopoverTrigger disableButtonEnhancement>
        <span className={styles.trigger}>
          <Tooltip content={`Comments for ${criterionLabel}`} relationship="label">
            <Button
              size="small"
              appearance="subtle"
              icon={<Icon />}
              aria-label={`Comments for ${criterionLabel}${hasComments ? ` (${filteredComments.length})` : ''}`}
            />
          </Tooltip>
          {hasComments && (
            <Badge
              className={styles.badge}
              size="small"
              appearance="filled"
              color="brand"
            >
              {filteredComments.length}
            </Badge>
          )}
        </span>
      </PopoverTrigger>
      <PopoverSurface className={styles.surface} aria-label={`Comments for ${criterionLabel}`}>
        {filteredComments.length === 0 ? (
          <div className={styles.empty}>No comments yet</div>
        ) : (
          <div className={styles.list} role="list" aria-label="Comment list">
            {filteredComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isOwn={comment.authorEmail === currentUserEmail}
                onEdit={onEditComment}
                onDelete={onDeleteComment}
                canModify={canModify}
              />
            ))}
          </div>
        )}
        {canModify && (
          <div className={styles.inputArea}>
            <Textarea
              size="small"
              placeholder="Add a comment..."
              value={newText}
              onChange={(_, data) => setNewText(data.value)}
              rows={2}
              aria-label={`Add comment for ${criterionLabel}`}
            />
            <Button
              size="small"
              appearance="primary"
              disabled={!newText.trim()}
              onClick={handleAdd}
            >
              Add
            </Button>
          </div>
        )}
      </PopoverSurface>
    </Popover>
  );
});
CriterionCommentPopover.displayName = 'CriterionCommentPopover';
