#!/bin/bash

# Audio Separator App Stop Script
# This script stops both the frontend and backend servers for the Audio Separator application.

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Audio Separator App Stop Script        ${NC}"
echo -e "${BLUE}=========================================${NC}"

# Find and kill the Flask server process
echo -e "\n${YELLOW}Stopping Flask backend server...${NC}"
FLASK_PID=$(lsof -i:5000 -t 2>/dev/null)
if [ -z "$FLASK_PID" ]; then
  echo -e "${YELLOW}No Flask server running on port 5000.${NC}"
else
  echo -e "${YELLOW}Killing Flask server process: $FLASK_PID${NC}"
  kill $FLASK_PID 2>/dev/null
  # Wait a moment and check if it's still running
  sleep 2
  if ps -p $FLASK_PID > /dev/null 2>&1; then
    echo -e "${YELLOW}Process still running, using kill -9...${NC}"
    kill -9 $FLASK_PID 2>/dev/null
  fi
  echo -e "${GREEN}Flask server stopped.${NC}"
fi

# Find and kill the React app process
echo -e "\n${YELLOW}Stopping React frontend...${NC}"
REACT_PID=$(lsof -i:3000 -t 2>/dev/null)
if [ -z "$REACT_PID" ]; then
  echo -e "${YELLOW}No React app running on port 3000.${NC}"
else
  echo -e "${YELLOW}Killing React app process: $REACT_PID${NC}"
  kill $REACT_PID 2>/dev/null
  # Wait a moment and check if it's still running
  sleep 2
  if ps -p $REACT_PID > /dev/null 2>&1; then
    echo -e "${YELLOW}Process still running, using kill -9...${NC}"
    kill -9 $REACT_PID 2>/dev/null
  fi
  echo -e "${GREEN}React app stopped.${NC}"
fi

echo -e "\n${GREEN}Audio Separator app has been stopped.${NC}"
echo -e "${BLUE}=========================================${NC}" 