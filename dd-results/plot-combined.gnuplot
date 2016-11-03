set terminal png size 2048,1200 enhanced font 'Verdana,30'
set output 'combined.png'
set datafile separator ','
set key bottom right
set xlabel 'Number of JS files'
set x2label 'Number of PY files'
set xtics nomirror
set x2tics
set ylabel 'Number of transformations found'
plot 'learning-graph-js.csv' using 1:2 with lines title 'JavaScript', \
     'learning-graph-py.csv' using 1:2 axes x2y1 with lines title 'Python'