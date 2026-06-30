'use client';

import { useState, useEffect, useRef } from 'react';

export function useNetworkStatus() {
  // Always start with true to avoid SSR/client hydration mismatch
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    // Sync with real browser state after mount
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        setIsSyncing(true);
        const t = setTimeout(() => setIsSyncing(false), 2500);
        return () => clearTimeout(t);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline, isSyncing };
}
