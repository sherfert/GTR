#!/usr/bin/env bash
algos=( DDL HDD HDD* GTR GTR* GTRX )
files=( ackermann.py alloc.py dict.py itertools.py mroref.py recursion.py so.py )

for a in "${algos[@]}"
do
    for f in "${files[@]}"
    do
        node python-reducer.js -a $a -f $f
    done
done