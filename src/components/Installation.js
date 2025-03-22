import React from 'react';

const Installation = ({ error }) => {
  return (
    <div>
      <h2>Installation Required</h2>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      <p>
        It seems that the <code>audio-separator</code> Python package is not installed 
        or the backend server is not running. Please follow these steps to set up:
      </p>
      
      <h3>1. Install audio-separator</h3>
      <div className="code-block">
        <p>Install with pip (CPU version):</p>
        <pre>pip install "audio-separator[cpu]"</pre>
        
        <p>Or install with pip (GPU version, if you have CUDA):</p>
        <pre>pip install "audio-separator[gpu]"</pre>
        
        <p>Or install with conda:</p>
        <pre>conda install audio-separator -c pytorch -c conda-forge</pre>
      </div>
      
      <h3>2. Run the backend server</h3>
      <div className="code-block">
        <p>Make sure you have Flask and dependencies installed:</p>
        <pre>pip install flask flask-cors</pre>
        
        <p>Then run the server:</p>
        <pre>python server.py</pre>
      </div>
      
      <h3>3. Run the frontend</h3>
      <div className="code-block">
        <p>In a separate terminal, run:</p>
        <pre>npm start</pre>
      </div>
      
      <p>
        After completing these steps, refresh this page. The application should 
        detect the audio-separator installation and be ready to use.
      </p>
      
      <p>
        For more details, refer to the{' '}
        <a 
          href="https://github.com/nomadkaraoke/python-audio-separator" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          python-audio-separator GitHub repository
        </a>.
      </p>
    </div>
  );
};

export default Installation; 