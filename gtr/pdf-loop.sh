#!/usr/bin/env bash
algos=( DDL HDD HDD* GTR GTR* GTRX )

for a in "${algos[@]}"
do
    for f in tree-reducer/input/pdf/*
    do
        node pdf-reducer.js -a $a -f "$(basename $f)"
    done
done