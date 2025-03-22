# Audio Separator Frontend

A modern React web application that provides a user-friendly interface for the [python-audio-separator](https://github.com/nomadkaraoke/python-audio-separator) package, allowing you to separate audio tracks into vocals and instrumentals.

## Features

- Upload audio files in common formats (MP3, WAV, FLAC, OGG, M4A)
- Select from available separation models
- Download separated audio tracks (vocals and instrumentals)
- Simple and intuitive user interface

## Prerequisites

Before you can use this application, you need to:

1. Install Python 3.10 or newer
2. Install the audio-separator package
3. Have Node.js and npm installed

## Installation Instructions

### Step 1: Install Python Dependencies

First, install the audio-separator package. You have several options depending on your hardware:

#### CPU Version (any computer):

```bash
pip install "audio-separator[cpu]"
```

#### GPU Version (if you have an NVIDIA GPU with CUDA):

```bash
pip install "audio-separator[gpu]"
```

#### Using Conda:

```bash
conda install audio-separator -c pytorch -c conda-forge
```

### Step 2: Install Flask Backend Dependencies

Install the required Python packages for the backend server:

```bash
pip install flask flask-cors
```

### Step 3: Install Frontend Dependencies

Install the Node.js dependencies:

```bash
npm install
```

## Running the Application

You need to run both the backend Flask server and the frontend React app:

### Step 1: Start the Backend Server

```bash
python server.py
```

This will start the Flask server on port 5000.

### Step 2: Start the Frontend

In a new terminal window:

```bash
npm start
```

This will start the React development server, and your browser should automatically open to http://localhost:3000.

## How to Use

1. Ensure both the backend server and frontend are running
2. Upload an audio file (MP3, WAV, FLAC, OGG, or M4A format)
3. Select a separation model from the dropdown
4. Click "Separate Audio" to process the file
5. Once processing is complete, download the separated tracks

## Troubleshooting

### Backend Server Issues

- Make sure Python 3.10+ is installed
- Verify audio-separator is installed correctly by running `audio-separator --version`
- Check that Flask and flask-cors are installed
- Make sure no other service is using port 5000

### Frontend Issues

- Ensure Node.js and npm are installed
- Check that all dependencies were installed correctly with `npm install`
- Make sure the backend server is running

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [python-audio-separator](https://github.com/nomadkaraoke/python-audio-separator) - The core audio separation library
- [Ultimate Vocal Remover (UVR)](https://github.com/Anjok07/ultimatevocalremovergui) - Source of the models used for separation
