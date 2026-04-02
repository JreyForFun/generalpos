import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Hook: Detects idle timeout and locks the screen.
 * Listens for mouse, keyboard, and touch events.
 * Timer resets on any user activity.
 */
export function useIdleLock() {
  const lock = useSessionStore((s) => s.lock);
  const session = useSessionStore((s) => s.session);
  const isLocked = useSessionStore((s) => s.isLocked);
  const timerRef = useRef(null);

  const getTimeout = useCallback(() => {
    const minutes = parseInt(useSettingsStore.getState().settings.auto_lock_minutes || '5', 10);
    return minutes * 60 * 1000;
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!session || isLocked) return;

    timerRef.current = setTimeout(() => {
      lock();
    }, getTimeout());
  }, [session, isLocked, lock, getTimeout]);

  useEffect(() => {
    if (!session || isLocked) return;

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];

    const handleActivity = () => resetTimer();

    events.forEach((e) => document.addEventListener(e, handleActivity, { passive: true }));
    resetTimer(); // Start initial timer

    return () => {
      events.forEach((e) => document.removeEventListener(e, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [session, isLocked, resetTimer]);
}
