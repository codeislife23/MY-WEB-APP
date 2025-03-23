import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "./Button";

export function useAudioUpload({ onUpload = () => {} } = {}) {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const handleAudioClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith("audio/")) {
        setFileName(file.name);
        setAudioFile(file);
        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleRemove = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setFileName(null);
    setAudioFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsPlaying(false);
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return {
    fileName,
    audioFile,
    audioUrl,
    fileInputRef,
    audioRef,
    isPlaying,
    handleAudioClick,
    handleFileChange,
    handleRemove,
    togglePlay,
  };
}

export function AudioUploader({ onUpload = (file) => console.log("Uploaded audio file:", file) }) {
  const {
    fileName,
    audioUrl,
    fileInputRef,
    audioRef,
    isPlaying,
    handleAudioClick,
    handleFileChange,
    handleRemove,
    togglePlay,
  } = useAudioUpload({
    onUpload,
  });

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("audio/")) {
        const fakeEvent = {
          target: {
            files: [file],
          },
        };
        handleFileChange(fakeEvent);
      }
    },
    [handleFileChange]
  );

  return (
    <div className="w-full max-w-md space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-sm">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-white">Audio Separator</h3>
        <p className="text-sm text-zinc-400">
          Supported formats: MP3, WAV, OGG, FLAC
        </p>
      </div>

      <input
        type="file"
        accept="audio/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {!audioUrl ? (
        <div
          onClick={handleAudioClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50 transition-colors hover:bg-zinc-800",
            isDragging && "border-red-500/50 bg-red-500/5"
          )}
        >
          <div className="rounded-full bg-zinc-800 p-3 shadow-sm">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-red-500" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Click to select</p>
            <p className="text-xs text-zinc-400">
              or drag and drop audio file here
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="group relative h-64 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-800 p-4">
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-4 rounded-full bg-zinc-700 p-6">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12 text-red-500" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              
              <audio ref={audioRef} src={audioUrl} className="hidden" />
              
              <div className="mt-4 flex w-full items-center justify-center gap-4">
                <button
                  onClick={togglePlay}
                  className="h-10 w-10 rounded-full border border-zinc-700 bg-zinc-700 p-0 hover:bg-zinc-600 hover:text-red-500 flex items-center justify-center"
                >
                  {isPlaying ? (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 text-red-500" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 text-red-500" 
                      width="24" 
                      height="24" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleRemove}
                  className="h-10 w-10 rounded-full border border-zinc-700 bg-zinc-700 p-0 hover:bg-zinc-600 hover:text-red-500 flex items-center justify-center"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 text-red-500" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          
          {fileName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
              <span className="truncate">{fileName}</span>
              <button
                onClick={handleRemove}
                className="ml-auto rounded-full p-1 hover:bg-zinc-800"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4" 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
      
      {audioUrl && (
        <Button 
          variant="destructive"
          className="w-full"
        >
          Separate Audio
        </Button>
      )}
    </div>
  );
} 