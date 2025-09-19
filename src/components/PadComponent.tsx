// Pad Component - Einzelnes Musik-Pad

import React from 'react';
import { Volume2, Loader2, AlertCircle } from 'lucide-react';
import { Pad as PadType } from '../types';

interface PadProps {
  pad: PadType;
  index: number;
  onPlay: (padId: string) => void;
  onStop: (padId: string) => void;
  onLoad: (padId: string, file: File) => void;
  onUrlLoad: (padId: string, url: string) => void;
}

export const PadComponent: React.FC<PadProps> = ({
  pad,
  index,
  onPlay,
  onStop,
  onLoad,
  onUrlLoad
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [urlValue, setUrlValue] = React.useState('');

  const handleClick = () => {
    if (pad.isPlaying) {
      onStop(pad.id);
    } else if (pad.audioBuffer) {
      onPlay(pad.id);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoad(pad.id, file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlValue.trim()) {
      onUrlLoad(pad.id, urlValue.trim());
      setUrlValue('');
      setShowUrlInput(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowUrlInput(!showUrlInput);
  };

  return (
    <div
      className="pad-container"
      style={{ 
        '--pad-color': pad.color,
        '--pad-rgb': pad.color.match(/\w\w/g)?.map((x: string) => parseInt(x, 16)).join(', ') || '255, 255, 255'
      } as React.CSSProperties}
    >
      <button
        className={`pad ${pad.isPlaying ? 'playing' : ''} ${pad.audioBuffer ? 'loaded' : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        disabled={pad.isLoading}
      >
        <div className="pad-number">{index + 1}</div>
        
        {pad.isLoading && (
          <Loader2 className="pad-icon spinning" size={24} />
        )}
        
        {!pad.isLoading && pad.audioBuffer && (
          <Volume2 className="pad-icon" size={24} />
        )}
        
        {pad.lastError && (
          <AlertCircle className="pad-error" size={16} />
        )}
        
        <div className="pad-label">{pad.label}</div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="url-input-form">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="Audio URL..."
            autoFocus
          />
        </form>
      )}
    </div>
  );
};

