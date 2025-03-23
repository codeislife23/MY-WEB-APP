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

if ! command_exists pip; then
  echo -e "${RED}pip is not installed. Please install pip and try again.${NC}"
  exit 1
fi

if ! command_exists node; then
  echo -e "${RED}Node.js is not installed. Please install Node.js and try again.${NC}"
  exit 1
fi

if ! command_exists npm; then
  echo -e "${RED}npm is not installed. Please install npm and try again.${NC}"
  exit 1
fi

echo -e "${GREEN}All required tools are installed.${NC}"

# Create virtual environment if it doesn't exist
echo -e "\n${YELLOW}Setting up Python virtual environment...${NC}"
if [ ! -d "venv" ]; then
  python3 -m venv venv
  echo -e "${GREEN}Virtual environment created.${NC}"
else
  echo -e "${GREEN}Virtual environment already exists.${NC}"
fi

# Activate virtual environment
source venv/bin/activate
echo -e "${GREEN}Virtual environment activated.${NC}"

# Install Python dependencies
echo -e "\n${YELLOW}Installing Python dependencies...${NC}"
python3 -m pip install -r requirements.txt
echo -e "${GREEN}Python dependencies installed.${NC}"

# Install Node.js dependencies
echo -e "\n${YELLOW}Installing Node.js dependencies...${NC}"
npm install
echo -e "${GREEN}Node.js dependencies installed.${NC}"

# Check if audio-separator is installed
echo -e "\n${YELLOW}Checking audio-separator installation...${NC}"
if python3 -c "import audio_separator" &> /dev/null; then
  echo -e "${GREEN}audio-separator is installed.${NC}"
else
  echo -e "${YELLOW}Installing audio-separator...${NC}"
  python3 -m pip install audio-separator[cpu]
  echo -e "${GREEN}audio-separator installed.${NC}"
fi

# Create necessary directories if they don't exist
echo -e "\n${YELLOW}Creating necessary directories...${NC}"
mkdir -p uploads outputs
echo -e "${GREEN}Directories created/verified.${NC}"

# Start backend server in the background
echo -e "\n${YELLOW}Starting Flask backend server...${NC}"
python3 server.py > flask.log 2>&1 &
FLASK_PID=$!
echo -e "${GREEN}Flask server started with PID: $FLASK_PID${NC}"

# Wait a moment to ensure the Flask server is running
echo -e "${YELLOW}Waiting for Flask server to initialize...${NC}"
sleep 3

# Check if the Flask server is actually running
if ! ps -p $FLASK_PID > /dev/null; then
  echo -e "${RED}Flask server failed to start. Check flask.log for details.${NC}"
  echo -e "${YELLOW}You may need to run: ${NC}python3 -m pip install -r requirements.txt"
  exit 1
fi

echo -e "${GREEN}Flask server is running.${NC}"

# Start frontend in a new terminal or in the background
echo -e "\n${YELLOW}Starting React frontend...${NC}"
npm start > react.log 2>&1 &
REACT_PID=$!
echo -e "${GREEN}React app started with PID: $REACT_PID${NC}"

# Wait a moment to ensure the React app is running
echo -e "${YELLOW}Waiting for React app to initialize...${NC}"
sleep 5

# Check if the React app is actually running
if ! ps -p $REACT_PID > /dev/null; then
  echo -e "${RED}React app failed to start. Check react.log for details.${NC}"
  echo -e "${YELLOW}You may need to run: ${NC}npm install"
  # Kill Flask server if React failed to start
  kill $FLASK_PID
  exit 1
fi

echo -e "${GREEN}React app is running.${NC}"

# Print access information
echo -e "\n${BLUE}=========================================${NC}"
echo -e "${GREEN}Application is now running!${NC}"
echo -e "${GREEN}Access the frontend at: ${BLUE}http://localhost:3000${NC}"
echo -e "${GREEN}Backend API is available at: ${BLUE}http://localhost:5000/api${NC}"
echo -e "${BLUE}=========================================${NC}"

# Instructions to stop the servers
echo -e "\n${YELLOW}To stop the servers, press Ctrl+C or run:${NC}"
echo -e "kill $FLASK_PID $REACT_PID"

# Wait for user input to keep the script running
echo -e "\n${YELLOW}Press Ctrl+C to stop the servers...${NC}"
wait 