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
6. To gather statistics after the reductions are done, run in ./differential-testing-engine/: node util/createStats
   The statistics are placed in differential-testing-engine/inconsistentCode/stats

Reducing PY files
=================
1. Change the __config.js__ file so that it includes these lines, which may be currently commented or different:
- treeProvider: __dirname + "/py-ast/pyAstProvider",
- treeGenerator: __dirname + "/py-ast/pyAstGenerator",
- fileType: "PY",
- corpusDir: __dirname + "/corpusForTestingPy",
2. Adapt program-generation/python-reducer.js  to run those algorithms of interest, and for those files of interest.
   The files that can be used are placed in program-generation/tree-reducer/input/python/
   There is a strange bug that makes this crash if two many child processes are spawned. Therefore, do not choose too many algorithms/files at once.
3. Run in ./program-generation: node python-reducer
4. This already gathers statistics that are placed in program-generation/tree-reducer/input/python/stats

Random program generation
===========================
Given a corpus of code, the approach extracts probabilistic relations and uses them to generate new code.
The generated programs can have myriad applications. Here, we use them to differentially test JS engines
of browsers.

Usage
-----
1. Go to the folder 'program-generation'
        - Run 'npm install'
        - Put any JS file in 'corpusForTestingJS'
        - Run 'node main.js'
        - Go to the folder called 'results' to see the results of the run
2. Configurations can be made in 'config.json'

(Tested in Ubuntu 16.04 LTS, node version v5.11.0 & npm version 3.8.6)

Differential Testing Engine
===========================

A differential testing engine that executes given JavaScript programs in multiple browsers and compares their result. For a particular JavaScript program, possible outcomes are
 * CONSISTENT, if the program behaves the same in all browsers
 * INCONSISTENT, if the behavior varies across browsers
 * NON-DETERMINISTIC, if the behavior varies in a single browser
 * SYNTAX_ERROR, if the program is syntactically incorrect

Usage
-----

 1. Go to the 'differential-testing-engine' directory.
        - Run 'npm install'
        - Get jalangi ' git clone https://github.com/Samsung/jalangi2.git '
        - Go to the jalangi2 directory. Run 'npm install'. Run the tests.

 2. Start the server with 'node server/server.js'. Kill it using Ctrl+C

 3. Open as many different browsers as you want. In each, go to 'http://localhost:4000/'.

 4. Copy .js files into the 'generatedCode' directory. The engine will execute each file multiple times in each browser and summarize its result into .json files.

 5. Several configurations can be made using the __config.js__ file.

(Tested in Ubuntu 16.04 LTS, node version v5.11.0 & npm version 3.8.6)
