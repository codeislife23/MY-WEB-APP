# Audio Separator

A modern web application for separating audio tracks into individual stems (vocals, drums, bass, etc.) using machine learning models.

## Features

- **Multi-Stem Separation**: Split audio into vocals, drums, bass, and other instruments
- **Format Conversion**: Download stems in multiple formats (WAV, MP3, FLAC, AAC)
- **Audio Preview**: Listen to separated stems directly in the browser
- **Modern UI**: Clean, intuitive interface with visual feedback
- **Progress Tracking**: Real-time progress monitoring during separation

## Technology Stack

- **Frontend**: React.js
- **Backend**: Python Flask
- **Audio Processing**: Various ML models for audio separation

## Getting Started

### Prerequisites

- Node.js (v14+)
- Python 3.8+
- FFmpeg (for audio conversion)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/codeislife23/MY-WEB-APP.git
   cd MY-WEB-APP
   ```

2. Install backend dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```
   npm install
   ```

### Running the Application

1. Start the Flask backend:
   ```
   python server.py
   ```

2. In a separate terminal, start the React frontend:
   ```
   npm start
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

1. Select an audio separation model from the dropdown
2. Choose the separation type (vocals/instruments or multi-stem)
3. Upload an audio file (MP3, WAV, FLAC, etc.)
4. Click "Separate Audio" and wait for processing to complete
5. Preview the separated stems using the built-in audio player
6. Download individual stems in your preferred format

## Screenshot

![Audio Separator Screenshot](screenshot.png)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Audio separation models from various sources
- React Dropzone for file uploads
- FFmpeg for audio conversion
# MY-WEB-APP
