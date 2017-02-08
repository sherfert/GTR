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


Inferring knowledge
===================
1. Navigate to the folder 'gtr'
2. Run 'node analyzeCorpus.js PY' or 'node analyzeCorpus.js JS'
   This places the inferred knowledge in ./program-generation/results/inferredKnowledge/
   It also places a learning curve csv there.