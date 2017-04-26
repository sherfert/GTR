#!/bin/bash

# Untaring the browsers
cat browsers.tar.gz.* | tar xzvf -

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

# Prepare pdf-scrutinizer
mkdir pdf-scrutinizer/lib/
cd pdf-scrutinizer/lib/
git clone https://github.com/florianschmitt/pdfbox.git
wget -P pdfbox/pdfbox/src/main/resources/org/apache/pdfbox/resources/ http://partners.adobe.com/public/developer/en/opentype/glyphlist.txt
git clone https://github.com/florianschmitt/rhino-mirror.git
git clone https://github.com/joelhockey/jcodings.git
cd ..
mvn package assembly:single -DskipTests
cd ..