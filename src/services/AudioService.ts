// Audio Service - Zentrale Audio-Verwaltung

class AudioService {
  private context: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();

  async init(): Promise<void> {
    if (this.context) return;
    
    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
  }

  async unlock(): Promise<boolean> {
    if (!this.context) await this.init();
    
    if (this.context!.state === 'suspended') {
      try {
        await this.context!.resume();
        // Play silent buffer to unlock on iOS
        const buffer = this.context!.createBuffer(1, 1, 22050);
        const source = this.context!.createBufferSource();
        source.buffer = buffer;
        source.connect(this.context!.destination);
        source.start();
        return true;
      } catch (e) {
        console.error('Failed to unlock audio:', e);
        return false;
      }
    }
    return true;
  }

  async loadAudio(url: string): Promise<AudioBuffer> {
    if (!this.context) await this.init();
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context!.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      throw new Error(`Failed to load audio from ${url}: ${error}`);
    }
  }

  playPad(padId: string, buffer: AudioBuffer, volume: number = 1): void {
    if (!this.context || !this.gainNode) return;

    // Stop existing sound if playing
    this.stopPad(padId);

    const source = this.context.createBufferSource();
    const padGain = this.context.createGain();
    
    source.buffer = buffer;
    padGain.gain.value = volume;
    
    source.connect(padGain);
    padGain.connect(this.gainNode);
    
    source.start();
    this.activeSources.set(padId, source);
    
    source.onended = () => {
      this.activeSources.delete(padId);
    };
  }

  stopPad(padId: string): void {
    const source = this.activeSources.get(padId);
    if (source) {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
      this.activeSources.delete(padId);
    }
  }

  stopAll(): void {
    this.activeSources.forEach((_source, padId) => {
      this.stopPad(padId);
    });
  }

  setMasterVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
  }

  isPlaying(padId: string): boolean {
    return this.activeSources.has(padId);
  }

  get isUnlocked(): boolean {
    return this.context?.state === 'running';
  }
}

export default new AudioService();
