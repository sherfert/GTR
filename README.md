Prerequisites
=============
1. Clone the repository
2. Run 'git submodule init' and 'git submodule update'
3. Have node v6.0.0a and npm v3.8.6 or newer  installed
4. Navigate to the folders 'differential-testing-engine', 'differential-testing-engine/jalangi2', 'gtr', and 'program-generation'. Run 'npm install' in each.

Reducing PY files
=================
1. Navigate to the folder 'gtr'
2. Run 'node python-reducer.js'
3. To gather statistics, run


Reducing JS files
=================
1. Change the __config.js__ file so that it includes these lines, which may be currently commented or different:
- treeProvider: __dirname + "/js-ast/jsAstProvider",
- treeGenerator: __dirname + "/js-ast/jsAstGenerator",
- fileType: "JS",
- corpusDir: __dirname + "/corpusForTestingJS",
2. All programs that will be reduced are placed in differential-testing-engine/inconsistentCode/
3. Adapt differential-testing-engine/server/server-reducer.js at the bottom to run those algorithms of interest.
4. Open Firefox 25 and Chrome 48
5. Run in ./differential-testing-engine/: node server/server-reducer
   Always double-check the result. There is some non-determinism stemming from the browsers.
6. To gather statistics after the reductions are done, run in ./differential-testing-engine/: node util/createStats
   The statistics are placed in differential-testing-engine/inconsistentCode/stats




Inferring knowledge
===================
1. Configure the __config.js__ to use either JavaScript or Python
2. Run in ./program-generation: node learningGraph.js
   This places the inferred knowledge in ./program-generation/results/inferredKnowledge/
   It also places a learning curve graph there
3. To combine the csv files from both JS and PY, use ./dd-results/plot-combined.gnuplot
   You have to move the two csv files to that folder and rename them appropriately