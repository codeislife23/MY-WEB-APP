#!/bin/bash

# Audio Separator App Starter Script
# This script sets up and runs both the frontend and backend for the Audio Separator application.

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Audio Separator App Starter Script     ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check for required tools
echo -e "\n${YELLOW}Checking for required tools...${NC}"

if ! command_exists python3; then
  echo -e "${RED}Python 3 is not installed. Please install Python 3 and try again.${NC}"
  exit 1
fi

if ! command_exists pip3; then
  echo -e "${YELLOW}pip3 not found, checking for pip...${NC}"
  if ! command_exists pip; then
    echo -e "${RED}pip is not installed. Please install pip and try again.${NC}"
    exit 1
  fi
fi

if ! command_exists node; then
  echo -e "${RED}Node.js is not installed. Please install Node.js and try again.${NC}"
  exit 1
fi

if ! command_exists npm; then
  echo -e "${RED}npm is not installed. Please install npm and try again.${NC}"
  exit 1
fi

# Check for python3-venv package
if ! dpkg -l | grep -q python3-venv; then
  echo -e "${YELLOW}python3-venv package is not installed. Installing...${NC}"
  sudo apt-get update && sudo apt-get install -y python3-venv
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install python3-venv. Please install it manually:${NC}"
    echo -e "${YELLOW}sudo apt-get install python3-venv${NC}"
    exit 1
  fi
  echo -e "${GREEN}python3-venv installed successfully.${NC}"
fi

echo -e "${GREEN}All required tools are installed.${NC}"

# Create virtual environment if it doesn't exist
echo -e "\n${YELLOW}Setting up Python virtual environment...${NC}"
if [ ! -d "venv" ]; then
  python3 -m venv venv
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to create virtual environment. Please ensure python3-venv is installed.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Virtual environment created.${NC}"
else
  echo -e "${GREEN}Virtual environment already exists.${NC}"
fi

# Activate virtual environment with absolute path to handle activation issues
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/venv/bin/activate" ]; then
  source "$SCRIPT_DIR/venv/bin/activate"
  echo -e "${GREEN}Virtual environment activated.${NC}"
else
  echo -e "${RED}Virtual environment activation script not found at $SCRIPT_DIR/venv/bin/activate${NC}"
  echo -e "${YELLOW}Recreating virtual environment...${NC}"
  rm -rf venv
  python3 -m venv venv
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to recreate virtual environment.${NC}"
    exit 1
  fi
  source "$SCRIPT_DIR/venv/bin/activate"
  echo -e "${GREEN}Virtual environment recreated and activated.${NC}"
fi

# Verify virtual environment is active
if [ -z "$VIRTUAL_ENV" ]; then
  echo -e "${RED}Virtual environment activation failed.${NC}"
  exit 1
fi

# Install Python dependencies
echo -e "\n${YELLOW}Installing Python dependencies...${NC}"
pip install -r requirements.txt
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to install Python dependencies.${NC}"
  exit 1
fi
echo -e "${GREEN}Python dependencies installed.${NC}"

# Install Node.js dependencies
echo -e "\n${YELLOW}Installing Node.js dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
  echo -e "${RED}Failed to install Node.js dependencies.${NC}"
  exit 1
fi
echo -e "${GREEN}Node.js dependencies installed.${NC}"

# Check if audio-separator is installed
echo -e "\n${YELLOW}Checking audio-separator installation...${NC}"
if python -c "import audio_separator" &> /dev/null; then
  echo -e "${GREEN}audio-separator is installed.${NC}"
else
  echo -e "${YELLOW}Installing audio-separator...${NC}"
  pip install audio-separator[cpu]
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install audio-separator.${NC}"
    exit 1
  fi
  echo -e "${GREEN}audio-separator installed.${NC}"
fi

# Create necessary directories if they don't exist
echo -e "\n${YELLOW}Creating necessary directories...${NC}"
mkdir -p uploads outputs
echo -e "${GREEN}Directories created/verified.${NC}"

# Function to find an available port
find_available_port() {
  local port=$1
  while netstat -tuln | grep -q ":$port "; do
    echo -e "${YELLOW}Port $port is already in use. Trying port $((port+1))...${NC}"
    port=$((port+1))
  done
  echo $port
}

# Find available ports for Flask and React
FLASK_PORT=$(find_available_port 5000)
REACT_PORT=$(find_available_port 3000)

# Start backend server in the background
echo -e "\n${YELLOW}Starting Flask backend server on port $FLASK_PORT...${NC}"
python server.py --port $FLASK_PORT > flask.log 2>&1 &
FLASK_PID=$!
echo -e "${GREEN}Flask server started with PID: $FLASK_PID${NC}"

# Wait a moment to ensure the Flask server is running
echo -e "${YELLOW}Waiting for Flask server to initialize...${NC}"
sleep 3

# Check if the Flask server is actually running
if ! ps -p $FLASK_PID > /dev/null; then
  echo -e "${RED}Flask server failed to start. Checking flask.log for details...${NC}"
  cat flask.log
  exit 1
fi

echo -e "${GREEN}Flask server is running.${NC}"

# Modify package.json proxy if Flask port is not 5000
if [ "$FLASK_PORT" != "5000" ]; then
  echo -e "${YELLOW}Updating React proxy to use port $FLASK_PORT...${NC}"
  # Create a temporary file with the updated proxy
  sed "s/\"proxy\": \"http:\/\/localhost:[0-9]*\"/\"proxy\": \"http:\/\/localhost:$FLASK_PORT\"/" package.json > package.json.tmp
  mv package.json.tmp package.json
  echo -e "${GREEN}React proxy updated.${NC}"
fi

# Start frontend in a new terminal or in the background with the chosen port
echo -e "\n${YELLOW}Starting React frontend on port $REACT_PORT...${NC}"
PORT=$REACT_PORT npm start > react.log 2>&1 &
REACT_PID=$!
echo -e "${GREEN}React app started with PID: $REACT_PID${NC}"

# Wait a moment to ensure the React app is running
echo -e "${YELLOW}Waiting for React app to initialize...${NC}"
sleep 5

# Check if the React app is actually running
if ! ps -p $REACT_PID > /dev/null; then
  echo -e "${RED}React app failed to start. Checking react.log for details...${NC}"
  cat react.log
  echo -e "${RED}Stopping Flask server...${NC}"
  kill $FLASK_PID
  exit 1
fi

echo -e "${GREEN}React app is running.${NC}"

# Print access information
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${GREEN}Application is now running!${NC}"
echo -e "${GREEN}Access the frontend at: ${BLUE}http://localhost:$REACT_PORT${NC}"
echo -e "${GREEN}Backend API is available at: ${BLUE}http://localhost:$FLASK_PORT/api${NC}"
echo -e "${BLUE}=========================================${NC}"

# Save the PIDs to a file for the stop script
echo "$FLASK_PID $REACT_PID" > .app_pids

# Instructions to stop the servers
echo -e "\n${YELLOW}To stop the servers, press Ctrl+C or run:${NC}"
echo -e "./stop-app.sh"

# Wait for user input to keep the script running
echo -e "\n${YELLOW}Press Ctrl+C to stop the servers...${NC}"
wait 