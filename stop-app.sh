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

# Check for stored PIDs file
if [ -f ".app_pids" ]; then
  read FLASK_PID REACT_PID < .app_pids
  echo -e "${YELLOW}Found stored PIDs: Flask=$FLASK_PID, React=$REACT_PID${NC}"
else
  echo -e "${YELLOW}No stored PIDs found, will try to detect processes by port.${NC}"
  FLASK_PID=""
  REACT_PID=""
fi

# Find and kill the Flask server process
echo -e "\n${YELLOW}Stopping Flask backend server...${NC}"
if [ -n "$FLASK_PID" ] && ps -p $FLASK_PID > /dev/null 2>&1; then
  echo -e "${YELLOW}Killing Flask server process: $FLASK_PID${NC}"
  kill $FLASK_PID 2>/dev/null
  # Wait a moment and check if it's still running
  sleep 2
  if ps -p $FLASK_PID > /dev/null 2>&1; then
    echo -e "${YELLOW}Process still running, using kill -9...${NC}"
    kill -9 $FLASK_PID 2>/dev/null
  fi
  echo -e "${GREEN}Flask server stopped.${NC}"
else
  # If no PID from file or PID not running, try to find by port
  for port in {5000..5020}; do
    FLASK_PORT_PID=$(lsof -i:$port -t 2>/dev/null | grep -v "^$REACT_PID$" | head -1)
    if [ -n "$FLASK_PORT_PID" ]; then
      echo -e "${YELLOW}Found Flask server running on port $port with PID: $FLASK_PORT_PID${NC}"
      kill $FLASK_PORT_PID 2>/dev/null
      # Wait a moment and check if it's still running
      sleep 2
      if ps -p $FLASK_PORT_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Process still running, using kill -9...${NC}"
        kill -9 $FLASK_PORT_PID 2>/dev/null
      fi
      echo -e "${GREEN}Flask server stopped.${NC}"
      break
    fi
  done
  
  if [ -z "$FLASK_PORT_PID" ]; then
    echo -e "${YELLOW}No Flask server found running on ports 5000-5020.${NC}"
  fi
fi

# Find and kill the React app process
echo -e "\n${YELLOW}Stopping React frontend...${NC}"
if [ -n "$REACT_PID" ] && ps -p $REACT_PID > /dev/null 2>&1; then
  echo -e "${YELLOW}Killing React app process: $REACT_PID${NC}"
  kill $REACT_PID 2>/dev/null
  # Wait a moment and check if it's still running
  sleep 2
  if ps -p $REACT_PID > /dev/null 2>&1; then
    echo -e "${YELLOW}Process still running, using kill -9...${NC}"
    kill -9 $REACT_PID 2>/dev/null
  fi
  echo -e "${GREEN}React app stopped.${NC}"
else
  # If no PID from file or PID not running, try to find by port
  for port in {3000..3020}; do
    REACT_PORT_PID=$(lsof -i:$port -t 2>/dev/null | head -1)
    if [ -n "$REACT_PORT_PID" ]; then
      echo -e "${YELLOW}Found React app running on port $port with PID: $REACT_PORT_PID${NC}"
      kill $REACT_PORT_PID 2>/dev/null
      # Wait a moment and check if it's still running
      sleep 2
      if ps -p $REACT_PORT_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Process still running, using kill -9...${NC}"
        kill -9 $REACT_PORT_PID 2>/dev/null
      fi
      echo -e "${GREEN}React app stopped.${NC}"
      break
    fi
  done
  
  if [ -z "$REACT_PORT_PID" ]; then
    echo -e "${YELLOW}No React app found running on ports 3000-3020.${NC}"
  fi
fi

# Clean up PID file
if [ -f ".app_pids" ]; then
  rm .app_pids
  echo -e "${YELLOW}Removed stored PIDs file.${NC}"
fi

echo -e "\n${GREEN}Audio Separator app has been stopped.${NC}"
echo -e "${BLUE}=========================================${NC}" 