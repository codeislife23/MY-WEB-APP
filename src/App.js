import React, { useState, useEffect } from 'react';
import './App.css';
import AudioSeparator from './components/AudioSeparator';
import Installation from './components/Installation';
import { ThemeProvider, DarkThemeStylesheet } from './components/ui/ThemeProvider';

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

  return (
    <ThemeProvider defaultTheme="dark">
      <DarkThemeStylesheet />
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="App">
          <header className="App-header">
            <div className="glow-orb"></div>
            <h1>Audio Separator Studio</h1>
            <p className="subtitle">Advanced AI-powered stem separation technology</p>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-value">99.8%</span>
                <span className="stat-label">Accuracy</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">4</span>
                <span className="stat-label">Stem Types</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">24-bit</span>
                <span className="stat-label">Quality</span>
              </div>
            </div>
          </header>
          
          <main className="App-main">
            {isLoading ? (
              <div className="loader-container">
                <div className="loader"></div>
                <p className="loader-text">Initializing system components...</p>
              </div>
            ) : isInstalled ? (
              <AudioSeparator />
            ) : (
              <Installation error={installationError} />
            )}
          </main>
          
          <footer className="App-footer">
            <div className="footer-content">
              <p>
                Powered by <a href="https://github.com/nomadkaraoke/python-audio-separator" target="_blank" rel="noopener noreferrer">python-audio-separator</a>
              </p>
              <div className="footer-links">
                <a href="#">Documentation</a>
                <a href="#">Support</a>
                <a href="#">GitHub</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
