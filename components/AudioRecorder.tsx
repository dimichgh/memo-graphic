import React, { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon } from './Icons';
import { AudioData } from '../types';

interface AudioRecorderProps {
  onRecordingComplete: (data: AudioData) => void;
  disabled: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Typically webm in Chrome/FF
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Extract the base64 part
          const base64 = base64String.split(',')[1];
          onRecordingComplete({
            blob,
            base64,
            mimeType: blob.type
          });
        };
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 bg-red-400 rounded-full recording-pulse opacity-50"></div>
        )}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          className={`relative z-10 w-24 h-24 flex items-center justify-center rounded-full transition-all duration-300 shadow-lg ${
            disabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isRecording ? (
            <StopIcon className="w-10 h-10" />
          ) : (
            <MicrophoneIcon className="w-10 h-10" />
          )}
        </button>
      </div>
      
      <div className="text-center">
        <p className="text-2xl font-mono font-medium text-slate-700">
          {isRecording ? formatTime(recordingTime) : "Tap to Record"}
        </p>
        <p className="text-sm text-slate-500 mt-2">
          {isRecording ? "Recording your memo..." : "Share your thoughts"}
        </p>
      </div>
    </div>
  );
};

export default AudioRecorder;