// Types für Music Pad v2

export interface Pad {
  id: string;
  label: string;
  audioUrl: string | null;
  audioBuffer: AudioBuffer | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  lastError: string | null;
  color: string;
}

export interface Bank {
  id: string;
  name: string;
  pads: Pad[];
}

export interface AudioContextState {
  context: AudioContext | null;
  isUnlocked: boolean;
}

export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
}

export interface AppSettings {
  globalVolume: number;
  currentBankId: string;
  midiEnabled: boolean;
  selectedMidiDevice: string | null;
}
