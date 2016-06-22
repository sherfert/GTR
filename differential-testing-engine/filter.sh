#!/bin/bash
mkdir -p good
for f in *.json; do
  if [ $(cat $f | grep -c '\(web worker timed out\|IID\)') -eq 0 ]; then
    cp $f good/$f && cp ${f:0:(-2)} good/${f:0:(-2)};
  fi
done
