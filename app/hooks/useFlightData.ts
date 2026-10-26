import { useState, useEffect, useCallback } from 'react';
import { FlightLogEx, Settings } from '../types';
import { getAllLogs, saveLog, saveLogs, deleteLog, migrateFromLocalStorage } from '../lib/db';

const defaultSettings: Settings = {
  anaTargetType: 'platinum_std',
};

// Presentation cache: the last successfully loaded snapshot, shared across
// mounts so that tab switches render immediately instead of flashing a
// loading screen. The source of truth is still IndexedDB/localStorage and is
// re-read on every mount.
let snapshot: { logs: FlightLogEx[]; settings: Settings } | null = null;

export function useFlightData() {
  const [logs, setLogsState] = useState<FlightLogEx[]>(() => snapshot?.logs ?? []);
  const [settings, setSettingsState] = useState<Settings>(() => snapshot?.settings ?? defaultSettings);
  const [isLoaded, setIsLoaded] = useState(() => snapshot !== null);
  const [loadError, setLoadError] = useState(false);

  const setLogs = useCallback((update: FlightLogEx[] | ((prev: FlightLogEx[]) => FlightLogEx[])) => {
    setLogsState((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      snapshot = { logs: next, settings: snapshot?.settings ?? defaultSettings };
      return next;
    });
  }, []);

  const setSettings = useCallback((next: Settings) => {
    snapshot = { logs: snapshot?.logs ?? [], settings: next };
    setSettingsState(next);
  }, []);

  const loadData = useCallback(async () => {
    setLoadError(false);
    try {
      // Run migration first
      await migrateFromLocalStorage();
      
      const dbLogs = await getAllLogs();
      let loadedSettings: Settings = defaultSettings;
      const savedSettingsStr = localStorage.getItem('sfc_settings_ex');
      if (savedSettingsStr) {
        loadedSettings = JSON.parse(savedSettingsStr);
      } else {
        // Migrate old settings if they exist
        const oldTarget = localStorage.getItem('sfc_target_type');
        if (oldTarget) {
          loadedSettings = { ...defaultSettings, anaTargetType: oldTarget };
          localStorage.setItem('sfc_settings_ex', JSON.stringify(loadedSettings));
        }
      }
      setSettings(loadedSettings);
      setLogs(dbLogs.filter((log) => log.airline === 'ANA'));
    } catch (e) {
      console.error("Failed to load data", e);
      setLoadError(true);
    } finally {
      setIsLoaded(true);
    }
  }, [setLogs, setSettings]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addLog = async (log: FlightLogEx) => {
    await saveLog(log);
    setLogs(prev => [...prev, log]);
  };

  const addLogs = async (newLogs: FlightLogEx[]) => {
    if (newLogs.length === 0) return;
    await saveLogs(newLogs);
    setLogs(prev => [...prev, ...newLogs]);
  };

  const updateLog = async (log: FlightLogEx) => {
    await saveLog(log);
    setLogs(prev => prev.map(l => l.id === log.id ? log : l));
  };

  const removeLog = async (id: string) => {
    await deleteLog(id);
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('sfc_settings_ex', JSON.stringify(updated));
  };

  return {
    logs,
    settings,
    isLoaded,
    loadError,
    addLog,
    addLogs,
    updateLog,
    removeLog,
    updateSettings,
    refreshLogs: loadData,
  };
}

