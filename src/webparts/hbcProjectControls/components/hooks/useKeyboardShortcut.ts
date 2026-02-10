import * as React from 'react';

interface IShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  handler: () => void;
  /** Only fire when no input/textarea is focused */
  ignoreInputs?: boolean;
}

/**
 * Registers global keyboard shortcuts. Cleans up on unmount.
 * Supports Ctrl/Cmd + key combos. By default ignores inputs.
 */
export function useKeyboardShortcut(shortcuts: IShortcut[]): void {
  const shortcutsRef = React.useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement;
      const tagName = target?.tagName?.toLowerCase();

      for (const shortcut of shortcutsRef.current) {
        // Check if input should be ignored
        if (shortcut.ignoreInputs !== false) {
          if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable) {
            continue;
          }
        }

        const ctrlOrMeta = shortcut.ctrlKey || shortcut.metaKey;
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const modMatches = ctrlOrMeta ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
        const shiftMatches = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;

        if (keyMatches && modMatches && shiftMatches) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
