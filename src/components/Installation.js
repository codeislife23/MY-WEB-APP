import React from 'react';
import { Button } from '../components/ui/Button';

const Installation = ({ error }) => {
  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-6 text-white">Installation Required</h2>
      
      {error && (
        <div className="bg-red-950/30 border border-red-800 p-4 rounded-md mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      <p className="mb-6 text-zinc-300">
        It seems that the <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-red-400">audio-separator</code> Python package is not installed 
        or the backend server is not running. Please follow these steps to set up:
      </p>
      
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-xl font-medium text-red-500">1. Install audio-separator</h3>
          <div className="bg-zinc-800 p-4 rounded-md">
            <p className="text-zinc-300 mb-2">Install with pip (CPU version):</p>
            <pre className="bg-zinc-900 p-3 rounded overflow-x-auto text-zinc-300 mb-4">pip install "audio-separator[cpu]"</pre>
            
            <p className="text-zinc-300 mb-2">Or install with pip (GPU version, if you have CUDA):</p>
            <pre className="bg-zinc-900 p-3 rounded overflow-x-auto text-zinc-300 mb-4">pip install "audio-separator[gpu]"</pre>
            
            <p className="text-zinc-300 mb-2">Or install with conda:</p>
            <pre className="bg-zinc-900 p-3 rounded overflow-x-auto text-zinc-300">conda install audio-separator -c pytorch -c conda-forge</pre>
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-xl font-medium text-red-500">2. Run the backend server</h3>
          <div className="bg-zinc-800 p-4 rounded-md">
            <p className="text-zinc-300 mb-2">Make sure you have Flask and dependencies installed:</p>
            <pre className="bg-zinc-900 p-3 rounded overflow-x-auto text-zinc-300 mb-4">pip install flask flask-cors</pre>
            
            <p className="text-zinc-300 mb-2">Then run the server:</p>
            <pre className="bg-zinc-900 p-3 rounded overflow-x-auto text-zinc-300">python server.py</pre>
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-xl font-medium text-red-500">3. Run the frontend</h3>
          <div className="bg-zinc-800 p-4 rounded-md">
            <p className="text-zinc-300 mb-2">In a separate terminal, run:</p>
            <pre className="bg-zinc-900 p-3 rounded overflow-x-auto text-zinc-300">npm start</pre>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-zinc-800/50 border border-zinc-700 rounded-md">
        <p className="text-zinc-300 mb-4">
          After completing these steps, refresh this page. The application should 
          detect the audio-separator installation and be ready to use.
        </p>
        
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Refresh Page
        </Button>
      </div>
      
      <p className="mt-6 text-zinc-400">
        For more details, refer to the{' '}
        <a 
          href="https://github.com/nomadkaraoke/python-audio-separator" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-red-400 hover:text-red-300 underline"
        >
          python-audio-separator GitHub repository
        </a>.
      </p>
    </div>
  );
};

export default Installation; 