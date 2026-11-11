"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FlightLogEx, Settings } from '../types';
import { getAllLogs, saveLog, saveLogs, deleteLog, migrateFromLocalStorage } from '../lib/db';

const defaultSettings: Settings = {
  anaTargetType: 'platinum_std',
};

function readInitialSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const savedSettingsStr = localStorage.getItem('sfc_settings_ex');
    if (savedSettingsStr) {
      return { ...defaultSettings, ...JSON.parse(savedSettingsStr) };
    }
    const oldTarget = localStorage.getItem('sfc_target_type');
    if (oldTarget) {
      const migrated = { ...defaultSettings, anaTargetType: oldTarget };
      localStorage.setItem('sfc_settings_ex', JSON.stringify(migrated));
      return migrated;
    }
  } catch (e) {
    console.error("Failed to read settings", e);
  }
  return defaultSettings;
}

interface FlightStore {
  logs: FlightLogEx[];
  settings: Settings;
  isLoaded: boolean;
  loadError: boolean;
}

let store: FlightStore = {
  logs: [],
  settings: defaultSettings,
  isLoaded: false,
  loadError: false,
};

let hasHydratedSettings = false;
let hasMigratedSession = false;
let activeLoadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function updateStore(partial: Partial<FlightStore>) {
  store = { ...store, ...partial };
  notifyListeners();
}

async function performLoadData(forceRefresh = false): Promise<void> {
  if (typeof window === 'undefined') return;

  if (!hasHydratedSettings || forceRefresh) {
    hasHydratedSettings = true;
    store = {
      ...store,
      settings: readInitialSettings(),
      loadError: false,
    };
  }

  if (store.isLoaded && !forceRefresh) {
    return;
  }

  if (activeLoadPromise && !forceRefresh) {
    return activeLoadPromise;
  }

  activeLoadPromise = (async () => {
    try {
      if (!hasMigratedSession) {
        await migrateFromLocalStorage();
        hasMigratedSession = true;
      }

      const dbLogs = await getAllLogs();
      const loadedSettings = readInitialSettings();
      updateStore({
        logs: dbLogs.filter((log) => log.airline === 'ANA'),
        settings: loadedSettings,
        isLoaded: true,
        loadError: false,
      });
    } catch (e) {
      console.error("Failed to load data", e);
      updateStore({
        isLoaded: true,
        loadError: true,
      });
    } finally {
      activeLoadPromise = null;
    }
  })();

  return activeLoadPromise;
}

export function FlightDataProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void performLoadData(false);
  }, []);
  return React.createElement(React.Fragment, null, children);
}

export function useFlightData() {
  const [state, setState] = useState<FlightStore>(() => {
    if (typeof window !== 'undefined' && !hasHydratedSettings) {
      hasHydratedSettings = true;
      store = {
        ...store,
        settings: readInitialSettings(),
      };
    }
    return store;
  });

  useEffect(() => {
    const onStoreChange = () => {
      setState(store);
    };
    listeners.add(onStoreChange);
    setState(store);
    if (!store.isLoaded) {
      void performLoadData(false);
    }
    return () => {
      listeners.delete(onStoreChange);
    };
  }, []);

  const addLog = useCallback(async (log: FlightLogEx) => {
    await saveLog(log);
    updateStore({
      logs: [...store.logs, log],
      isLoaded: true,
      loadError: false,
    });
  }, []);

  const addLogs = useCallback(async (newLogs: FlightLogEx[]) => {
    if (newLogs.length === 0) return;
    await saveLogs(newLogs);
    updateStore({
      logs: [...store.logs, ...newLogs],
      isLoaded: true,
      loadError: false,
    });
  }, []);

  const updateLog = useCallback(async (log: FlightLogEx) => {
    await saveLog(log);
    updateStore({
      logs: store.logs.map((l) => (l.id === log.id ? log : l)),
      isLoaded: true,
      loadError: false,
    });
  }, []);

  const removeLog = useCallback(async (id: string) => {
    await deleteLog(id);
    updateStore({
      logs: store.logs.filter((l) => l.id !== id),
      isLoaded: true,
      loadError: false,
    });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    const updated = { ...store.settings, ...newSettings };
    if (typeof window !== 'undefined') {
      localStorage.setItem('sfc_settings_ex', JSON.stringify(updated));
    }
    updateStore({ settings: updated });
  }, []);

  const refreshLogs = useCallback(async () => {
    await performLoadData(true);
  }, []);

  return {
    logs: state.logs,
    settings: state.settings,
    isLoaded: state.isLoaded,
    loadError: state.loadError,
    addLog,
    addLogs,
    updateLog,
    removeLog,
    updateSettings,
    refreshLogs,
  };
}
