import React, { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';

const AudioSeparator = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [stemType, setStemType] = useState('vocals_instruments');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [results, setResults] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [progressInterval, setProgressInterval] = useState(null);
  const [dependencies, setDependencies] = useState({});
  const [playingStemUrl, setPlayingStemUrl] = useState(null);
  const [playingStemName, setPlayingStemName] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioPlayerRef = useRef(null);

  // Object to define model capabilities - which stems a model can produce
  const modelCapabilities = {
    // Models that can produce multi-stems (vocals, drums, bass, other)
    multiStem: [
      'htdemucs_ft.yaml', 
      'htdemucs.yaml', 
      'hdemucs_mmi.yaml', 
      'htdemucs_6s.yaml',
      'kuielab_a_vocals.onnx',
      'kuielab_b_vocals.onnx'
    ],
    // Drums separation models
    drums: [
      'MDX23C-DrumSep-aufr33-jarredou.ckpt'
    ],
    // Models with de-noise capability
    deNoise: [
      'UVR-DeNoise-Lite.pth',
      'UVR-DeNoise.pth',
      'denoise_mel_band_roformer_aufr33_sdr_27.9959.ckpt',
      'denoise_mel_band_roformer_aufr33_aggr_sdr_27.9768.ckpt'
    ]
  };

  // Function to determine model capabilities
  const getModelCapabilities = (model) => {
    if (modelCapabilities.multiStem.some(m => model.includes(m))) {
      return 'multi_stem';
    } else if (modelCapabilities.drums.some(m => model.includes(m))) {
      return 'drums';
    } else if (modelCapabilities.deNoise.some(m => model.includes(m))) {
      return 'de_noise';
    } else {
      return 'vocals_instruments'; // Default capability
    }
  };

  // Effect to set stem type when model changes
  useEffect(() => {
    if (selectedModel) {
      setStemType(getModelCapabilities(selectedModel));
    }
  }, [selectedModel]);

  // Check dependencies
  useEffect(() => {
    const checkDependencies = async () => {
      try {
        const response = await fetch('/api/check-installation');
        const data = await response.json();
        
        console.log("Dependencies check:", data);
        setDependencies(data.dependencies || {});
        
        // Show error if any dependency is missing
        if (!data.all_installed) {
          const missingDeps = Object.entries(data.dependencies || {})
            .filter(([_, info]) => !info.installed)
            .map(([name, info]) => `${name}: ${info.message || 'Not installed'}`);
          
          setError('Missing dependencies');
          setErrorDetails(
            <div>
              <p>Some required dependencies are missing:</p>
              <ul>
                {missingDeps.map((dep, i) => <li key={i}>{dep}</li>)}
              </ul>
              <p>Please install these dependencies on the server before continuing.</p>
            </div>
          );
        }
      } catch (error) {
        console.error('Error checking dependencies:', error);
      }
    };
    
    checkDependencies();
  }, []);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        console.log("Attempting to fetch models from /api/models...");
        const response = await fetch('/api/models');
        console.log("Response received:", response);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Data received:", data);
        
        if (data.error) {
          setError(data.error);
          console.error("Error in response:", data.error);
        } else if (data.models && data.models.length > 0) {
          console.log("Models found:", data.models);
          setModels(data.models);
          setSelectedModel(data.models[0]);
        } else {
          console.log("No models found in response");
          setError("No models were found. Make sure audio-separator is installed correctly.");
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setError('Failed to fetch available models. Please check your server connection.');
        
        // Let's try to use a default model if we can't fetch the list
        console.log("Setting default model as fallback");
        setModels(['UVR-MDX-NET-Inst_HQ_3.onnx']);
        setSelectedModel('UVR-MDX-NET-Inst_HQ_3.onnx');
      }
    };

    fetchModels();
  }, []);

  // Clean up progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);

  // Function to poll for progress updates
  const startProgressPolling = (id) => {
    // Clear any existing interval
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    // Set up a new interval to poll for progress
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/progress/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Progress update:", data);
        
        setProgress(data.progress || 0);
        setStatus(data.status || 'Processing...');
        
        // If the job is complete, stop polling and fetch the results
        if (data.complete) {
          clearInterval(interval);
          setProgressInterval(null);
          fetchResults(id);
        }
      } catch (error) {
        console.error('Error polling for progress:', error);
        // Don't stop polling on errors, just log them
      }
    }, 1000); // Poll every second
    
    setProgressInterval(interval);
  };

  // Function to fetch final results
  const fetchResults = async (id) => {
    try {
      const response = await fetch(`/api/result/${id}`);
      
      if (!response.ok) {
        if (response.status === 202) {
          // Job still in progress, continue polling
          return;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Result data:", data);
      
      if (data.success) {
        setResults(data);
        setIsProcessing(false);
        setProgress(100);
        setStatus('Complete');
      } else {
        setError(data.error || 'An error occurred during processing');
        
        // Try to parse error for useful information
        if (data.error && data.error.includes('FFmpeg')) {
          setErrorDetails(
            <div>
              <p>FFmpeg error detected. Please ensure FFmpeg is installed on the server.</p>
              <p>Installation instructions:</p>
              <pre>sudo apt update && sudo apt install -y ffmpeg</pre>
            </div>
          );
        } else if (data.error) {
          setErrorDetails(<pre>{data.error}</pre>);
        }
        
        setIsProcessing(false);
        setProgress(0);
        setStatus('Error');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to fetch results. Please try again.');
      setIsProcessing(false);
      setProgress(0);
      setStatus('Error');
    }
  };

  // Handle file drop
  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.m4a']
    },
    maxFiles: 1
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select an audio file');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResults(null);
    setProgress(0);
    setStatus('Preparing...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', selectedModel);
    formData.append('stem_type', stemType);

    try {
      console.log("Sending separation request to /api/separate with model:", selectedModel);
      const response = await fetch('/api/separate', {
        method: 'POST',
        body: formData,
      });

      console.log("Separation response received:", response);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Separation data:", data);

      if (data.job_id) {
        setJobId(data.job_id);
        // Start polling for progress updates
        startProgressPolling(data.job_id);
      } else {
        setError('No job ID returned from server');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Failed to connect to the server. Make sure the backend is running.');
      setIsProcessing(false);
    }
  };

  // Render function for dropzone
  const renderDropzone = () => {
    return (
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'dropzone-active' : ''}`}
      >
        <input {...getInputProps()} />
        {file ? (
          <p>Selected file: {file.name}</p>
        ) : (
          <p>Drag and drop an audio file here, or click to select a file</p>
        )}
      </div>
    );
  };

  // Render function for progress
  const renderProgress = () => {
    if (!isProcessing) return null;

    return (
      <div className="progress-container">
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="progress-info">
          <span className="progress-percentage">{progress}%</span>
          <span className="progress-status">{status}</span>
        </div>
      </div>
    );
  };

  // Helper function to categorize files by stem type
  const categorizeFiles = (files) => {
    const stems = {
      vocals: [],
      instrumental: [],
      drums: [],
      bass: [],
      other: [],
      unknown: []
    };
    
    files.forEach(filename => {
      const lowerFilename = filename.toLowerCase();
      
      if (lowerFilename.includes('vocals') || lowerFilename.includes('vocal)')) {
        stems.vocals.push(filename);
      } else if (lowerFilename.includes('instruments') || lowerFilename.includes('instrumental)')) {
        stems.instrumental.push(filename);
      } else if (lowerFilename.includes('drums') || lowerFilename.includes('drum)')) {
        stems.drums.push(filename);
      } else if (lowerFilename.includes('bass)')) {
        stems.bass.push(filename);
      } else if (lowerFilename.includes('other)')) {
        stems.other.push(filename);
      } else {
        stems.unknown.push(filename);
      }
    });
    
    return stems;
  };

  // Helper function to download a file via XHR with format selection
  const downloadFile = (url, filename, format) => {
    // Add format parameter to URL if specified
    const downloadUrl = format ? `${url}?format=${format}` : url;
    
    // Modify filename extension if format is specified
    let downloadFilename = filename;
    if (format) {
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
      downloadFilename = `${nameWithoutExt}.${format}`;
    }
    
    // Create a temporary link for downloading
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', downloadFilename);
    link.setAttribute('target', '_blank');
    
    // Use a direct fetch method for more reliable downloads
    fetch(downloadUrl)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      })
      .catch(error => {
        console.error('Download error:', error);
        // Fallback to direct link as a last resort
        window.open(downloadUrl, '_blank');
      });
  };

  // Add audio player event listeners
  useEffect(() => {
    const audioEl = audioPlayerRef.current;
    if (audioEl) {
      const handlePlay = () => setIsAudioPlaying(true);
      const handlePause = () => setIsAudioPlaying(false);
      const handleEnded = () => {
        setIsAudioPlaying(false);
        setPlayingStemUrl(null);
        setPlayingStemName(null);
      };

      audioEl.addEventListener('play', handlePlay);
      audioEl.addEventListener('pause', handlePause);
      audioEl.addEventListener('ended', handleEnded);

      return () => {
        audioEl.removeEventListener('play', handlePlay);
        audioEl.removeEventListener('pause', handlePause);
        audioEl.removeEventListener('ended', handleEnded);
      };
    }
  }, [playingStemUrl]);

  // Function to play a stem
  const playStem = (url, stemName) => {
    // If the same stem is clicked again, toggle play/pause
    if (playingStemUrl === url) {
      if (audioPlayerRef.current.paused) {
        audioPlayerRef.current.play();
      } else {
        audioPlayerRef.current.pause();
      }
    } else {
      // Play a different stem
      setPlayingStemUrl(url);
      setPlayingStemName(`Now Playing: ${stemName}`);
      
      // Wait for state update and then play
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.load();
          audioPlayerRef.current.play();
        }
      }, 100);
    }
  };

  // Render function for results
  const renderResults = () => {
    if (!results) return null;

    // Organize files by stem type
    const stems = categorizeFiles(results.output_files || []);

    // Function to extract original name from filename
    const getOriginalName = (filename) => {
      // Extract original filename from the format jobId_originalName_(Stem).ext
      let originalName = filename;
      
      // Remove job_id prefix if present
      if (originalName.startsWith(results.job_id)) {
        originalName = originalName.substring(results.job_id.length + 1);
      }
      
      // Remove stem type suffix
      ['(Vocals)', '(Instrumental)', '(Drums)', '(Bass)', '(Other)'].forEach(marker => {
        originalName = originalName.replace(marker, '');
      });
      
      // Get just the name without extension
      if (originalName.includes('.')) {
        originalName = originalName.substring(0, originalName.lastIndexOf('.'));
      }
      
      return originalName.trim();
    };
    
    // Get file size in MB
    const getFileSize = () => {
      // Mock data - would be replaced by actual file size
      return "1.25 MB";
    };
    
    // Get audio format
    const getAudioFormat = (filename) => {
      const ext = filename.split('.').pop().toUpperCase();
      if (ext === 'MP3') return 'MPEG';
      return ext;
    };
    
    // Get audio duration - would be implemented with audio metadata
    const getAudioDuration = () => {
      return "1:21";
    };
    
    // Get sample rate - would be implemented with audio metadata
    const getSampleRate = () => {
      return "44.1kHz";
    };
    
    // Get first filename to extract metadata
    const firstFile = results.output_files && results.output_files.length > 0 
      ? results.output_files[0] 
      : null;
    
    // Extract original name for display
    const originalFileName = firstFile ? getOriginalName(firstFile) : "Unknown";

    return (
      <div className="results-container">
        <div className="results-content">
          <div className="results-header">
            <h3>Stem Separation Complete</h3>
          </div>
          
          {results.output_files && results.output_files.length > 0 ? (
            <>
              <div className="file-metadata">
                <table>
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Size</th>
                      <th>Format</th>
                      <th>Duration</th>
                      <th>Sample Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{originalFileName}</td>
                      <td>{getFileSize()}</td>
                      <td>{getAudioFormat(firstFile)}</td>
                      <td>{getAudioDuration()}</td>
                      <td>{getSampleRate()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="audio-player-container">
                <audio 
                  ref={audioPlayerRef} 
                  className="audio-player-element" 
                  controls
                  controlsList="nodownload"
                >
                  {playingStemUrl && <source src={playingStemUrl} />}
                  Your browser does not support the audio element.
                </audio>
                <p className="player-instruction">{playingStemName || "Select a stem to preview"}</p>
              </div>
              
              <div className="stems-list">
                {Object.entries(stems).map(([stemType, files]) => {
                  if (files.length === 0) return null;
                  
                  return files.map((filename, index) => {
                    const baseUrl = `/api/download/${results.job_id}/${encodeURIComponent(filename)}`;
                    const isPlaying = playingStemUrl === baseUrl && isAudioPlaying;
                    
                    // Get stem icon based on type
                    const getStemIcon = () => {
                      switch(stemType.toLowerCase()) {
                        case 'vocals': return <span className="stem-icon vocals-icon">🎤</span>;
                        case 'drums': return <span className="stem-icon drums-icon">🥁</span>;
                        case 'bass': return <span className="stem-icon bass-icon">🎸</span>;
                        case 'other': return <span className="stem-icon other-icon">🎹</span>;
                        default: return <span className="stem-icon">🎵</span>;
                      }
                    };
                    
                    return (
                      <div key={index} className="stem-item">
                        <div className="stem-info">
                          {getStemIcon()}
                          <div className="stem-name">
                            <span className="stem-type">{stemType.charAt(0).toUpperCase() + stemType.slice(1)}</span>
                            <span className="stem-format">MPEG • 319.03 KB</span>
                          </div>
                        </div>
                        <div className="stem-actions">
                          <button 
                            className="play-action"
                            onClick={() => playStem(baseUrl, stemType)}
                            aria-label={isPlaying ? "Pause stem" : "Play stem"}
                          >
                            <span className="headphones-icon">🎧</span>
                          </button>
                          <button 
                            className="download-action"
                            onClick={() => downloadFile(baseUrl, `${originalFileName}-${stemType}.mp3`, 'mp3')}
                            aria-label="Download stem"
                          >
                            <span className="download-icon">⬇️</span>
                          </button>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
              
              <div className="return-container">
                <button className="return-button" onClick={() => setResults(null)}>
                  Process Another File
                </button>
              </div>
            </>
          ) : (
            <p>No output files were generated. Please try again.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {!results ? (
        <>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="modelSelect">Select Model:</label>
              <select
                id="modelSelect"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                required
              >
                <option value="">Select a model...</option>
                {models.map((model, index) => (
                  <option key={index} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="stemTypeSelect">Separation Type:</label>
              <select
                id="stemTypeSelect"
                value={stemType}
                onChange={(e) => setStemType(e.target.value)}
                required
              >
                <option value="vocals_instruments">Vocals / Instruments</option>
                <option value="multi_stem">Multi-stem (Vocals, Drums, Bass, Other)</option>
              </select>
            </div>

            {renderDropzone()}

            <button type="submit" disabled={!file || isProcessing}>
              {isProcessing ? "Processing..." : "Separate Audio"}
            </button>
          </form>

          {error && (
            <div className="error-container">
              <div className="error-message">{error}</div>
              {errorDetails && (
                <div className="error-details">
                  <p>Error details:</p>
                  <pre>{errorDetails}</pre>
                </div>
              )}
            </div>
          )}

          {renderProgress()}
        </>
      ) : (
        renderResults()
      )}
    </div>
  );
};

export default AudioSeparator; 