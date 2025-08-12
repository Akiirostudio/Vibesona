declare module 'waveform-playlist' {
  interface WaveformPlaylistOptions {
    samplesPerPixel?: number;
    waveHeight?: number;
    container?: HTMLElement;
    colors?: {
      waveOutlineColor?: string;
      timeColor?: string;
      fadeColor?: string;
      cursorColor?: string;
      selectionColor?: string;
      gridColor?: string;
      backgroundColor?: string;
      trackBackgroundColor?: string;
    };
    isAutomaticScroll?: boolean;
    isContinuousPlay?: boolean;
    linkEndpoints?: boolean;
    zoomLevels?: number[];
    defaultFadeType?: 'logarithmic' | 'linear' | 'sCurve' | 'exponential';
  }

  interface Track {
    getDuration(): number;
    getStartTime(): number;
    getEndTime(): number;
  }

  class WaveformPlaylist {
    constructor(container: HTMLElement, options?: WaveformPlaylistOptions);
    
    // Event handling
    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    
    // Playback controls
    play(): void;
    pause(): void;
    stop(): void;
    
    // File operations
    loadFile(file: File): void;
    
    // Zoom controls
    zoomIn(): void;
    zoomOut(): void;
    
    // Editing operations
    trim(): void;
    split(): void;
    
    // Export
    startAudioRendering(format: 'wav' | 'buffer'): void;
    
    // Track management
    getTracks(): Track[];
    
    // State management
    destroy(): void;
  }

  export = WaveformPlaylist;
}
