export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING_AUDIO = 'PROCESSING_AUDIO',
  REVIEW_TRANSCRIPT = 'REVIEW_TRANSCRIPT',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface AudioData {
  blob: Blob;
  base64: string;
  mimeType: string;
}

export interface GenerationResult {
  transcript: string;
  imageUrl?: string;
}

// Extend window for the specific environment API Key selection
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}