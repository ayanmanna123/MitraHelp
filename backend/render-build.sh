#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Node dependencies
npm install

# Print versions for debugging
python3 --version
pip3 --version

# Install Python and dependencies
if [ -f requirements.txt ]; then
  echo "Installing Python dependencies..."
  python3 -m pip install --upgrade pip
  python3 -m pip install -r requirements.txt
fi
