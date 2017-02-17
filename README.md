Prerequisites
=============
1. Clone the repository
2. Have node v6.0.0a and npm v3.8.6 or newer installed
3. Have python 3.4.3 and 2.7.6 installed
4. Install the following Python modules (recommended through pip): astor, numpy
5. Run './init.sh'

Folder structure
================
- **differential-testing-engine** Needed to run the JavaScript experiment, 
  testing for inconsitent behavior across browsers. 
  - **inconsistentCode** Files for the JavaScript experiment
- **gtr** Implementation of GTR and other reduction algorithms.
  - **examples** Two exmaple files that can be reduced and an exmaple oracle
  - **tree-reducer** The algorithms
    - **input/python** Files for the Python experiment
- **program-generation** Part of TreeFuzz. Needed to infer knowledge
  and to convert JavaScript and Python files to trees.
  
Result presentation
===================
When executing one of our two experiment (reducing PY files or reducing JS files), the result
is presented with CSV-files. The folder where these are placed is indicated below. The CSV
files are the ones we used to create the graphs in our paper and to calculate statistics like
the median reduction. The following statistics are gathered:
- **stats-inoracle.csv** For each file and algorithm, the time percent of time spent inside the oracle
- **stats-reduction.csv** For each file and algorithm, the percent reduction.
- **stats-size.csv** For each file and algorithm, the file size after running the algorithm.
- **stats-tests.csv** For each file and algorithm, the number of oracle invocations.
- **stats-time.csv** For each file and algorithm, the actual runtime.

Reducing PY files
=================
1. Navigate to the folder 'gtr'
2. Run './python-loop.sh'. This creates JSON files with information for each algoritm in 'gtr/tree-reducer/input/python'. This will take up to a couple of hours.
3. To gather statistics, run 'node createPyStats.js'. They will be placed in 'gtr/tree-reducer/input/python/stats'


Reducing JS files
=================
1. Navigate to the folder 'differential-testing-engine'
2. Run 'node server/server-reducer.js'. This creates JSON files with information for each algoritm in 'differential-testing-engine/inconsistentCode/'
   When prompted by chrome before it launches, hit OK. This will take a long time in a VM (calculate multiple hours).
3. To gather statistics, run 'node util/createStats.js'. They will be placed in 'differential-testing-engine/inconsistentCode/stats'


Reducing files with your own oracle
===================================
1. Checkout the example oracle 'gtr/example/grepOracle.sh'.
2. Navigate to the folder 'gtr'
3. Example 1 'node shell-reducer.js -a HDD -l PY examples/grepOracle.sh examples/ex1.py examples/output.py' reduces ex1.py with HDD using the grep oracle.
4. Example 2 'node shell-reducer.js -a GTR -l JS examples/grepOracle.sh examples/ex2.js examples/output.js' reduces ex2.js with GTR using the grep oracle.
5. You can vary which algorithm to use and use your own files and oracles.


Inferring knowledge
===================
1. Navigate to the folder 'gtr'
2. Run 'node analyzeCorpus.js PY' or 'node analyzeCorpus.js JS'
   This places the inferred knowledge in ./program-generation/results/inferredKnowledge/
   It also places a learning curve csv there.