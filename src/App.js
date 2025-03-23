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
            <h1 className="text-3xl font-bold text-white">Audio Separator</h1>
            <p className="text-zinc-400">Separate your audio into instrumental and vocals</p>
          </header>
          
          <main className="App-main bg-zinc-900 shadow-lg border border-zinc-800">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-zinc-400">Checking installation status...</p>
              </div>
            ) : isInstalled ? (
              <AudioSeparator />
            ) : (
              <Installation error={installationError} />
            )}
          </main>
          
          <footer className="App-footer">
            <p className="text-zinc-500">
              Powered by <a href="https://github.com/nomadkaraoke/python-audio-separator" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400">python-audio-separator</a>
            </p>
          </footer>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
