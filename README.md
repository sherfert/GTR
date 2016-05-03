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
