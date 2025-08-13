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
  soloed: boolean;
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
  originalTrackId?: string; // For tracking where clip came from
}

export function AudioEditor() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
  const audioSourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
  const gainNodesRef = useRef<Map<string, GainNode>>(new Map());
  
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
  const [dragClip, setDragClip] = useState<{ clip: AudioClip; offsetX: number; offsetY: number } | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [resizeClip, setResizeClip] = useState<{ clip: AudioClip; edge: 'start' | 'end'; startX: number } | null>(null);
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0); // For double-click detection
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null); // For dropdown menus
  const [audioBufferMap, setAudioBufferMap] = useState<Map<string, { buffer: AudioBuffer; originalTrackId: string; startSample: number; endSample: number }>>(new Map()); // Track audio buffer relationships

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

  // Initialize audio context
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  // Audio playback management
  const playAudio = () => {
    if (!audioContextRef.current || !isPlaying) return;
    
    // Stop all current sources
    audioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source might already be stopped
      }
    });
    audioSourcesRef.current.clear();
    gainNodesRef.current.clear();
    
    // Create new sources for each clip
    clips.forEach(clip => {
      const track = tracks.find(t => t.id === clip.trackId);
      if (!track || track.muted) return;
      
      const audioBuffer = audioBuffersRef.current.get(track.id);
      if (!audioBuffer) return;
      
      // Only play if clip is in current time range
      if (currentTime < clip.endTime && currentTime + 10 > clip.startTime) {
        const source = audioContextRef.current!.createBufferSource();
        const gainNode = audioContextRef.current!.createGain();
        
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current!.destination);
        
        // Set volume
        gainNode.gain.value = track.volume * clip.volume;
        
        // Get buffer info to understand the relationship to original audio
        const bufferInfo = audioBufferMap.get(track.id);
        
        if (bufferInfo) {
          // Calculate the actual time position in the original audio
          const originalStartTime = bufferInfo.startSample / bufferInfo.buffer.sampleRate;
          const clipStartInOriginal = originalStartTime + clip.startTime;
          const currentTimeInOriginal = clipStartInOriginal + (currentTime - clip.startTime);
          
          // Calculate buffer start time relative to this clip's buffer
          const bufferStartTime = Math.max(0, currentTime - clip.startTime);
          const bufferEndTime = Math.min(audioBuffer.duration, clip.endTime - clip.startTime);
          const duration = bufferEndTime - bufferStartTime;
          
          // Only play if we have valid duration
          if (duration > 0) {
            source.start(0, bufferStartTime, duration);
            audioSourcesRef.current.set(clip.id, source);
            gainNodesRef.current.set(clip.id, gainNode);
          }
        } else {
          // Fallback for clips without buffer info (original clips)
          const bufferStartTime = Math.max(0, currentTime - clip.startTime);
          const bufferEndTime = Math.min(audioBuffer.duration, clip.endTime - clip.startTime);
          const duration = bufferEndTime - bufferStartTime;
          
          // Only play if we have valid duration
          if (duration > 0) {
            source.start(0, bufferStartTime, duration);
            audioSourcesRef.current.set(clip.id, source);
            gainNodesRef.current.set(clip.id, gainNode);
          }
        }
      }
    });
  };

  // Update audio when clips change
  useEffect(() => {
    if (isPlaying && audioContextRef.current) {
      // Debounce audio updates to prevent excessive restarts
      const timeoutId = setTimeout(() => {
        playAudio();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [clips, tracks, isPlaying]);
  
  // Separate effect for current time updates to avoid audio restarts
  useEffect(() => {
    if (isPlaying && audioContextRef.current) {
      // Only restart audio if we've moved significantly
      const timeoutId = setTimeout(() => {
        playAudio();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentTime]);

  // Timer for updating current time
  useEffect(() => {
    if (!isPlaying) return;
    
    let startTime = Date.now() - (currentTime * 1000);
    
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const newTime = Math.min(elapsed, totalDuration);
      
      if (newTime >= totalDuration) {
        setIsPlaying(false);
        setCurrentTime(0);
        return;
      }
      
      setCurrentTime(newTime);
    }, 50); // More frequent updates for smoother playback
    
    return () => clearInterval(interval);
  }, [isPlaying, totalDuration, currentTime]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (activeDropdown && !target.closest('.dropdown-menu') && !target.closest('.dropdown-trigger')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

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
      
      // Load audio buffer with proper error handling
      const arrayBuffer = await file.arrayBuffer();
      if (!audioContextRef.current) {
        throw new Error('Audio context not initialized');
      }
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const trackId = Date.now().toString();
      audioBuffersRef.current.set(trackId, audioBuffer);
      
      // Track the original audio buffer relationship
      setAudioBufferMap(prev => {
        const newMap = new Map(prev);
        newMap.set(trackId, {
          buffer: audioBuffer,
          originalTrackId: trackId,
          startSample: 0,
          endSample: audioBuffer.length
        });
        return newMap;
      });
      
      // Ensure audio context is running
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const newTrack: AudioTrack = {
        id: trackId,
        name: file.name.replace(/\.[^/.]+$/, ""),
        file,
        url,
        duration: audioBuffer.duration,
        waveformData,
        color: trackColors[tracks.length % trackColors.length],
        volume: 1,
        muted: false,
        soloed: false,
        leftChannel: true,
        rightChannel: true
      };

      setTracks(prev => [...prev, newTrack]);
      
      const newClip: AudioClip = {
        id: Date.now().toString(),
        trackId: newTrack.id,
        startTime: 0,
        endTime: audioBuffer.duration,
        name: newTrack.name,
        volume: 1,
        fadeIn: 0,
        fadeOut: 0,
        originalTrackId: newTrack.id
      };
      setClips(prev => [...prev, newClip]);
      
      // Update total duration
      setDuration(Math.max(duration, audioBuffer.duration));
      
      setIsLoading(false);
    } catch (error) {
      setError('Error loading audio file');
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    if (tracks.length > 0 && audioContextRef.current) {
      try {
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        setIsPlaying(true);
        // Small delay to ensure audio context is ready
        setTimeout(() => playAudio(), 50);
      } catch (error) {
        console.error('Error starting playback:', error);
        setError('Error starting playback');
      }
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    // Stop all audio sources
    audioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source might already be stopped
      }
    });
    audioSourcesRef.current.clear();
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    // Stop all audio sources
    audioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source might already be stopped
      }
    });
    audioSourcesRef.current.clear();
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
    setCurrentTime(prev => Math.max(0, prev - 5));
  };

  const handleSkipForward = () => {
    setCurrentTime(prev => Math.min(totalDuration, prev + 5));
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
    
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;
    const isDoubleClick = timeDiff < 300; // 300ms threshold for double-click
    
    setLastClickTime(currentTime);
    
    if (isDoubleClick) {
      // Double click - select clip/track
      const trackIndex = Math.floor(y / 120);
      if (trackIndex >= 0 && trackIndex < tracks.length) {
        const track = tracks[trackIndex];
        const trackY = trackIndex * 120;
        const clipY = trackY + 40;
        
        if (y >= clipY && y <= clipY + 60) {
          const clickedClip = clips.find(clip => {
            if (clip.trackId !== track.id) return false;
            const clipX = (clip.startTime / totalDuration) * canvas.width * zoom;
            const clipWidth = ((clip.endTime - clip.startTime) / totalDuration) * canvas.width * zoom;
            return x >= clipX && x <= clipX + clipWidth;
          });
          
          if (clickedClip) {
            setSelectedClip(clickedClip.id);
          } else {
            // Double-clicked on empty track area - select track
            setSelectedClip(null);
          }
        }
      }
    } else {
      // Single click - only move playhead (already done in mouseDown)
      // Only create selection if in selection mode
      if (selectionMode) {
        if (selectionStart === null) {
          setSelectionStart(newTime);
          setSelectionEnd(newTime);
        } else {
          setSelectionEnd(newTime);
        }
      }
    }
  };

  const handleCanvasDrag = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !totalDuration) return;
    
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * totalDuration;
    
    // Only update selection if in selection mode
    if (selectionMode) {
      setSelectionEnd(newTime);
    }
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!totalDuration) return;
    
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Always update playhead position on mouse down
    const percent = x / rect.width;
    const newTime = percent * totalDuration;
    setCurrentTime(newTime);
    
    // Check if clicking on a clip to start dragging (only if already selected)
    const trackIndex = Math.floor(y / 120);
    if (trackIndex >= 0 && trackIndex < tracks.length) {
      const track = tracks[trackIndex];
      const trackY = trackIndex * 120;
      const clipY = trackY + 40;
      
      if (y >= clipY && y <= clipY + 60) {
        const clickedClip = clips.find(clip => {
          if (clip.trackId !== track.id) return false;
          const clipX = (clip.startTime / totalDuration) * canvas.width * zoom;
          const clipWidth = ((clip.endTime - clip.startTime) / totalDuration) * canvas.width * zoom;
          
          // Check for resize handles (left and right edges)
          const handleWidth = 8;
          if (x >= clipX && x <= clipX + handleWidth) {
            // Left resize handle
            setResizeClip({ clip, edge: 'start', startX: x });
            return true;
          }
          if (x >= clipX + clipWidth - handleWidth && x <= clipX + clipWidth) {
            // Right resize handle
            setResizeClip({ clip, edge: 'end', startX: x });
            return true;
          }
          
          return x >= clipX && x <= clipX + clipWidth;
        });
        
        // Only start dragging if clip is already selected
        if (clickedClip && selectedClip === clickedClip.id) {
          // Start dragging if not resizing
          if (!resizeClip) {
            setDragClip({ clip: clickedClip, offsetX: x, offsetY: y });
            setIsDraggingClip(true);
          }
        }
      }
    }
    
    setIsDragging(true);
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragClip(null);
    setResizeClip(null);
    setIsDraggingClip(false);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!totalDuration) return;
    
    const canvas = event.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const percent = x / rect.width;
    const newTime = percent * totalDuration;
    
    // Handle selection dragging
    if (isDragging && selectionMode) {
      setSelectionEnd(newTime);
    }
    
    // Handle clip dragging
    if (isDraggingClip && dragClip) {
      const newPercent = x / rect.width;
      const newStartTime = newPercent * totalDuration;
      const clipDuration = dragClip.clip.endTime - dragClip.clip.startTime;
      
      // Check if moving to a different track
      const newTrackIndex = Math.floor(y / 120);
      const newTrack = tracks[newTrackIndex];
      
      setClips(prev => prev.map(c => 
        c.id === dragClip.clip.id 
          ? { 
              ...c, 
              startTime: Math.max(0, newStartTime),
              endTime: Math.max(0, newStartTime) + clipDuration,
              trackId: newTrack ? newTrack.id : c.trackId
            }
          : c
      ));
    }
    
    // Handle clip resizing
    if (resizeClip) {
      const newPercent = x / rect.width;
      const newTime = newPercent * totalDuration;
      
      setClips(prev => prev.map(c => {
        if (c.id !== resizeClip.clip.id) return c;
        
        if (resizeClip.edge === 'start') {
          const newStartTime = Math.min(newTime, c.endTime - 0.1);
          return { ...c, startTime: Math.max(0, newStartTime) };
        } else {
          const newEndTime = Math.max(newTime, c.startTime + 0.1);
          return { ...c, endTime: Math.min(totalDuration, newEndTime) };
        }
      }));
    }
  };

  const clearSelection = () => {
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectionMode(false);
  };

  const handleSplit = () => {
    if (tracks.length === 0) {
      setError('Please add audio tracks first');
      return;
    }

    // Find the clip at the current playhead position
    const clipAtPlayhead = clips.find(clip => 
      currentTime >= clip.startTime && currentTime <= clip.endTime
    );

    if (!clipAtPlayhead) {
      setError('No clip found at current playhead position');
      return;
    }

    const splitTime = currentTime;
    if (splitTime > clipAtPlayhead.startTime && splitTime < clipAtPlayhead.endTime) {
      // Stop current audio for this clip
      const currentSource = audioSourcesRef.current.get(clipAtPlayhead.id);
      if (currentSource) {
        try {
          currentSource.stop();
        } catch (e) {
          // Source might already be stopped
        }
        audioSourcesRef.current.delete(clipAtPlayhead.id);
      }

      // Get the original audio buffer info
      const track = tracks.find(t => t.id === clipAtPlayhead.trackId);
      const originalBufferInfo = audioBufferMap.get(track!.id);
      
      if (originalBufferInfo && audioContextRef.current) {
        // Calculate split position in samples relative to the original buffer
        const splitTimeInClip = splitTime - clipAtPlayhead.startTime;
        const sampleRate = originalBufferInfo.buffer.sampleRate;
        const splitSample = Math.floor(splitTimeInClip * sampleRate);
        
        // Calculate the actual sample positions in the original buffer
        const originalStartSample = originalBufferInfo.startSample + splitSample;
        const originalEndSample = originalBufferInfo.endSample;
        
        // Create first part buffer (from start to split point)
        const firstPartBuffer = audioContextRef.current.createBuffer(
          originalBufferInfo.buffer.numberOfChannels,
          splitSample,
          sampleRate
        );
        
        // Create second part buffer (from split point to end)
        const secondPartBuffer = audioContextRef.current.createBuffer(
          originalBufferInfo.buffer.numberOfChannels,
          originalBufferInfo.buffer.length - originalStartSample,
          sampleRate
        );
        
        // Copy audio data to new buffers from the original buffer
        for (let channel = 0; channel < originalBufferInfo.buffer.numberOfChannels; channel++) {
          const originalData = originalBufferInfo.buffer.getChannelData(channel);
          const firstPartData = firstPartBuffer.getChannelData(channel);
          const secondPartData = secondPartBuffer.getChannelData(channel);
          
          // Copy first part (from original start to split point)
          for (let i = 0; i < splitSample; i++) {
            firstPartData[i] = originalData[originalBufferInfo.startSample + i];
          }
          
          // Copy second part (from split point to original end)
          for (let i = 0; i < originalBufferInfo.buffer.length - originalStartSample; i++) {
            secondPartData[i] = originalData[originalStartSample + i];
          }
        }
        
        // Create new track IDs for the split parts
        const firstTrackId = `split_${Date.now()}_1`;
        const secondTrackId = `split_${Date.now()}_2`;
        
        // Store the new buffers
        audioBuffersRef.current.set(firstTrackId, firstPartBuffer);
        audioBuffersRef.current.set(secondTrackId, secondPartBuffer);
        
        // Update audio buffer map to track relationships
        setAudioBufferMap(prev => {
          const newMap = new Map(prev);
          newMap.set(firstTrackId, {
            buffer: firstPartBuffer,
            originalTrackId: originalBufferInfo.originalTrackId,
            startSample: originalBufferInfo.startSample,
            endSample: originalStartSample
          });
          newMap.set(secondTrackId, {
            buffer: secondPartBuffer,
            originalTrackId: originalBufferInfo.originalTrackId,
            startSample: originalStartSample,
            endSample: originalBufferInfo.endSample
          });
          return newMap;
        });
        
        // Create new tracks for the split parts
        const newTracks: AudioTrack[] = [
          {
            ...track!,
            id: firstTrackId,
            name: `${track!.name} (Part 1)`,
            duration: splitTimeInClip
          },
          {
            ...track!,
            id: secondTrackId,
            name: `${track!.name} (Part 2)`,
            duration: (originalBufferInfo.endSample - originalStartSample) / sampleRate
          }
        ];
        
        // Create new clips for the split parts
        const clip1: AudioClip = {
          id: Date.now().toString(),
          trackId: firstTrackId,
          startTime: clipAtPlayhead.startTime,
          endTime: splitTime,
          name: `${clipAtPlayhead.name} (Part 1)`,
          volume: clipAtPlayhead.volume,
          fadeIn: clipAtPlayhead.fadeIn,
          fadeOut: 0
        };
        
        const clip2: AudioClip = {
          id: (Date.now() + 1).toString(),
          trackId: secondTrackId,
          startTime: splitTime,
          endTime: clipAtPlayhead.endTime,
          name: `${clipAtPlayhead.name} (Part 2)`,
          volume: clipAtPlayhead.volume,
          fadeIn: 0,
          fadeOut: clipAtPlayhead.fadeOut
        };
        
        // Update tracks and clips
        setTracks(prev => prev.filter(t => t.id !== track!.id).concat(newTracks));
        setClips(prev => prev.filter(c => c.id !== clipAtPlayhead.id).concat([clip1, clip2]));
        setSelectedClip(clip1.id);
        
        // Restart audio playback
        if (isPlaying) {
          setTimeout(() => playAudio(), 50);
        }
      }
    }
  };

  const handleCut = () => {
    if (!selectedClip || !selectionStart || !selectionEnd) {
      setError('Please select a clip and make a selection first');
      return;
    }

    const clip = clips.find(c => c.id === selectedClip);
    if (!clip) return;

    const cutStart = Math.max(clip.startTime, selectionStart);
    const cutEnd = Math.min(clip.endTime, selectionEnd);

    if (cutStart >= cutEnd) {
      setError('Invalid selection for cutting');
      return;
    }

    // Create the cut clip
    const cutClip: AudioClip = {
      id: Date.now().toString(),
      trackId: clip.trackId,
      startTime: cutStart,
      endTime: cutEnd,
      name: `${clip.name} (Cut)`,
      volume: clip.volume,
      fadeIn: 0,
      fadeOut: 0,
      originalTrackId: clip.originalTrackId
    };

    // Update original clip
    const updatedClip = { ...clip };
    if (cutStart === clip.startTime) {
      updatedClip.startTime = cutEnd;
    } else if (cutEnd === clip.endTime) {
      updatedClip.endTime = cutStart;
    } else {
      // Split into two parts
      const secondPart: AudioClip = {
        id: (Date.now() + 1).toString(),
        trackId: clip.trackId,
        startTime: cutEnd,
        endTime: clip.endTime,
        name: `${clip.name} (Part 2)`,
        volume: clip.volume,
        fadeIn: 0,
        fadeOut: clip.fadeOut,
        originalTrackId: clip.originalTrackId
      };
      setClips(prev => [...prev, secondPart]);
      updatedClip.endTime = cutStart;
    }

    setClips(prev => prev.map(c => c.id === selectedClip ? updatedClip : c));
    setClips(prev => [...prev, cutClip]);
    setSelectedClip(cutClip.id);
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
      fadeOut: copiedClip.fadeOut,
      originalTrackId: copiedClip.originalTrackId
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
      fadeOut: clip.fadeOut,
      originalTrackId: clip.originalTrackId
    };

    setClips(prev => [...prev, newClip]);
  };

  const handleTrackMute = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, muted: !track.muted }
        : track
    ));
    
    // Immediately update audio if playing
    if (isPlaying) {
      // Stop all sources for this track
      clips.forEach(clip => {
        if (clip.trackId === trackId) {
          const source = audioSourcesRef.current.get(clip.id);
          if (source) {
            try {
              source.stop();
            } catch (e) {
              // Source might already be stopped
            }
            audioSourcesRef.current.delete(clip.id);
          }
        }
      });
      
      // Restart audio to apply mute
      setTimeout(() => playAudio(), 50);
    }
  };

  const handleTrackSolo = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, soloed: !track.soloed }
        : track
    ));
  };

  const handleTrackDuplicate = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) return;

    const newTrack: AudioTrack = {
      id: Date.now().toString(),
      name: `${track.name} (Copy)`,
      file: track.file,
      url: track.url,
      duration: track.duration,
      waveformData: track.waveformData,
      color: trackColors[tracks.length % trackColors.length],
      volume: track.volume,
      muted: false,
      soloed: false,
      leftChannel: track.leftChannel,
      rightChannel: track.rightChannel
    };

    setTracks(prev => [...prev, newTrack]);

    // Duplicate all clips from the original track
    const trackClips = clips.filter(clip => clip.trackId === trackId);
    const newClips = trackClips.map(clip => ({
      ...clip,
      id: Date.now() + Math.random().toString(),
      trackId: newTrack.id,
      name: `${clip.name} (Copy)`,
      originalTrackId: newTrack.id
    }));

    setClips(prev => [...prev, ...newClips]);
  };

  const handleClipDragStart = (event: React.MouseEvent, clip: AudioClip) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDragClip({
      clip,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    });
  };

  const handleClipDrop = (event: React.MouseEvent, targetTrackId: string) => {
    if (!dragClip) return;

    const canvas = event.currentTarget as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = x / rect.width;
    const newStartTime = percent * totalDuration;

    const newClip: AudioClip = {
      id: Date.now().toString(),
      trackId: targetTrackId,
      startTime: newStartTime,
      endTime: newStartTime + (dragClip.clip.endTime - dragClip.clip.startTime),
      name: dragClip.clip.name,
      volume: dragClip.clip.volume,
      fadeIn: dragClip.clip.fadeIn,
      fadeOut: dragClip.clip.fadeOut,
      originalTrackId: dragClip.clip.originalTrackId
    };

    setClips(prev => [...prev, newClip]);
    setDragClip(null);
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
      const trackHeight = 120;
      const trackY = trackIndex * trackHeight;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.fillRect(0, trackY, canvas.width, trackHeight);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, trackY, canvas.width, trackHeight);
      
      // Track name and controls area (left side)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 12px system-ui';
      ctx.fillText(track.name, 10, trackY + 20);

      // Track status indicators
      ctx.fillStyle = track.muted ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 255, 0, 0.8)';
      ctx.fillText(track.muted ? 'M' : '●', canvas.width - 80, trackY + 20);
      
      ctx.fillStyle = track.soloed ? 'rgba(255, 255, 0, 0.8)' : 'rgba(255, 255, 255, 0.4)';
      ctx.fillText(track.soloed ? 'S' : '○', canvas.width - 60, trackY + 20);

      ctx.fillStyle = track.leftChannel ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
      ctx.fillText('L', canvas.width - 40, trackY + 20);
      ctx.fillStyle = track.rightChannel ? 'rgba(0, 255, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
      ctx.fillText('R', canvas.width - 20, trackY + 20);

      if (track.waveformData && track.waveformData.length > 0) {
        const waveformHeight = 60;
        const waveformY = trackY + 40;
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
          ? 'rgba(0, 123, 255, 0.3)' 
          : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(clipX, trackY + 40, clipWidth, 60);
        
        ctx.strokeStyle = isSelected ? 'rgba(0, 123, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = isSelected ? 3 : 1;
        ctx.strokeRect(clipX, trackY + 40, clipWidth, 60);
        
        // Add selection indicator and resize handles
        if (isSelected) {
          ctx.fillStyle = 'rgba(0, 123, 255, 0.8)';
          ctx.fillRect(clipX, trackY + 40, 3, 60);
          
          // Resize handles
          const handleWidth = 8;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(clipX, trackY + 40, handleWidth, 60);
          ctx.fillRect(clipX + clipWidth - handleWidth, trackY + 40, handleWidth, 60);
          
          // Handle indicators
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(clipX + 2, trackY + 45, 4, 50);
          ctx.fillRect(clipX + clipWidth - 6, trackY + 45, 4, 50);
        }
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '10px system-ui';
        ctx.fillText(clip.name, clipX + 5, trackY + 60);
        
        if (clip.fadeIn > 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(clipX, trackY + 40, 10, 60);
        }
        if (clip.fadeOut > 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(clipX + clipWidth - 10, trackY + 40, 10, 60);
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

    // Selection mode indicator
    if (selectionMode) {
      ctx.fillStyle = 'rgba(0, 123, 255, 0.3)';
      ctx.fillRect(0, 0, canvas.width, 30);
      ctx.fillStyle = 'rgba(0, 123, 255, 0.8)';
      ctx.font = 'bold 12px system-ui';
      ctx.fillText('SELECTION MODE ACTIVE', 10, 20);
    }
    
    // Drag indicator
    if (isDraggingClip && dragClip) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 123, 255, 0.8)';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText('DRAGGING CLIP - Drop to move or resize', 10, 25);
    }
  };

  useEffect(() => {
    drawWaveform();
  }, [currentTime, tracks, clips, selectedClip, zoom, totalDuration, selectionStart, selectionEnd, selectionMode, isDraggingClip, dragClip, resizeClip]);

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

      {/* Futuristic Main Control Bar */}
      <div className="bg-gradient-to-r from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-2xl border-b border-gray-600/30 px-6 py-4 shadow-2xl relative z-20">
        <div className="flex items-center justify-between">
          {/* Time Displays - Futuristic */}
          <div className="flex items-center space-x-4">
            <div className="bg-gray-800/50 backdrop-blur-xl px-4 py-2 rounded-xl border border-gray-600/30">
              <span className="font-mono text-sm text-gray-200">{formatTime(currentTime)}</span>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-xl px-4 py-2 rounded-xl border border-gray-600/30">
              <span className="font-mono text-sm text-gray-200">{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Transport Controls - Futuristic Design */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-800/50 backdrop-blur-xl rounded-2xl p-2 border border-gray-600/30 shadow-lg">
              <button 
                onClick={handleStop}
                className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-xl border border-gray-600/30 flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200 shadow-inner"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <rect x="6" y="6" width="8" height="8"/>
                </svg>
              </button>
              <button 
                onClick={handlePlay} 
                disabled={isPlaying || tracks.length === 0}
                className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-800 rounded-xl border border-blue-500/30 flex items-center justify-center text-white disabled:text-gray-500 transition-all duration-200 shadow-lg mx-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 5v10l8-5-8-5z"/>
                </svg>
              </button>
              <button 
                onClick={handlePause} 
                disabled={!isPlaying}
                className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-700 disabled:to-gray-800 rounded-xl border border-gray-600/30 flex items-center justify-center text-gray-300 hover:text-white disabled:text-gray-500 transition-all duration-200 shadow-inner"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 4h2v12H6V4zm6 0h2v12h-2V4z"/>
                </svg>
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleSkipBackward}
                className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg border border-gray-600/30 flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11V16a1 1 0 001.555.832L18 13V16a1 1 0 102-1.664L12 14v-3l4 2.664V7l-4 2.664V8l-4-2.664V4l4 2.664V3a1 1 0 00-1.555-.832L4.555 5.168z"/>
                </svg>
              </button>
              <button 
                onClick={handleSkipForward}
                className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg border border-gray-600/30 flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15.445 5.168A1 1 0 0017 6v8a1 1 0 01-1.555.832L10 11V16a1 1 0 01-1.555.832L2 13V16a1 1 0 11-2-1.664L8 14v-3L4 13.664V7l4 2.664V8l4-2.664V4l-4 2.664V3a1 1 0 011.555-.832L15.445 5.168z"/>
                </svg>
              </button>
            </div>
            
            <button 
              onClick={handleRecord}
              className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl border border-red-500/30 flex items-center justify-center text-white transition-all duration-200 shadow-lg"
            >
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </button>
            
            {/* Direct Upload Button */}
            <div className="relative">
              <Input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="direct-file-upload"
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('direct-file-upload')?.click();
                }}
                className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 rounded-xl border border-green-500/30 flex items-center justify-center text-white transition-all duration-200 shadow-lg"
                title="Upload Audio File"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Menu Bar - File, Edit, Effects */}
          <div className="flex items-center space-x-6">
            {/* File Menu */}
            <div className="relative dropdown-trigger">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'file' ? null : 'file');
                }}
                className="px-4 py-2 bg-gradient-to-br from-gray-800/50 to-gray-700/50 hover:from-gray-700/50 hover:to-gray-600/50 rounded-xl border border-gray-600/30 text-gray-300 hover:text-white transition-all duration-200 backdrop-blur-xl"
              >
                File
              </button>
              {activeDropdown === 'file' && (
                <div className="fixed top-0 left-0 mt-2 w-48 bg-gray-800/90 backdrop-blur-xl rounded-xl border border-gray-600/30 shadow-2xl z-[99999] dropdown-menu" style={{ top: '120px', left: '50%', transform: 'translateX(-50%)' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNewFile();
                      setActiveDropdown(null);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors duration-200 rounded-t-xl"
                  >
                    New Project
                  </button>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('file-upload')?.click();
                        setActiveDropdown(null);
                      }}
                      className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      Open File
                    </button>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickMaster();
                      setActiveDropdown(null);
                    }}
                    disabled={tracks.length === 0 || isMastering}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors duration-200"
                  >
                    Export Master
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                      setActiveDropdown(null);
                    }}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors duration-200 rounded-b-xl"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="relative dropdown-trigger">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'edit' ? null : 'edit');
                }}
                className="px-4 py-2 bg-gradient-to-br from-gray-800/50 to-gray-700/50 hover:from-gray-700/50 hover:to-gray-600/50 rounded-xl border border-gray-600/30 text-gray-300 hover:text-white transition-all duration-200 backdrop-blur-xl"
              >
                Edit
              </button>
              {activeDropdown === 'edit' && (
                <div className="fixed top-0 left-0 mt-2 w-48 bg-gray-800/90 backdrop-blur-xl rounded-xl border border-gray-600/30 shadow-2xl z-[99999] dropdown-menu" style={{ top: '120px', left: '50%', transform: 'translateX(-50%)' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSplit();
                      setActiveDropdown(null);
                    }}
                    disabled={tracks.length === 0}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors duration-200 rounded-t-xl"
                  >
                    Split at Playhead
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCut();
                      setActiveDropdown(null);
                    }}
                    disabled={!selectedClip || !selectionStart || !selectionEnd}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors duration-200"
                  >
                    Cut Selection
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy();
                      setActiveDropdown(null);
                    }}
                    disabled={!selectedClip}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors duration-200"
                  >
                    Copy
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePaste();
                      setActiveDropdown(null);
                    }}
                    disabled={!copiedClip}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors duration-200"
                  >
                    Paste
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate();
                      setActiveDropdown(null);
                    }}
                    disabled={!selectedClip}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors duration-200"
                  >
                    Duplicate
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                      setActiveDropdown(null);
                    }}
                    disabled={!selectedClip}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Effects Menu */}
            <div className="relative dropdown-trigger">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'effects' ? null : 'effects');
                }}
                className="px-4 py-2 bg-gradient-to-br from-gray-800/50 to-gray-700/50 hover:from-gray-700/50 hover:to-gray-600/50 rounded-xl border border-gray-600/30 text-gray-300 hover:text-white transition-all duration-200 backdrop-blur-xl"
              >
                Effects
              </button>
              {activeDropdown === 'effects' && (
                <div className="fixed top-0 left-0 mt-2 w-48 bg-gray-800/90 backdrop-blur-xl rounded-xl border border-gray-600/30 shadow-2xl z-[99999] dropdown-menu" style={{ top: '120px', left: '50%', transform: 'translateX(-50%)' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFadeIn();
                      setActiveDropdown(null);
                    }}
                    disabled={!selectedClip}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors duration-200 rounded-t-xl"
                  >
                    Fade In
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFadeOut();
                      setActiveDropdown(null);
                    }}
                    disabled={!selectedClip}
                    className="w-full px-4 py-3 text-left text-gray-300 hover:text-white hover:bg-gray-700/50 disabled:text-gray-500 disabled:hover:bg-transparent transition-colors duration-200"
                  >
                    Fade Out
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectionMode(!selectionMode);
                      setActiveDropdown(null);
                    }}
                    className={`w-full px-4 py-3 text-left transition-colors duration-200 rounded-b-xl ${
                      selectionMode 
                        ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-900/30' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    Selection Mode
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Selection Info - Futuristic Display */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="bg-gray-800/50 backdrop-blur-xl rounded-xl border border-gray-600/30 px-4 py-2">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Start:</span>
                  <span className="bg-gray-700/50 px-2 py-1 rounded-lg text-gray-200 font-mono">
                    {selectionStart !== null ? formatTime(selectionStart) : '--:--'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">End:</span>
                  <span className="bg-gray-700/50 px-2 py-1 rounded-lg text-gray-200 font-mono">
                    {selectionEnd !== null ? formatTime(selectionEnd) : '--:--'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Duration:</span>
                  <span className="bg-gray-700/50 px-2 py-1 rounded-lg text-gray-200 font-mono">
                    {selectionStart !== null && selectionEnd !== null 
                      ? formatTime(Math.abs(selectionEnd - selectionStart)) 
                      : '--:--'}
                  </span>
                </div>
                <button 
                  onClick={clearSelection}
                  className="px-3 py-1 bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 rounded-lg border border-gray-600/30 text-gray-300 hover:text-white transition-all duration-200 text-xs"
                >
                  Clear
                </button>
              </div>
            </div>
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
      <div className="flex-1 relative z-10">
        <canvas
          ref={canvasRef}
          width={1200}
          height={tracks.length * 120 + 100}
          className="w-full cursor-pointer relative z-5"
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onMouseUp={handleCanvasMouseUp}
          onMouseMove={handleCanvasMouseMove}
          onDrop={(e) => {
            e.preventDefault();
            if (dragClip) {
              const targetTrackId = tracks[Math.floor(e.clientY / 120)]?.id;
              if (targetTrackId) {
                handleClipDrop(e as any, targetTrackId);
              }
            }
          }}
          onDragOver={(e) => e.preventDefault()}
        />
        
        {/* Track Controls - Left Side */}
        <div className="absolute left-2 top-2 space-y-2">
          {tracks.map((track, index) => (
            <div key={track.id} className="flex flex-col space-y-1" style={{ marginTop: index * 120 }}>
              <div className="text-xs font-bold text-white">{track.name}</div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => handleTrackMute(track.id)}
                  className={`w-6 h-6 text-xs rounded border ${track.muted ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                  title={track.muted ? 'Unmute' : 'Mute'}
                >
                  M
                </button>
                <button 
                  onClick={() => handleTrackSolo(track.id)}
                  className={`w-6 h-6 text-xs rounded border ${track.soloed ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                  title={track.soloed ? 'Unsolo' : 'Solo'}
                >
                  S
                </button>
                <button 
                  onClick={() => handleTrackDuplicate(track.id)}
                  className="w-6 h-6 text-xs rounded border bg-gray-700 hover:bg-gray-600 text-white"
                  title="Duplicate Track"
                >
                  D
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Channel Controls */}
        <div className="absolute right-2 top-2 space-y-2">
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
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById('file-upload')?.click();
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 px-6 py-3 rounded-xl border border-purple-500/30 text-white font-medium transition-all duration-200 shadow-lg"
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
