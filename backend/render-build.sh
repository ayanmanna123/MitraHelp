#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Node dependencies
npm install

# Install Python and dependencies
# Note: Render's Node environments include Python 3
if [ -f requirements.txt ]; then
  echo "Installing Python dependencies..."
  pip install --upgrade pip
  pip install -r requirements.txt
fi
