#!/bin/sh

set -eu

sudo apt-get install python-software-properties
sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs -y
npm install
npm test
