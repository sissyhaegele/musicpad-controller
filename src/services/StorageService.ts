// StorageService.ts - IndexedDB Storage Service

class StorageService {
  private dbName = 'MusicPadDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Samples Store
        if (!db.objectStoreNames.contains('samples')) {
          const store = db.createObjectStore('samples', { keyPath: 'padId' });
          store.createIndex('label', 'label', { unique: false });
          store.createIndex('savedAt', 'savedAt', { unique: false });
        }
        
        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        
        // Banks Store
        if (!db.objectStoreNames.contains('banks')) {
          const bankStore = db.createObjectStore('banks', { keyPath: 'id', autoIncrement: true });
          bankStore.createIndex('name', 'name', { unique: false });
        }
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
    });
  }

  async saveSample(padId: string, label: string, audioData: ArrayBuffer): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples'], 'readwrite');
      const store = transaction.objectStore('samples');
      
      const request = store.put({
        padId,
        label,
        audioData,
        savedAt: new Date().toISOString(),
        size: audioData.byteLength
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadSample(padId: string): Promise<{ label: string; audioData: ArrayBuffer } | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples'], 'readonly');
      const store = transaction.objectStore('samples');
      const request = store.get(padId);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? { label: result.label, audioData: result.audioData } : null);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async loadAllSamples(): Promise<Map<string, { label: string; audioData: ArrayBuffer }>> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples'], 'readonly');
      const store = transaction.objectStore('samples');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const samples = new Map();
        request.result.forEach((item: any) => {
          samples.set(item.padId, {
            label: item.label,
            audioData: item.audioData
          });
        });
        resolve(samples);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples', 'settings', 'banks'], 'readwrite');
      
      transaction.objectStore('samples').clear();
      transaction.objectStore('settings').clear();
      transaction.objectStore('banks').clear();
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getStorageInfo(): Promise<{ count: number; totalSize: number }> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['samples'], 'readonly');
      const store = transaction.objectStore('samples');
      const request = store.getAll();
      
      request.onsuccess = () => {
        let totalSize = 0;
        const count = request.result.length;
        
        request.result.forEach((item: any) => {
          totalSize += item.size || 0;
        });
        
        resolve({ count, totalSize });
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async exportBank(): Promise<string> {
    const samples = await this.loadAllSamples();
    
    const exportData = {
      version: '2.0.0',
      exportDate: new Date().toISOString(),
      samples: Array.from(samples.entries()).map(([padId, data]) => ({
        padId,
        label: data.label,
        audioData: btoa(String.fromCharCode(...new Uint8Array(data.audioData)))
      }))
    };
    
    return JSON.stringify(exportData);
  }

  async importBank(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    if (data.version !== '2.0.0') {
      throw new Error('Incompatible bank version');
    }
    
    for (const sample of data.samples) {
      const audioData = Uint8Array.from(
        atob(sample.audioData), 
        c => c.charCodeAt(0)
      ).buffer;
      
      await this.saveSample(sample.padId, sample.label, audioData);
    }
  }
}

export default new StorageService();
