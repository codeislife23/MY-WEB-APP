# Audio Separator Setup Guide

This guide explains how to set up and run the Audio Separator application, which consists of a Flask backend and a React frontend.

## Prerequisites

Before you begin, make sure you have the following installed:

- Python 3.8 or higher
- Node.js 14 or higher
- npm (comes with Node.js)
- pip (Python package manager)

## Quick Start

For the easiest setup, use the provided scripts:

1. Make the scripts executable:
   ```bash
   chmod +x start-app.sh stop-app.sh
   ```

2. Start the application:
   ```bash
   ./start-app.sh
   ```

3. To stop the application:
   ```bash
   ./stop-app.sh
   ```

The start script will:
- Create a Python virtual environment
- Install all required Python and Node.js dependencies
- Start both the backend and frontend servers
- Print the URLs to access the application

## Manual Setup

If you prefer to set up manually or the script doesn't work for your environment:

### Backend Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the Flask server:
   ```bash
   python server.py
   ```

The Flask server will run on http://localhost:5000.

### Frontend Setup

1. Install Node.js dependencies:
   ```bash
   npm install
   ```

2. Start the React development server:
   ```bash
   npm start
   ```

The React app will run on http://localhost:3000.

## Application Structure

- `server.py`: Flask backend server
- `src/`: React frontend code
  - `components/`: React components
  - `components/ui/`: UI components with dark theme and red highlights
- `requirements.txt`: Python dependencies
- `package.json`: Node.js dependencies

## Troubleshooting

If you encounter issues:

1. Check if the servers are running:
   ```bash
   lsof -i :3000  # Check React server
   lsof -i :5000  # Check Flask server
   ```

2. Check the logs:
   ```bash
   cat flask.log  # Flask server logs
   cat react.log  # React app logs
   ```

3. Make sure all dependencies are installed:
   ```bash
   pip list  # Should include flask, flask-cors, audio-separator
   npm list --depth=0  # Should include react, tailwindcss, etc.
   ```

4. If you see "Checking installation status..." forever, the Flask backend might not be running or accessible. Check if it's running on port 5000.

## Using the Application

Once both servers are running:

1. Open your browser and go to http://localhost:3000
2. Upload an audio file using the interface
3. Select separation options and process the audio
4. Download the separated tracks 