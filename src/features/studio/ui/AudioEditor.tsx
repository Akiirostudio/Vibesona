"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface AudioTrack {
  id: string;
  name: string;
  file: File;
  url: string;
  duration: number;
  waveformData: number[];
  color: string;
  volume: number;
  muted: boolean;
  leftChannel: boolean;
  rightChannel: boolean;
}

interface AudioClip {
  id: string;
  trackId: string;
  startTime: number;
  endTime: number;
  name: string;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

export function AudioEditor() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [clips, setClips] = useState<AudioClip[]>([]);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isMastering, setIsMastering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedClip, setCopiedClip] = useState<AudioClip | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const trackColors = [
    'rgba(99, 102, 241, 0.8)',   // Indigo
    'rgba(59, 130, 246, 0.8)',   // Blue
    'rgba(16, 185, 129, 0.8)',   // Emerald
    'rgba(245, 158, 11, 0.8)',   // Amber
    'rgba(239, 68, 68, 0.8)',    // Red
    'rgba(168, 85, 247, 0.8)',   // Violet
    'rgba(6, 182, 212, 0.8)',    // Cyan
    'rgba(251, 146, 60, 0.8)',   // Orange
  ];

  const totalDuration = Math.max(...tracks.map(track => track.duration), 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const generateWaveform = async (file: File): Promise<number[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const samples = 5000;
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        const start = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[start + j]);
        }
        waveform.push(sum / blockSize);
      }
      
      return waveform;
    } catch (error) {
      console.error('Error generating waveform:', error);
      const fallback: number[] = [];
      for (let i = 0; i < 5000; i++) {
        fallback.push(Math.sin(i * 0.1) * 0.3 + 0.3);
      }
      return fallback;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Please select an audio file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = URL.createObjectURL(file);
      const waveformData = await generateWaveform(file);
      
      const newTrack: AudioTrack = {
        id: Date.now().toString(),
        name: file.name.replace(/\.[^/.]+$/, ""),
        file,
        url,
        duration: 0,
        waveformData,
        color: trackColors[tracks.length % trackColors.length],
        volume: 1,
        muted: false,
        leftChannel: true,
        rightChannel: true
      };

      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        newTrack.duration = audio.duration;
        setTracks(prev => [...prev, newTrack]);
        
        const newClip: AudioClip = {
          id: Date.now().toString(),
          trackId: newTrack.id,
          startTime: 0,
          endTime: audio.duration,
          name: newTrack.name,
          volume: 1,
          fadeIn: 0,
          fadeOut: 0
        };
        setClips(prev => [...prev, newClip]);
        
        if (tracks.length === 0 && audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.load();
        }
        
        setIsLoading(false);
      });
    } catch (error) {
      setError('Error loading audio file');
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    if (audioRef.current && tracks.length > 0) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleRecord = () => {
    console.log('Record pressed');
  };

  const handleLoop = () => {
    if (audioRef.current) {
      audioRef.current.loop = !audioRef.current.loop;
    }
  };

  const handleSkipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 5);
    }
  };

  const handleNewFile = () => {
    setTracks([]);
    setClips([]);
    setSelectedClip(null);
    setSelectionStart(null);
    setSelectionEnd(null);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  const handleClear = () => {
    setTracks([]);
    setClips([]);
    setSelectedClip(null);
    setSelectionStart(null);
    setSelectionEnd(null);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!totalDuration) return;
    
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const percent = x / rect.width;
    const newTime = percent * totalDuration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    
    if (selectionStart === null) {
      setSelectionStart(newTime);
      setSelectionEnd(newTime);
    } else {
      setSelectionEnd(newTime);
    }
  };

  const handleCanvasDrag = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !totalDuration) return;
    
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * totalDuration;
    
    setSelectionEnd(newTime);
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleCanvasClick(event);
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      handleCanvasDrag(event);
    }
  };

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleSplit = () => {
    if (!selectedClip || tracks.length === 0) {
      setError('Please select a clip first');
      return;
    }

    const clip = clips.find(c => c.id === selectedClip);
    if (!clip) return;

    const splitTime = currentTime;
    if (splitTime > clip.startTime && splitTime < clip.endTime) {
      const newClip: AudioClip = {
        id: Date.now().toString(),
        trackId: clip.trackId,
        startTime: splitTime,
        endTime: clip.endTime,
        name: `${clip.name} (Part 2)`,
        volume: clip.volume,
        fadeIn: 0,
        fadeOut: clip.fadeOut
      };

      setClips(prev => prev.map(c => 
        c.id === selectedClip 
          ? { ...c, endTime: splitTime, name: `${c.name} (Part 1)`, fadeOut: 0 }
          : c
      ));

      setClips(prev => [...prev, newClip]);
    }
  };

  const handleTrim = () => {
    if (!selectedClip || tracks.length === 0) {
      setError('Please select a clip first');
      return;
    }

    setClips(prev => prev.map(c => 
      c.id === selectedClip 
        ? { ...c, endTime: currentTime }
        : c
    ));
  };

  const handleCopy = () => {
    if (!selectedClip) {
      setError('Please select a clip first');
      return;
    }

    const clip = clips.find(c => c.id === selectedClip);
    if (clip) {
      setCopiedClip(clip);
    }
  };

  const handlePaste = () => {
    if (!copiedClip) {
      setError('No clip copied');
      return;
    }

    const newClip: AudioClip = {
      id: Date.now().toString(),
      trackId: copiedClip.trackId,
      startTime: currentTime,
      endTime: currentTime + (copiedClip.endTime - copiedClip.startTime),
      name: `${copiedClip.name} (Copy)`,
      volume: copiedClip.volume,
      fadeIn: copiedClip.fadeIn,
      fadeOut: copiedClip.fadeOut
    };

    setClips(prev => [...prev, newClip]);
  };

  const handleDelete = () => {
    if (!selectedClip) {
      setError('Please select a clip first');
      return;
    }

    setClips(prev => prev.filter(clip => clip.id !== selectedClip));
    setSelectedClip(null);
  };

  const handleFadeIn = () => {
    if (!selectedClip) {
      setError('Please select a clip first');
      return;
    }

    setClips(prev => prev.map(c => 
      c.id === selectedClip 
        ? { ...c, fadeIn: 0.5 }
        : c
    ));
  };

  const handleFadeOut = () => {
    if (!selectedClip) {
      setError('Please select a clip first');
      return;
    }

    setClips(prev => prev.map(c => 
      c.id === selectedClip 
        ? { ...c, fadeOut: 0.5 }
        : c
    ));
  };

  const handleDuplicate = () => {
    if (!selectedClip) {
      setError('Please select a clip first');
      return;
    }

    const clip = clips.find(c => c.id === selectedClip);
    if (!clip) return;

    const newClip: AudioClip = {
      id: Date.now().toString(),
      trackId: clip.trackId,
      startTime: clip.endTime + 0.1,
      endTime: clip.endTime + 0.1 + (clip.endTime - clip.startTime),
      name: `${clip.name} (Duplicate)`,
      volume: clip.volume,
      fadeIn: clip.fadeIn,
      fadeOut: clip.fadeOut
    };

    setClips(prev => [...prev, newClip]);
  };

  const handleQuickMaster = async () => {
    if (tracks.length === 0) {
      setError('Please add audio tracks first');
      return;
    }

    setIsMastering(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', tracks[0].file);

      const response = await fetch('/api/master/quick', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Mastering failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mastered_audio.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      setError('Mastering failed: ' + (error as Error).message);
    } finally {
      setIsMastering(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`;
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(20, 20, 20, 1)');
    gradient.addColorStop(1, 'rgba(10, 10, 10, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    tracks.forEach((track, trackIndex) => {
      const trackHeight = 100;
      const trackY = trackIndex * trackHeight;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(0, trackY, canvas.width, trackHeight);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, trackY, canvas.width, trackHeight);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 12px system-ui';
      ctx.fillText(track.name, 10, trackY + 20);

      ctx.fillStyle = track.leftChannel ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
      ctx.fillText('L', canvas.width - 60, trackY + 20);
      ctx.fillStyle = track.rightChannel ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
      ctx.fillText('R', canvas.width - 40, trackY + 20);

      if (track.waveformData && track.waveformData.length > 0) {
        const waveformHeight = 60;
        const waveformY = trackY + 30;
        const step = canvas.width / track.waveformData.length;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(0, waveformY, canvas.width, waveformHeight);
        
        ctx.strokeStyle = track.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        track.waveformData.forEach((sample, index) => {
          const x = index * step;
          const y = waveformY + (waveformHeight / 2) + (sample * waveformHeight / 2);
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
      }

      const trackClips = clips.filter(clip => clip.trackId === track.id);
      trackClips.forEach(clip => {
        const clipX = (clip.startTime / totalDuration) * canvas.width * zoom;
        const clipWidth = ((clip.endTime - clip.startTime) / totalDuration) * canvas.width * zoom;
        
        const isSelected = selectedClip === clip.id;
        ctx.fillStyle = isSelected 
          ? 'rgba(255, 255, 255, 0.2)' 
          : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(clipX, trackY + 30, clipWidth, 60);
        
        ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(clipX, trackY + 30, clipWidth, 60);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '10px system-ui';
        ctx.fillText(clip.name, clipX + 5, trackY + 50);
        
        if (clip.fadeIn > 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(clipX, trackY + 30, 10, 60);
        }
        if (clip.fadeOut > 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(clipX + clipWidth - 10, trackY + 30, 10, 60);
        }
      });
    });

    if (selectionStart !== null && selectionEnd !== null) {
      const startX = (selectionStart / totalDuration) * canvas.width * zoom;
      const endX = (selectionEnd / totalDuration) * canvas.width * zoom;
      const selectionWidth = endX - startX;
      
      ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
      ctx.fillRect(startX, 0, selectionWidth, canvas.height);
      
      ctx.strokeStyle = 'rgba(0, 123, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, 0, selectionWidth, canvas.height);
    }

    if (totalDuration > 0) {
      const playheadX = (currentTime / totalDuration) * canvas.width * zoom;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvas.height);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(playheadX, 15, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  useEffect(() => {
    drawWaveform();
  }, [currentTime, tracks, clips, selectedClip, zoom, totalDuration, selectionStart, selectionEnd]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Menu Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center space-x-6 text-sm">
          <button className="hover:text-blue-400">File</button>
          <button className="hover:text-blue-400">Edit</button>
          <button className="hover:text-blue-400">Effects</button>
          <button className="hover:text-blue-400">View</button>
          <button className="hover:text-blue-400">Help</button>
        </div>
      </div>

      {/* Main Control Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Time Displays */}
          <div className="flex items-center space-x-4">
            <div className="bg-black px-3 py-1 rounded">
              <span className="font-mono text-sm">{formatTime(currentTime)}</span>
            </div>
            <div className="bg-black px-3 py-1 rounded">
              <span className="font-mono text-sm">{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleStop}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
            >
              ⏹
            </Button>
            <Button 
              onClick={handlePlay} 
              disabled={isPlaying || tracks.length === 0}
              className="bg-blue-600 hover:bg-blue-500 p-2 rounded disabled:opacity-50"
            >
              ▶
            </Button>
            <Button 
              onClick={handlePause} 
              disabled={!isPlaying}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded disabled:opacity-50"
            >
              ⏸
            </Button>
            <Button 
              onClick={handleLoop}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
            >
              🔄
            </Button>
            <Button 
              onClick={handleSkipBackward}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
            >
              ⏪⏪
            </Button>
            <Button 
              onClick={handleSkipForward}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
            >
              ⏩⏩
            </Button>
            <Button 
              onClick={handleRecord}
              className="bg-red-600 hover:bg-red-500 p-2 rounded"
            >
              🔴
            </Button>
          </div>

          {/* File Management */}
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleNewFile}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
              title="New File"
            >
              📄
            </Button>
            <div className="relative">
              <Input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button 
                onClick={() => document.getElementById('file-upload')?.click()}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
                title="Open File"
              >
                📂
              </Button>
            </div>
            <Button 
              onClick={handleQuickMaster}
              disabled={tracks.length === 0 || isMastering}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded disabled:opacity-50"
              title="Save/Export"
            >
              💾
            </Button>
            <Button 
              onClick={handleClear}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
              title="Clear"
            >
              ❌
            </Button>
            <Button 
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded"
              title="Selection"
            >
              S
            </Button>
          </div>

          {/* Selection Info */}
          <div className="flex items-center space-x-4 text-sm">
            <span>Selection:</span>
            <div className="flex items-center space-x-2">
              <span>Start:</span>
              <span className="bg-black px-2 py-1 rounded">
                {selectionStart !== null ? formatTime(selectionStart) : '-'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>End:</span>
              <span className="bg-black px-2 py-1 rounded">
                {selectionEnd !== null ? formatTime(selectionEnd) : '-'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Duration:</span>
              <span className="bg-black px-2 py-1 rounded">
                {selectionStart !== null && selectionEnd !== null 
                  ? formatTime(Math.abs(selectionEnd - selectionStart)) 
                  : '-'}
              </span>
            </div>
            <Button 
              onClick={clearSelection}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
            >
              clear selection
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 px-4 py-2">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Waveform Editor */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={1200}
          height={tracks.length * 100 + 100}
          className="w-full cursor-pointer"
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onMouseMove={handleCanvasMouseMove}
        />
        
        {/* Channel Controls */}
        <div className="absolute left-2 top-2 space-y-2">
          <div className="text-xs font-bold">L ON</div>
          <div className="text-xs font-bold">R ON</div>
          <div className="space-y-1">
            <Button className="bg-gray-700 hover:bg-gray-600 w-6 h-6 text-xs">1+</Button>
            <Button className="bg-gray-700 hover:bg-gray-600 w-6 h-6 text-xs">1-</Button>
            <Button className="bg-gray-700 hover:bg-gray-600 w-6 h-6 text-xs">[R]</Button>
          </div>
        </div>

        {/* Drag & Drop Message */}
        {tracks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white/60 text-lg mb-4">
                Drag n drop an Audio File in this window, or click
              </p>
              <Button 
                onClick={() => document.getElementById('file-upload')?.click()}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded border border-gray-600"
              >
                here to use a sample
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Scale */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>-Inf</span>
          <span>-70</span>
          <span>-60</span>
          <span>-50</span>
          <span>-40</span>
          <span>-30</span>
          <span>-20</span>
          <span>-10</span>
          <span>0</span>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}
