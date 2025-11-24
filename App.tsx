import React, { useState, useEffect } from 'react';
import AudioRecorder from './components/AudioRecorder';
import { MagicWandIcon, RefreshIcon, DownloadIcon } from './components/Icons';
import { transcribeAudio, generateInfographic, ensureApiKeySelected } from './services/geminiService';
import { AppState, AudioData } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [transcript, setTranscript] = useState<string>("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Initialize and check for API Key capability for Pro models
  useEffect(() => {
    // We don't force selection on load, only when needed (Image Generation)
    // But we could pre-check if we wanted to show a "Connect" button.
  }, []);

  const handleRecordingComplete = async (data: AudioData) => {
    setAppState(AppState.PROCESSING_AUDIO);
    setErrorMsg(null);
    try {
      const text = await transcribeAudio(data.base64, data.mimeType);
      setTranscript(text);
      setAppState(AppState.REVIEW_TRANSCRIPT);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to transcribe audio.");
      setAppState(AppState.ERROR);
    }
  };

  const handleGenerateImage = async () => {
    setAppState(AppState.GENERATING_IMAGE);
    setErrorMsg(null);
    try {
      // Ensure key selection for the Pro model
      const keySelected = await ensureApiKeySelected();
      if (!keySelected) {
        throw new Error("API Key selection is required for Pro models.");
      }

      const imageUrl = await generateInfographic(transcript);
      setGeneratedImageUrl(imageUrl);
      setAppState(AppState.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to generate infographic.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setTranscript("");
    setGeneratedImageUrl(null);
    setErrorMsg(null);
  };

  const handleDownload = () => {
    if (generatedImageUrl) {
      const link = document.createElement('a');
      link.href = generatedImageUrl;
      link.download = `memo-graphic-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <header className="mb-10 text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          <span className="gradient-text">MemoGraphic</span>
        </h1>
        <p className="text-slate-600 text-lg">
          Turn your voice into beautiful infographics instantly with Gemini Nano Banana Pro.
        </p>
      </header>

      <main className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 min-h-[500px] flex flex-col">
        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ 
              width: appState === AppState.IDLE ? '5%' :
                     appState === AppState.RECORDING ? '25%' :
                     appState === AppState.PROCESSING_AUDIO ? '50%' :
                     appState === AppState.REVIEW_TRANSCRIPT ? '75%' :
                     appState === AppState.GENERATING_IMAGE ? '90%' : '100%'
            }}
          />
        </div>

        <div className="flex-1 p-8 flex flex-col items-center justify-center">
          
          {/* Error State */}
          {appState === AppState.ERROR && (
             <div className="text-center w-full">
               <div className="text-red-500 bg-red-50 p-4 rounded-lg mb-6 border border-red-100">
                 <p className="font-medium">Error</p>
                 <p className="text-sm">{errorMsg}</p>
               </div>
               <button onClick={handleReset} className="text-slate-600 hover:text-indigo-600 font-medium flex items-center justify-center gap-2 mx-auto">
                 <RefreshIcon className="w-5 h-5" /> Try Again
               </button>
             </div>
          )}

          {/* Idle / Recording State */}
          {(appState === AppState.IDLE || appState === AppState.RECORDING) && (
            <AudioRecorder 
              onRecordingComplete={handleRecordingComplete} 
              disabled={appState === AppState.PROCESSING_AUDIO} 
            />
          )}

          {/* Processing Audio State */}
          {appState === AppState.PROCESSING_AUDIO && (
            <div className="text-center animate-pulse">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagicWandIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Transcribing...</h3>
              <p className="text-slate-500 mt-2">Listening to your genius ideas.</p>
            </div>
          )}

          {/* Review Transcript State */}
          {appState === AppState.REVIEW_TRANSCRIPT && (
            <div className="w-full flex flex-col h-full">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Review Memo</h3>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full flex-1 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none mb-6 text-slate-700"
                placeholder="Transcript will appear here..."
              />
              <div className="flex gap-3">
                <button 
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleGenerateImage}
                  className="flex-[2] py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  <MagicWandIcon className="w-5 h-5" />
                  Generate Visuals
                </button>
              </div>
            </div>
          )}

          {/* Generating Image State */}
          {appState === AppState.GENERATING_IMAGE && (
            <div className="text-center">
              <div className="w-20 h-20 relative mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-slate-800">Designing Infographic...</h3>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                Using Gemini Nano Banana Pro to create a visual masterpiece from your words.
              </p>
            </div>
          )}

          {/* Completed State */}
          {appState === AppState.COMPLETED && generatedImageUrl && (
            <div className="w-full flex flex-col h-full items-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 self-start">Your MemoGraphic</h3>
              <div className="relative w-full flex-1 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 mb-6 group">
                <img 
                  src={generatedImageUrl} 
                  alt="Generated Infographic" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={handleDownload}
                    className="bg-white text-slate-900 py-2 px-6 rounded-full font-medium hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    Download
                  </button>
                </div>
              </div>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshIcon className="w-5 h-5" />
                  Start New
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                  Save Image
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="mt-8 text-center text-slate-400 text-sm">
        <p>Powered by Gemini 2.5 Flash & 3.0 Pro Image Preview</p>
      </footer>
    </div>
  );
};

export default App;