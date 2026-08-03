'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 Minutes (120,000 ms)

export function AutoLogoutListener() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const performAutoLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors
    }
    toast.error(
      '🔒 Sesi Berakhir: Anda telah otomatis ter-logout dari aplikasi karena tidak ada aktivitas selama 2 menit.',
      { duration: 7000 }
    );
    router.push('/login?reason=inactivity');
    router.refresh();
  };

  const resetTimer = () => {
    lastActivityRef.current = Date.now();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(performAutoLogout, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // List of user activity events (including touch & pointer for mobile)
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'touchmove', 'touchend', 'pointerdown', 'scroll', 'click'];

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 1000) {
        resetTimer();
      }
    };

    // Handle mobile tab switching & screen lock
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const timeElapsed = Date.now() - lastActivityRef.current;
        if (timeElapsed >= INACTIVITY_TIMEOUT) {
          performAutoLogout();
        } else {
          // Resume timer for remaining time
          const remaining = INACTIVITY_TIMEOUT - timeElapsed;
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(performAutoLogout, remaining);
        }
      }
    };

    // Initialize timer
    resetTimer();

    // Attach event listeners
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup listeners on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
