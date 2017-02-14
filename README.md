Prerequisites
=============
1. Clone the repository
2. Have node v6.0.0a and npm v3.8.6 or newer installed
3. Run './init.sh'

Reducing PY files
=================
1. Navigate to the folder 'gtr'
2. Run 'node python-reducer.js'. This creates JSON files with information for each algoritm in 'gtr/tree-reducer/input/python'
3. To gather statistics, run 'node createPyStats.js'. They will be placed in 'gtr/tree-reducer/input/python/stats'


Reducing JS files
=================
1. Navigate to the folder 'differential-testing-engine'
2. Run 'node server/server-reducer.js'. This creates JSON files with information for each algoritm in 'differential-testing-engine/inconsistentCode/'
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