'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 Minutes (180,000 ms)

export function AutoLogoutListener() {
  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const performAutoLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore network errors on logout
    }
    toast.error(
      '🔒 Sesi Berakhir: Anda telah otomatis ter-logout dari aplikasi karena tidak ada aktivitas selama 3 menit.',
      { duration: 6000 }
    );
    router.push('/login?reason=inactivity');
    router.refresh();
  };

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(performAutoLogout, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // List of user activity events
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    // Throttle listener to avoid high CPU usage
    let lastReset = Date.now();
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastReset > 1000) {
        // Reset timer at most once per second
        lastReset = now;
        resetTimer();
      }
    };

    // Initialize timer
    resetTimer();

    // Attach event listeners
    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Cleanup listeners on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, []);

  return null;
}
