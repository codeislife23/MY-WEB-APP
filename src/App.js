import React, { useState, useEffect } from 'react';
import './App.css';
import AudioSeparator from './components/AudioSeparator';
import Installation from './components/Installation';

function App() {
  const [isInstalled, setIsInstalled] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [installationError, setInstallationError] = useState(null);

  useEffect(() => {
    // Check if audio-separator is installed
    const checkInstallation = async () => {
      try {
        const response = await fetch('/api/check-installation');
        const data = await response.json();
        setIsInstalled(data.all_installed);
      } catch (error) {
        console.error('Error checking installation:', error);
        setIsInstalled(false);
        setInstallationError('Failed to connect to the backend server. Make sure the Flask server is running.');
      } finally {
        setIsLoading(false);
      }
    };

    checkInstallation();
  }, []);

  if (isLoading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>Audio Separator</h1>
          <p>Checking installation status...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Audio Separator</h1>
        <p>Separate your audio into instrumental and vocals</p>
      </header>
      
      <main className="App-main">
        {isInstalled ? (
          <AudioSeparator />
        ) : (
          <Installation error={installationError} />
        )}
      </main>
      
      <footer className="App-footer">
        <p>
          Powered by <a href="https://github.com/nomadkaraoke/python-audio-separator" target="_blank" rel="noopener noreferrer">python-audio-separator</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
