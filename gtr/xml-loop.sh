#!/usr/bin/env bash
algos=( DDL HDD HDD* GTR GTR* )

for f in tree-reducer/input/xml/*
do
    if [[ $f == *.json ]]; then
        continue
    fi
    for a in "${algos[@]}"
    do
        node xml-reducer.js -a $a -f "$(basename $f)"
    done
done