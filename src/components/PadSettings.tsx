import React, { useState } from 'react';
import { X, Save, Trash2, Volume2, Download } from 'lucide-react';

interface PadSettingsProps {
  padId: string;
  padIndex: number;
  label: string;
  volume: number;
  hasAudio: boolean;
  onClose: () => void;
  onSave: (padId: string) => void;
  onLoad: (padId: string) => void;
  onClear: (padId: string) => void;
  onVolumeChange: (padId: string, volume: number) => void;
  onLabelChange: (padId: string, label: string) => void;
}

const PadSettings: React.FC<PadSettingsProps> = ({
  padId,
  padIndex,
  label,
  volume,
  hasAudio,
  onClose,
  onSave,
  onLoad,
  onClear,
  onVolumeChange,
  onLabelChange
}) => {
  const [localLabel, setLocalLabel] = useState(label);
  const [localVolume, setLocalVolume] = useState(volume);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(padId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleVolumeChange = (value: number) => {
    setLocalVolume(value);
    onVolumeChange(padId, value);
  };

  const handleLabelSave = () => {
    onLabelChange(padId, localLabel);
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="pad-settings-backdrop" onClick={handleBackdropClick}>
      <div className="pad-settings-modal">
        <div className="pad-settings-header">
          <h2>Pad {padIndex + 1} Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="pad-settings-content">
          <div className="settings-section">
            <h3>Label</h3>
            <div className="label-input-group">
              <input
                type="text"
                value={localLabel}
                onChange={(e) => setLocalLabel(e.target.value)}
                onBlur={handleLabelSave}
                onKeyPress={(e) => e.key === 'Enter' && handleLabelSave()}
                className="label-input"
                placeholder="Pad Label"
              />
            </div>
          </div>

          <div className="settings-section">
            <h3>Volume</h3>
            <div className="volume-setting">
              <Volume2 size={20} />
              <input
                type="range"
                min="0"
                max="100"
                value={localVolume * 100}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value) / 100)}
                className="volume-slider"
              />
              <span className="volume-value">{Math.round(localVolume * 100)}%</span>
            </div>
          </div>

          <div className="settings-section">
            <h3>Storage</h3>
            <div className="storage-buttons">
              {hasAudio ? (
                <>
                  <button 
                    className="settings-btn save-btn"
                    onClick={handleSave}
                  >
                    <Save size={18} />
                    {saved ? 'Saved!' : 'Save to Storage'}
                  </button>
                  
                  <button 
                    className="settings-btn clear-btn"
                    onClick={() => onClear(padId)}
                  >
                    <Trash2 size={18} />
                    Clear Pad
                  </button>
                </>
              ) : (
                <button 
                  className="settings-btn load-btn"
                  onClick={() => onLoad(padId)}
                >
                  <Download size={18} />
                  Load from Storage
                </button>
              )}
            </div>
          </div>

          {hasAudio && (
            <div className="settings-section info-section">
              <p className="info-text">✓ Audio loaded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PadSettings;
