#!/bin/bash

# Initializig submodules
git submodule init
git submodule update

# Deleting a console.log in jalangi that we don't want
cd differential-testing-engine/jalangi2/src/js/instrument/
cp esnstrument.js tmp
cat tmp | grep -v "Failed to instrument" > esnstrument.js
rm tmp
cd ../../../../..

# Running npm install in various folders
cd differential-testing-engine
npm install
cd ..

cd differential-testing-engine/jalangi2
npm install
cd ../..

cd gtr
npm install
cd ..

cd program-generation
npm install
cd ..