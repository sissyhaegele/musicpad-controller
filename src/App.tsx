import { useState, useRef } from 'react'
import { Play, Square, Upload } from 'lucide-react'
import './App.css'

interface Pad {
  id: string
  name: string
  audioUrl: string | null
  audioFile: File | null
  isPlaying: boolean
}

function App() {
  const [pads, setPads] = useState<Pad[]>(
    Array.from({ length: 12 }, (_, i) => ({
      id: `pad-${i}`,
      name: `Pad ${i + 1}`,
      audioUrl: null,
      audioFile: null,
      isPlaying: false
    }))
  )
  
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPadId, setSelectedPadId] = useState<string | null>(null)

  const handlePadClick = (pad: Pad) => {
    if (pad.audioUrl) {
      // Play/Stop Audio
      togglePlay(pad.id)
    } else {
      // Upload Audio
      setSelectedPadId(pad.id)
      fileInputRef.current?.click()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedPadId) return
    
    const url = URL.createObjectURL(file)
    setPads(prev => prev.map(p => 
      p.id === selectedPadId 
        ? { ...p, audioUrl: url, audioFile: file, name: file.name.replace(/\.[^/.]+$/, '') }
        : p
    ))
    
    // Reset
    setSelectedPadId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const togglePlay = (padId: string) => {
    const pad = pads.find(p => p.id === padId)
    if (!pad?.audioUrl) return

    let audio = audioRefs.current.get(padId)
    
    if (pad.isPlaying) {
      // Stop
      audio?.pause()
      audio && (audio.currentTime = 0)
      setPads(prev => prev.map(p => 
        p.id === padId ? { ...p, isPlaying: false } : p
      ))
    } else {
      // Play
      if (!audio) {
        audio = new Audio(pad.audioUrl)
        audioRefs.current.set(padId, audio)
        
        audio.onended = () => {
          setPads(prev => prev.map(p => 
            p.id === padId ? { ...p, isPlaying: false } : p
          ))
        }
      }
      
      audio.play()
      setPads(prev => prev.map(p => 
        p.id === padId ? { ...p, isPlaying: true } : p
      ))
    }
  }

  return (
    <div className="app">
      <h1>Music Pad Controller 2.0</h1>
      
      <div className="pad-grid">
        {pads.map(pad => (
          <button
            key={pad.id}
            className={`pad ${pad.isPlaying ? 'playing' : ''} ${pad.audioUrl ? 'loaded' : ''}`}
            onClick={() => handlePadClick(pad)}
          >
            {!pad.audioUrl ? (
              <Upload size={24} />
            ) : pad.isPlaying ? (
              <Square size={24} />
            ) : (
              <Play size={24} />
            )}
            <span>{pad.name}</span>
          </button>
        ))}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
    </div>
  )
}

export default App
