import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import { useSignalRContext } from '../contexts/SignalRContext';
import { IUserPresenceMessage, SignalRMessage } from '@hbc/sp-services';

export interface IPresenceUser {
  email: string;
  displayName: string;
  currentPage: string;
  status: 'active' | 'idle';
  lastSeen: number;
}

interface IUsePresenceResult {
  activeUsers: IPresenceUser[];
  myStatus: 'active' | 'idle';
}

const HEARTBEAT_INTERVAL_MS = 60_000; // 60 seconds
const IDLE_TIMEOUT_MS = 180_000; // 3 minutes
const STALE_TIMEOUT_MS = 90_000; // 90 seconds — prune users not seen

export function usePresence(): IUsePresenceResult {
  const { currentUser, selectedProject } = useAppContext();
  const { isEnabled, subscribe, broadcastChange } = useSignalRContext();
  const location = useLocation();

  const [usersMap, setUsersMap] = React.useState<Map<string, IPresenceUser>>(new Map());
  const [myStatus, setMyStatus] = React.useState<'active' | 'idle'>('active');

  const myEmail = currentUser?.email ?? '';
  const projectCode = selectedProject?.projectCode ?? '';

  // --- Idle detection ---
  const lastActivityRef = React.useRef(Date.now());
  const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = React.useCallback(() => {
    lastActivityRef.current = Date.now();
    setMyStatus('active');
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setMyStatus('idle'), IDLE_TIMEOUT_MS);
  }, []);

  React.useEffect(() => {
    if (!isEnabled) return;

    const events = ['mousemove', 'keydown', 'click'] as const;
    events.forEach(ev => window.addEventListener(ev, resetIdleTimer));
    resetIdleTimer(); // start timer

    return () => {
      events.forEach(ev => window.removeEventListener(ev, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isEnabled, resetIdleTimer]);

  // --- Broadcast presence ---
  const broadcastPresence = React.useCallback((status: 'active' | 'idle' | 'disconnected') => {
    if (!myEmail || !projectCode) return;
    broadcastChange({
      type: 'UserPresence',
      userEmail: myEmail,
      displayName: currentUser?.displayName ?? '',
      projectCode,
      currentPage: location.pathname,
      status,
      timestamp: new Date().toISOString(),
    });
  }, [broadcastChange, myEmail, projectCode, currentUser, location.pathname]);

  // Broadcast on mount, route change, and status change
  React.useEffect(() => {
    if (!isEnabled || !myEmail) return;
    broadcastPresence(myStatus);
  }, [isEnabled, myEmail, myStatus, location.pathname, broadcastPresence]);

  // Heartbeat
  React.useEffect(() => {
    if (!isEnabled || !myEmail) return;

    const interval = setInterval(() => {
      broadcastPresence(myStatus);
    }, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isEnabled, myEmail, myStatus, broadcastPresence]);

  // Send disconnected on unmount
  React.useEffect(() => {
    if (!isEnabled || !myEmail) return;
    return () => {
      broadcastPresence('disconnected');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnabled, myEmail]);

  // --- Subscribe to presence messages ---
  React.useEffect(() => {
    if (!isEnabled) return;

    const unsubscribe = subscribe('UserPresence', (msg: SignalRMessage) => {
      if (msg.type !== 'UserPresence') return;
      const presence = msg as IUserPresenceMessage;

      // Ignore our own messages
      if (presence.userEmail === myEmail) return;

      setUsersMap(prev => {
        const next = new Map(prev);
        if (presence.status === 'disconnected') {
          next.delete(presence.userEmail);
        } else {
          next.set(presence.userEmail, {
            email: presence.userEmail,
            displayName: presence.displayName,
            currentPage: presence.currentPage,
            status: presence.status,
            lastSeen: Date.now(),
          });
        }
        return next;
      });
    });

    return unsubscribe;
  }, [isEnabled, subscribe, myEmail]);

  // --- Prune stale users ---
  React.useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setUsersMap(prev => {
        let changed = false;
        const next = new Map(prev);
        next.forEach((user, email) => {
          if (now - user.lastSeen > STALE_TIMEOUT_MS) {
            next.delete(email);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 30_000); // check every 30s

    return () => clearInterval(interval);
  }, [isEnabled]);

  const activeUsers = React.useMemo(
    () => Array.from(usersMap.values()),
    [usersMap]
  );

  return { activeUsers, myStatus };
}
