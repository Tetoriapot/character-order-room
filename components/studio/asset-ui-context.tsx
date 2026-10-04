'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { assetUiEnglish } from '@/data/asset-ui-english';

type Preferences = {
  language: 'ja' | 'en';
  colorMode: 'system' | 'light' | 'dark';
};
const preferencesKey = 'asset-order-room:preferences:v1';
const AssetUiContext = createContext({
  language: 'ja' as 'ja' | 'en',
  dark: false,
  toggleLanguage: () => {},
  toggleColorMode: () => {},
  tr: (text: string, _en?: string) => text,
});

export function AssetUiProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>({
    language: 'ja',
    colorMode: 'system',
  });
  const [ready, setReady] = useState(false);
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const raw = JSON.parse(
          localStorage.getItem(preferencesKey) ?? 'null',
        ) as Partial<Preferences> | null;
        if (
          raw &&
          (raw.language === 'ja' || raw.language === 'en') &&
          ['system', 'light', 'dark'].includes(raw.colorMode ?? '')
        )
          setPreferences(raw as Preferences);
      } catch {
        /* Display preferences must never prevent access to a saved brief. */
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const isDark =
        preferences.colorMode === 'dark' ||
        (preferences.colorMode === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.lang = preferences.language;
      setDark(isDark);
    };
    apply();
    media.addEventListener('change', apply);
    try {
      localStorage.setItem(preferencesKey, JSON.stringify(preferences));
    } catch {
      /* This session still uses the selected display settings. */
    }
    return () => media.removeEventListener('change', apply);
  }, [preferences, ready]);
  const tr = useCallback(
    (text: string, en?: string) =>
      preferences.language === 'ja'
        ? text
        : (en ?? assetUiEnglish[text] ?? text),
    [preferences.language],
  );
  return (
    <AssetUiContext.Provider
      value={{
        language: preferences.language,
        dark,
        tr,
        toggleLanguage: () =>
          setPreferences((p) => ({
            ...p,
            language: p.language === 'ja' ? 'en' : 'ja',
          })),
        toggleColorMode: () =>
          setPreferences((p) => ({ ...p, colorMode: dark ? 'light' : 'dark' })),
      }}
    >
      {children}
    </AssetUiContext.Provider>
  );
}

export function useAssetUi() {
  return useContext(AssetUiContext);
}
