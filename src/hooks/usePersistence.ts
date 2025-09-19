// usePersistence.ts - Custom Hook für Storage

import { useState, useEffect } from 'react';
import StorageService from '../services/StorageService';
import { Pad, Bank } from '../types';

export const usePersistence = (audioContext: AudioContext | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  // Storage initialisieren
  useEffect(() => {
    const initStorage = async () => {
      try {
        await StorageService.init();
        setStorageReady(true);
        console.log('✅ Storage initialized');
      } catch (error) {
        console.error('Storage init failed:', error);
      }
    };
    initStorage();
  }, []);

  // Sample speichern
  const saveSample = async (padId: string, label: string, file: File) => {
    if (!storageReady) return;
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      await StorageService.saveSample(padId, label, arrayBuffer);
      console.log(`✅ Saved: ${label}`);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  // Alle Samples laden
  const loadAllSamples = async (): Promise<Map<string, any>> => {
    if (!storageReady || !audioContext) {
      return new Map();
    }

    setIsLoading(true);
    try {
      const savedSamples = await StorageService.loadAllSamples();
      const decodedSamples = new Map();

      for (const [padId, sampleData] of savedSamples) {
        try {
          const audioBuffer = await audioContext.decodeAudioData(
            sampleData.audioData.slice(0)
          );
          decodedSamples.set(padId, {
            audioBuffer,
            label: sampleData.label
          });
        } catch (err) {
          console.error(`Failed to decode ${padId}:`, err);
        }
      }

      console.log(`✅ Loaded ${decodedSamples.size} samples`);
      return decodedSamples;
    } catch (error) {
      console.error('Load failed:', error);
      return new Map();
    } finally {
      setIsLoading(false);
    }
  };

  // Bank exportieren
  const exportBank = async (banks: Bank[]) => {
    try {
      const exportData = await StorageService.exportBank();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `musicpad-bank-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('✅ Bank exported');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Bank importieren
  const importBank = async (file: File) => {
    try {
      const text = await file.text();
      await StorageService.importBank(text);
      console.log('✅ Bank imported');
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  };

  // Storage löschen
  const clearStorage = async () => {
    if (!confirm('Clear all saved samples? This cannot be undone!')) {
      return false;
    }

    try {
      await StorageService.clearAll();
      console.log('✅ Storage cleared');
      return true;
    } catch (error) {
      console.error('Clear failed:', error);
      return false;
    }
  };

  return {
    isLoading,
    storageReady,
    saveSample,
    loadAllSamples,
    exportBank,
    importBank,
    clearStorage
  };
};
