#!/usr/bin/env bash
algos=( DDL HDD HDD* GTR GTR* )
if [[ "$1" = "1" ]]; then
    files=( 813708-2015-10-26.xml 723493-2014-11-24.xml 708439-2011-10-20.xml 684274-2012-05-14.xml 570945-2013-09-25.xml )
elif [[ "$1" = "2" ]]; then
    files=( 515091-2012-11-26.xml 503205-2014-06-09.xml 456028-2015-03-02.xml 413230-2015-02-11.xml 412942-2014-12-29.xml )
elif [[ "$1" = "3" ]]; then
    files=( 352543-2012-01-29.xml 251512-2014-07-06.xml 241678-2013-12-02.xml 238675-2013-12-08.xml 153603-2010-03-10.xml )
elif [[ "$1" = "4" ]]; then
    files=( 7231503-2016-07-31.xml 5727203-2016-11-15.xml 4812453-2017-01-02.xml 942489-2014-11-04.xml 849757-2011-04-26.xml )
fi

for f in "${files[@]}"
do
    if [[ $f == *.json ]]; then
        continue
    fi
    for a in "${algos[@]}"
    do
        node xml-reducer.js -a $a -f $f
    done
done
