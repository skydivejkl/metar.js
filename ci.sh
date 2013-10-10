#!/bin/sh

set -eu
set -x

echo "Building metar.js"
echo "Running as $(whoami)"
echo "Running from $(pwd)"

sudo apt-get install -y python-software-properties
sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs -y
npm install
npm test
