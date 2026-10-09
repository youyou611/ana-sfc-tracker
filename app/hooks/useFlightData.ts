import { useState, useEffect, useCallback } from 'react';
import { FlightLogEx, Settings, Airline } from '../types';
import { getAllLogs, saveLog, deleteLog, migrateFromLocalStorage } from '../lib/db';

const defaultSettings: Settings = {
  anaTargetType: 'platinum_std',
  jalTargetType: 'sapphire',
  activeMode: 'ANA',
};

export function useFlightData() {
  const [logs, setLogs] = useState<FlightLogEx[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      // Run migration first
      await migrateFromLocalStorage();
      
      const dbLogs = await getAllLogs();
      setLogs(dbLogs);

      const savedSettingsStr = localStorage.getItem('sfc_settings_ex');
      if (savedSettingsStr) {
        setSettings(JSON.parse(savedSettingsStr));
      } else {
        // Migrate old settings if they exist
        const oldTarget = localStorage.getItem('sfc_target_type');
        if (oldTarget) {
          const newSettings = { ...defaultSettings, anaTargetType: oldTarget };
          setSettings(newSettings);
          localStorage.setItem('sfc_settings_ex', JSON.stringify(newSettings));
        }
      }
    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addLog = async (log: FlightLogEx) => {
    await saveLog(log);
    setLogs(prev => [...prev, log]);
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
    addLog,
    updateLog,
    removeLog,
    updateSettings,
    refreshLogs: loadData,
  };
}
