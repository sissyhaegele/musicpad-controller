// storageService.ts - Speichert Audio-Samples im Browser

class StorageService {
  private readonly DB_NAME = 'MusicPadDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'samples';
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  async init(): Promise<boolean> {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

        request.onerror = () => {
          console.error('Failed to open IndexedDB');
          reject(false);
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          console.log('IndexedDB initialized');
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
            store.createIndex('padId', 'padId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      });
    } catch (error) {
      console.error('Error initializing IndexedDB:', error);
      return false;
    }
  }

  // Save audio sample to IndexedDB
  async saveSample(padId: string, audioBuffer: AudioBuffer, label: string): Promise<boolean> {
    if (!this.db) {
      await this.init();
    }

    try {
      // Convert AudioBuffer to ArrayBuffer for storage
      const numberOfChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length;
      const sampleRate = audioBuffer.sampleRate;
      
      // Create array to store channel data
      const channels: Float32Array[] = [];
      for (let i = 0; i < numberOfChannels; i++) {
        channels.push(audioBuffer.getChannelData(i));
      }

      const sampleData = {
        id: padId,
        padId: padId,
        label: label,
        numberOfChannels,
        length,
        sampleRate,
        channels: channels.map(ch => Array.from(ch)), // Convert to regular array for storage
        timestamp: Date.now()
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(sampleData);

        request.onsuccess = () => {
          console.log(`Sample saved for pad ${padId}`);
          resolve(true);
        };

        request.onerror = () => {
          console.error('Failed to save sample');
          reject(false);
        };
      });
    } catch (error) {
      console.error('Error saving sample:', error);
      return false;
    }
  }

  // Load sample from IndexedDB
  async loadSample(padId: string, audioContext: AudioContext): Promise<{audioBuffer: AudioBuffer, label: string} | null> {
    if (!this.db) {
      await this.init();
    }

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(padId);

        request.onsuccess = async () => {
          const data = request.result;
          if (!data) {
            resolve(null);
            return;
          }

          // Reconstruct AudioBuffer from stored data
          const audioBuffer = audioContext.createBuffer(
            data.numberOfChannels,
            data.length,
            data.sampleRate
          );

          // Restore channel data
          for (let i = 0; i < data.numberOfChannels; i++) {
            const channelData = new Float32Array(data.channels[i]);
            audioBuffer.copyToChannel(channelData, i);
          }

          console.log(`Sample loaded for pad ${padId}`);
          resolve({ audioBuffer, label: data.label });
        };

        request.onerror = () => {
          console.error('Failed to load sample');
          reject(null);
        };
      });
    } catch (error) {
      console.error('Error loading sample:', error);
      return null;
    }
  }

  // Delete sample from storage
  async deleteSample(padId: string): Promise<boolean> {
    if (!this.db) {
      await this.init();
    }

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(padId);

        request.onsuccess = () => {
          console.log(`Sample deleted for pad ${padId}`);
          resolve(true);
        };

        request.onerror = () => {
          console.error('Failed to delete sample');
          reject(false);
        };
      });
    } catch (error) {
      console.error('Error deleting sample:', error);
      return false;
    }
  }

  // Load all saved samples
  async loadAllSamples(audioContext: AudioContext): Promise<Map<string, {audioBuffer: AudioBuffer, label: string}>> {
    if (!this.db) {
      await this.init();
    }

    const samples = new Map<string, {audioBuffer: AudioBuffer, label: string}>();

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onsuccess = async () => {
          const allData = request.result;
          
          for (const data of allData) {
            try {
              // Reconstruct AudioBuffer
              const audioBuffer = audioContext.createBuffer(
                data.numberOfChannels,
                data.length,
                data.sampleRate
              );

              for (let i = 0; i < data.numberOfChannels; i++) {
                const channelData = new Float32Array(data.channels[i]);
                audioBuffer.copyToChannel(channelData, i);
              }

              samples.set(data.padId, { audioBuffer, label: data.label });
            } catch (error) {
              console.error(`Failed to load sample for pad ${data.padId}:`, error);
            }
          }

          console.log(`Loaded ${samples.size} samples from storage`);
          resolve(samples);
        };

        request.onerror = () => {
          console.error('Failed to load all samples');
          reject(samples);
        };
      });
    } catch (error) {
      console.error('Error loading all samples:', error);
      return samples;
    }
  }

  // Clear all samples
  async clearAll(): Promise<boolean> {
    if (!this.db) {
      await this.init();
    }

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('All samples cleared');
          resolve(true);
        };

        request.onerror = () => {
          console.error('Failed to clear samples');
          reject(false);
        };
      });
    } catch (error) {
      console.error('Error clearing samples:', error);
      return false;
    }
  }

  // Get storage size info
  async getStorageInfo(): Promise<{used: number, count: number}> {
    if (!this.db) {
      await this.init();
    }

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const allData = request.result;
          let totalSize = 0;
          
          allData.forEach(data => {
            // Estimate size (rough calculation)
            totalSize += data.length * data.numberOfChannels * 4; // 4 bytes per float
          });

          resolve({
            used: totalSize,
            count: allData.length
          });
        };

        request.onerror = () => {
          reject({ used: 0, count: 0 });
        };
      });
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { used: 0, count: 0 };
    }
  }
}

export default new StorageService();
