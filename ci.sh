#!/bin/sh

set -eu
set -x

sudo apt-get install python-software-properties
sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install nodejs -y --force-yes
npm install
npm test
