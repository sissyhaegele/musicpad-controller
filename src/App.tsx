import { useState, useRef, useEffect } from 'react';
import { Volume2, StopCircle, Music, Loader2, AlertCircle, Upload, FileAudio } from 'lucide-react';
import audioSystem from './services/audioSystem';
import './App.css';

const PAD_COLORS = [
  '#00ff88', '#00ccff', '#ff00ff', 
  '#ffaa00', '#ff0066', '#00ff00',
  '#ff3366', '#00ffcc', '#ffff00'
];

function App() {
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [globalVolume, setGlobalVolume] = useState(0.7);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverPad, setDragOverPad] = useState<number | null>(null);
  const [dragCounter, setDragCounter] = useState(0);
  const [recentlyLoaded, setRecentlyLoaded] = useState<Set<number>>(new Set());
  const [pads, setPads] = useState(() => 
    Array.from({ length: 9 }, (_, i) => ({
      id: `pad-${i}`,
      label: `Pad ${i + 1}`,
      audioBuffer: null as AudioBuffer | null,
      isPlaying: false,
      isLoading: false,
      hasError: false,
      color: PAD_COLORS[i]
    }))
  );
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Initialize AudioSystem on mount
  useEffect(() => {
    const init = async () => {
      const success = await audioSystem.initialize();
      setAudioInitialized(success);
      if (success) {
        audioSystem.setMasterVolume(globalVolume);
      }
    };
    init();

    return () => {
      audioSystem.dispose();
    };
  }, []);

  // Update master volume
  useEffect(() => {
    if (audioInitialized) {
      audioSystem.setMasterVolume(globalVolume);
    }
  }, [globalVolume, audioInitialized]);

  // Clear recently loaded indicator after animation
  useEffect(() => {
    if (recentlyLoaded.size > 0) {
      const timer = setTimeout(() => {
        setRecentlyLoaded(new Set());
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [recentlyLoaded]);

  // Initialize audio on user interaction
  const initAudio = async () => {
    const success = await audioSystem.initialize();
    setAudioInitialized(success);
    if (success) {
      audioSystem.setMasterVolume(globalVolume);
    }
  };

  // Load audio file for a pad
  const loadAudioFile = async (padIndex: number, file: File) => {
    console.log(`Loading ${file.name} for pad ${padIndex + 1}`);
    
    if (!audioInitialized) {
      await initAudio();
    }

    setPads(prev => prev.map((p, i) => 
      i === padIndex ? { ...p, isLoading: true, hasError: false } : p
    ));

    try {
      const audioBuffer = await audioSystem.loadAudioFile(file);
      
      if (audioBuffer) {
        setPads(prev => prev.map((p, i) => 
          i === padIndex 
            ? { 
                ...p, 
                audioBuffer,
                label: file.name.replace(/\.[^/.]+$/, ''),
                isLoading: false,
                hasError: false 
              } 
            : p
        ));
        
        // Mark as recently loaded for animation
        setRecentlyLoaded(prev => new Set([...prev, padIndex]));
        
        console.log(`Successfully loaded ${file.name} to pad ${padIndex + 1}`);
      } else {
        throw new Error('Failed to decode audio');
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      
      setPads(prev => prev.map((p, i) => 
        i === padIndex ? { ...p, isLoading: false, hasError: true } : p
      ));
      
      setTimeout(() => {
        setPads(prev => prev.map((p, i) => 
          i === padIndex ? { ...p, hasError: false } : p
        ));
      }, 3000);
    }
  };

  // Load multiple files - CORRECTED VERSION
  const loadMultipleFiles = async (files: File[]) => {
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    
    if (audioFiles.length === 0) {
      console.log('No audio files found in drop');
      return;
    }

    console.log(`Loading ${audioFiles.length} audio files`);

    // Get indices of free pads
    const freePadIndices = pads
      .map((pad, index) => !pad.audioBuffer ? index : -1)
      .filter(index => index !== -1);

    console.log(`Found ${freePadIndices.length} free pads:`, freePadIndices);

    // Load files to free pads
    const filesToLoad = Math.min(audioFiles.length, freePadIndices.length);
    
    for (let i = 0; i < filesToLoad; i++) {
      const padIndex = freePadIndices[i];
      const file = audioFiles[i];
      
      console.log(`Loading ${file.name} to pad ${padIndex + 1}`);
      loadAudioFile(padIndex, file);
      
      // Small delay between loads for visual feedback
      if (i < filesToLoad - 1) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

    if (audioFiles.length > freePadIndices.length) {
      console.log(`No space for ${audioFiles.length - freePadIndices.length} files`);
      alert(`Loaded ${filesToLoad} files. ${audioFiles.length - freePadIndices.length} files skipped (no free pads).`);
    }
  };

  // Play or stop a pad
  const togglePad = (padIndex: number) => {
    const pad = pads[padIndex];
    const padId = pad.id;
    
    if (pad.isPlaying) {
      const stopped = audioSystem.stop(padId);
      if (stopped) {
        setPads(prev => prev.map((p, i) => 
          i === padIndex ? { ...p, isPlaying: false } : p
        ));
      }
      return;
    }
    
    if (pad.audioBuffer) {
      const playing = audioSystem.play(padId, pad.audioBuffer, 1);
      if (playing) {
        setPads(prev => prev.map((p, i) => 
          i === padIndex ? { ...p, isPlaying: true } : p
        ));
        
        setTimeout(() => {
          if (!audioSystem.isPlaying(padId)) {
            setPads(prev => prev.map((p, i) => 
              i === padIndex ? { ...p, isPlaying: false } : p
            ));
          }
        }, pad.audioBuffer.duration * 1000);
      }
    } else {
      fileInputRefs.current[padId]?.click();
    }
  };

  // Stop all playing pads
  const stopAll = () => {
    audioSystem.stopAll();
    setPads(prev => prev.map(p => ({ ...p, isPlaying: false })));
  };

  // Clear all pads
  const clearAll = () => {
    if (confirm('Clear all loaded samples?')) {
      stopAll();
      setPads(prev => prev.map((p, i) => ({
        ...p,
        audioBuffer: null,
        label: `Pad ${i + 1}`,
        isPlaying: false,
        hasError: false
      })));
      console.log('All pads cleared');
    }
  };

  // Global drag handlers
  const handleGlobalDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasAudioFiles = Array.from(e.dataTransfer.items).some(
        item => item.type.startsWith('audio/')
      );
      if (hasAudioFiles || e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
      }
    }
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragging(false);
        setDragOverPad(null);
      }
      return newCounter;
    });
  };

  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    setDragOverPad(null);
    setDragCounter(0);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      loadMultipleFiles(files);
    }
  };

  // Pad-specific drag handlers
  const handlePadDragEnter = (e: React.DragEvent, padIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverPad(padIndex);
  };

  const handlePadDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePadDrop = (e: React.DragEvent, padIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(false);
    setDragOverPad(null);
    setDragCounter(0);
    
    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));
    
    if (audioFiles.length === 1) {
      // Single file - load to this specific pad
      loadAudioFile(padIndex, audioFiles[0]);
    } else if (audioFiles.length > 1) {
      // Multiple files - load starting from this pad
      const availablePads = pads.slice(padIndex).filter(p => !p.audioBuffer);
      const indicesToUse = availablePads.slice(0, audioFiles.length).map((_, i) => padIndex + i);
      
      audioFiles.slice(0, indicesToUse.length).forEach((file, i) => {
        loadAudioFile(padIndex + i, file);
      });
      
      if (audioFiles.length > indicesToUse.length) {
        console.log(`Loaded ${indicesToUse.length} files starting from pad ${padIndex + 1}`);
      }
    }
  };

  // Multi-file input handler
  const handleMultiFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        loadMultipleFiles(files);
      }
    };
    input.click();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.repeat) return;
      
      const key = e.key.toLowerCase();
      if (key >= '1' && key <= '9') {
        const padIndex = parseInt(key) - 1;
        togglePad(padIndex);
      } else if (key === ' ') {
        e.preventDefault();
        stopAll();
      } else if (key === 'l' && e.ctrlKey) {
        e.preventDefault();
        handleMultiFileSelect();
      } else if (key === 'c' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        clearAll();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pads]);

  const systemStatus = audioSystem.getStatus();
  const loadedPads = pads.filter(p => p.audioBuffer).length;
  const freePads = 9 - loadedPads;

  return (
    <div 
      className="app"
      onDragEnter={handleGlobalDragEnter}
      onDragLeave={handleGlobalDragLeave}
      onDragOver={handleGlobalDragOver}
      onDrop={handleGlobalDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="drag-overlay">
          <div className="drag-message">
            <Upload size={48} />
            <h2>Drop Audio Files</h2>
            <p>Drop on a specific pad or anywhere to auto-assign</p>
            <p className="free-pads-info">{freePads} free pad{freePads !== 1 ? 's' : ''} available</p>
          </div>
        </div>
      )}

      <header className="header">
        <div className="header-content">
          <h1 className="title">
            <Music size={32} />
            Music Pad Controller
          </h1>
          
          {!audioInitialized && (
            <button onClick={initAudio} className="unlock-button">
              🔊 Click to Enable Audio
            </button>
          )}
          
          <div className="controls">
            <button 
              onClick={handleMultiFileSelect}
              className="load-multiple-btn"
              title="Load multiple files (Ctrl+L)"
            >
              <FileAudio size={20} />
              Load Multiple
            </button>

            <div className="volume-control">
              <Volume2 size={20} />
              <input
                type="range"
                min="0"
                max="100"
                value={globalVolume * 100}
                onChange={(e) => setGlobalVolume(parseInt(e.target.value) / 100)}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(globalVolume * 100)}%</span>
            </div>
            
            <button onClick={stopAll} className="stop-all-button">
              <StopCircle size={20} />
              Stop All
            </button>
          </div>
          
          <div className="status-display">
            {systemStatus.state} | {systemStatus.playing} playing | {loadedPads}/9 loaded
          </div>
        </div>
      </header>

      <main className="main">
        <div className="pads-grid" ref={dropZoneRef}>
          {pads.map((pad, index) => (
            <div 
              key={pad.id} 
              className={`pad-wrapper ${dragOverPad === index ? 'drag-over' : ''} ${recentlyLoaded.has(index) ? 'just-loaded' : ''}`}
              onDragEnter={(e) => handlePadDragEnter(e, index)}
              onDragLeave={handlePadDragLeave}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handlePadDrop(e, index)}
            >
              <button
                className={`pad ${pad.isPlaying ? 'playing' : ''} ${pad.audioBuffer ? 'loaded' : ''} ${pad.hasError ? 'error' : ''}`}
                onClick={() => togglePad(index)}
                disabled={pad.isLoading}
                style={{ 
                  '--pad-color': pad.color,
                  '--pad-rgb': pad.color.match(/\w\w/g)?.map((x: string) => parseInt(x, 16)).join(', ') || '255, 255, 255'
                } as React.CSSProperties}
              >
                <div className="pad-number">{index + 1}</div>
                
                {pad.isLoading && (
                  <Loader2 className="pad-icon spinning" size={24} />
                )}
                
                {pad.hasError && (
                  <AlertCircle className="pad-icon error" size={24} />
                )}
                
                {!pad.isLoading && !pad.hasError && pad.audioBuffer && (
                  <Volume2 className="pad-icon" size={24} />
                )}
                
                {!pad.audioBuffer && !pad.isLoading && dragOverPad === index && (
                  <Upload className="pad-icon drop-hint" size={24} />
                )}
                
                <div className="pad-label">{pad.label}</div>
              </button>

              <input
                ref={el => fileInputRefs.current[pad.id] = el}
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    loadAudioFile(index, file);
                  }
                }}
                style={{ display: 'none' }}
              />
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="info">
            <span>🎵 Drag & Drop multiple files</span>
            <span>•</span>
            <span>⌨️ 1-9 to play</span>
            <span>•</span>
            <span>Space to stop</span>
            <span>•</span>
            <span>Ctrl+L load multiple</span>
            <span>•</span>
            <span>Ctrl+Shift+C clear all</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
