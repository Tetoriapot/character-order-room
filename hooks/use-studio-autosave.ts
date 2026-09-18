'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { exportStudioBackup, parseStudioBackup, WORKSPACE_KEY, type StudioWorkspace } from '@/lib/studio-backup';

export function useStudioAutosave(workspace: StudioWorkspace, enabled: boolean) {
  const latest = useRef(workspace);
  latest.current = workspace;
  const lastSaved = useRef('');
  const paused = useRef(false);
  const [status, setStatus] = useState<'saving' | 'saved' | 'error' | 'conflict'>('saving');
  const flush = useCallback(() => {
    if (!enabled || paused.current) return false;
    // Compare the data, not the export timestamp. One key makes each save atomic.
    const fingerprint = JSON.stringify(latest.current);
    if (fingerprint === lastSaved.current) { setStatus('saved'); return true; }
    try {
      // Opening an unchanged workspace must not invalidate another open tab.
      const persisted = parseStudioBackup(localStorage.getItem(WORKSPACE_KEY));
      if (persisted && JSON.stringify(persisted) === fingerprint) {
        lastSaved.current = fingerprint;
        setStatus('saved');
        return true;
      }
      localStorage.setItem(WORKSPACE_KEY, exportStudioBackup(latest.current));
      lastSaved.current = fingerprint;
      setStatus('saved');
      return true;
    } catch {
      setStatus('error');
      return false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || paused.current) return;
    setStatus('saving');
    const timer = window.setTimeout(flush, 250);
    return () => window.clearTimeout(timer);
  }, [workspace, enabled, flush]);

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    const onUnload = (event: BeforeUnloadEvent) => {
      if (enabled && !flush()) { event.preventDefault(); event.returnValue = ''; }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== WORKSPACE_KEY && event.key !== null) return;
      const incoming = parseStudioBackup(event.newValue);
      if (incoming && JSON.stringify(incoming) === JSON.stringify(latest.current)) return;
      paused.current = true;
      setStatus('conflict');
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', onUnload);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', onUnload);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [enabled, flush]);
  return { status, flush };
}
