#!/bin/bash

echo "--- Shifa System Termux Setup ---"
echo "Updating packages..."
pkg update && pkg upgrade -y

echo "Installing dependencies (Node.js, Python, Build Tools)..."
pkg install nodejs-lts python make clang -y

echo "Installing NPM packages..."
npm install

echo "Building the application..."
npm run build

echo "--------------------------------"
echo "Setup Complete!"
echo "To start the system, run: npm run start"
echo "Then open http://localhost:3000 in your browser."
echo "--------------------------------"
