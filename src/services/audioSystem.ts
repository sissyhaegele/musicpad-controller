// audioSystem.ts - Gekapselte, sichere Audio-Logik

interface AudioNode {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  startTime: number;
}

class AudioSystem {
  private context: AudioContext | null = null;
  private activeSources: Map<string, AudioNode> = new Map();
  private masterGain: GainNode | null = null;
  private isInitialized: boolean = false;

  // Sichere Initialisierung mit Fehlerbehandlung
  async initialize(): Promise<boolean> {
    if (this.isInitialized && this.context) {
      console.log('AudioSystem already initialized');
      return true;
    }

    try {
      // Erstelle AudioContext
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Erstelle Master Gain Node
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = 0.7;

      // Resume wenn suspended
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      this.isInitialized = true;
      console.log('AudioSystem initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize AudioSystem:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Sichere Audio-Datei Ladung mit Validierung
  async loadAudioFile(file: File): Promise<AudioBuffer | null> {
    if (!this.context) {
      console.error('AudioContext not initialized');
      return null;
    }

    // Validiere Dateityp
    if (!file.type.startsWith('audio/')) {
      console.error('Invalid file type:', file.type);
      return null;
    }

    // Validiere Dateigröße (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('File too large:', file.size);
      return null;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      
      // Clone ArrayBuffer für Sicherheit
      const clonedBuffer = arrayBuffer.slice(0);
      
      // Decode mit Fehlerbehandlung
      const audioBuffer = await this.context.decodeAudioData(clonedBuffer);
      
      // Validiere dekodiertes Audio
      if (audioBuffer.duration > 0 && audioBuffer.numberOfChannels > 0) {
        console.log(`Loaded: ${file.name}, Duration: ${audioBuffer.duration}s`);
        return audioBuffer;
      } else {
        console.error('Invalid audio buffer');
        return null;
      }
    } catch (error) {
      console.error('Error loading audio file:', error);
      return null;
    }
  }

  // Sichere Play-Funktion mit Fehlerbehandlung
  play(padId: string, audioBuffer: AudioBuffer, volume: number = 1): boolean {
    if (!this.context || !this.masterGain || !audioBuffer) {
      console.error('Cannot play: System not ready');
      return false;
    }

    try {
      // Stoppe vorherige Instanz wenn vorhanden
      this.stop(padId);

      // Erstelle neue Audio Nodes
      const source = this.context.createBufferSource();
      const gainNode = this.context.createGain();

      // Setze Buffer und Volume
      source.buffer = audioBuffer;
      gainNode.gain.value = Math.max(0, Math.min(1, volume));

      // Verbinde Nodes
      source.connect(gainNode);
      gainNode.connect(this.masterGain);

      // Speichere Referenz
      this.activeSources.set(padId, {
        source,
        gainNode,
        startTime: this.context.currentTime
      });

      // Cleanup wenn beendet
      source.onended = () => {
        this.activeSources.delete(padId);
        console.log(`Pad ${padId} finished playing`);
      };

      // Starte Wiedergabe
      source.start();
      console.log(`Playing pad ${padId} at volume ${volume}`);
      return true;
    } catch (error) {
      console.error(`Error playing pad ${padId}:`, error);
      return false;
    }
  }

  // Sichere Stop-Funktion
  stop(padId: string): boolean {
    const node = this.activeSources.get(padId);
    if (node) {
      try {
        node.source.stop();
        node.source.disconnect();
        node.gainNode.disconnect();
        this.activeSources.delete(padId);
        console.log(`Stopped pad ${padId}`);
        return true;
      } catch (error) {
        console.error(`Error stopping pad ${padId}:`, error);
        this.activeSources.delete(padId);
        return false;
      }
    }
    return false;
  }

  // Stoppe alle mit Fehlerbehandlung
  stopAll(): void {
    this.activeSources.forEach((node, padId) => {
      try {
        node.source.stop();
        node.source.disconnect();
        node.gainNode.disconnect();
      } catch (error) {
        console.error(`Error stopping pad ${padId}:`, error);
      }
    });
    this.activeSources.clear();
    console.log('All pads stopped');
  }

  // Setze Master Volume
  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
      console.log(`Master volume set to ${volume}`);
    }
  }

  // Check ob Pad spielt
  isPlaying(padId: string): boolean {
    return this.activeSources.has(padId);
  }

  // Cleanup und Reset
  dispose(): void {
    this.stopAll();
    
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    
    this.masterGain = null;
    this.isInitialized = false;
    console.log('AudioSystem disposed');
  }

  // Status Check
  getStatus(): { initialized: boolean; playing: number; state: string } {
    return {
      initialized: this.isInitialized,
      playing: this.activeSources.size,
      state: this.context?.state || 'uninitialized'
    };
  }
}

// Singleton Export
export default new AudioSystem();
