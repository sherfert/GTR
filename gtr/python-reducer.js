// Author: Satia Herfert

/**
 * Compares all python test files with different algorithms.
 */
(function() {
    var fs = require('fs');
    var jsonfile = require('jsonfile');
    var minimist = require('minimist');

    var pyTreeProvider = require('../program-generation/py-ast/pyAstProvider');
    var pyTreeGenerator = require('../program-generation/py-ast/pyAstGenerator');
    var inputTester = require("./tree-reducer/inputTester");

    var execWithCode = require("./tree-reducer/ddMinTree").executeWithCode;
    var hdd = require("./tree-reducer/hdd");
    var gtrAlgo = require("./tree-reducer/gtr");
    var ddminLine = require("./tree-reducer/ddMinLine").ddminLine;
    var ddminChar = require("./tree-reducer/ddMinChar").ddminChar;


    /**
     * Reduces the code of one file a reduction algorithm to a hopefully smaller piece of code
     * that exposes the same bug.
     *
     * @param fileState the fileState of the file to minimize.
     * @param algorithm a function reference to the algorithm to use
     * @param {String} algoPrefix the prefix to use for the given algorithm for the JSON file
     * @param treeAlgo true, if algorithm refers to a tree-based algorith; false, if it refers to a code-based algorithm
     */
    function reduce(fileState, algorithm, algoPrefix, treeAlgo) {
        console.log("Starting reduction of " + fileState.fileName);

        // DD algorithm
        var ddAlgo;
        if(treeAlgo) {
            ddAlgo = function(code, test) {
                return execWithCode(pyTreeProvider, pyTreeGenerator, algorithm, code, test);
            };
        } else {
            ddAlgo = function(code, test) {
                return algorithm(code, test);
            };
        }

        var pycode = "" + fs.readFileSync(fileState.fileName);
        fileState.origSize = pycode.length;


        var tester = new inputTester.PyCrashTester(fileState.command, ddAlgo);
        var c2t = pyTreeProvider.codeToTree(pycode);
        fileState.origSizeNodes = c2t.nbNodes();
        var code2tree2code = pyTreeGenerator.treeToCode(c2t);
        if(tester.test(code2tree2code) == "pass") {
            console.log("The crash cannot be reproduced after code->tree->code conversion. Aborting.");
            return;
        }

        var newCode = tester.runTest(pycode);
        var newTree = pyTreeProvider.codeToTree(newCode);

        // Create a results object if inexistant
        if(!fileState.results) {
            fileState.results = {};
        }

        fileState.results[algoPrefix] = {};
        fileState.results[algoPrefix].minCode  = newCode;
        fileState.results[algoPrefix].size  = newCode.length;
        fileState.results[algoPrefix].sizeNodes  = newTree.nbNodes();
        fileState.results[algoPrefix].testsRun = tester.testsRun;
        fileState.results[algoPrefix].timeTaken = tester.timeTaken;
        fileState.results[algoPrefix].timeInOracle = tester.timeInOracle;
        console.log("Num tests: " + tester.testsRun + ` in ${fileState.results[algoPrefix].timeTaken} nanoseconds`);

        // Write to file
        var resultFileName = fileState.fileName.replace(new RegExp('py$'), 'json');// .py --> .json
        fs.writeFileSync(resultFileName, JSON.stringify(fileState, 0, 2));

        console.log("Reduction done of " + fileState.fileName);
    }

    /**
     * Reducing all files found, one after the other.
     *
     * @param algorithm a function reference to the algorithm to use
     * @param {String} algoPrefix the prefix to use for the given algorithm for the JSON file
     * @param treeAlgo true, if algorithm refers to a tree-based algorith; false, if it refers to a code-based algorithm
     */
    function reduceAllFiles(algorithm, algoPrefix, treeAlgo) {
        var totalTimeMS = 0;
        for(var i = 0; i < allPyTests.length; i++) {
            reduce(allPyTests[i], algorithm, algoPrefix, treeAlgo);
            // Accumulate total time taken
            totalTimeMS += (allPyTests[i].results[algoPrefix].timeTaken / 1000000);
        }
        console.log(`Total time: ${totalTimeMS.toFixed(0)} milliseconds with ${algoPrefix}`);
    }

    var codeDir = "tree-reducer/input/python";

    // When having either too many files or too many algorithms
    // (In essence, too many synchronously spawned childs)
    // node crashes. Sadly, I am the only one on the Internet
    // with this particular failure.
    var allPyTests = [
        getFileState(codeDir + "/ackermann.py", "python3.4"),
        getFileState(codeDir + "/alloc.py", "python2.7"),
        getFileState(codeDir + "/dict.py", "python2.7"),
        getFileState(codeDir + "/itertools.py", "python2.7"),
        getFileState(codeDir + "/mroref.py", "python2.7"),
        getFileState(codeDir + "/recursion.py", "python3.4"),
        getFileState(codeDir + "/so.py", "python2.7")
    ];

    /**
     * Gets a fileState by reading the JSON, or creates a new one.
     * @param fileName the name of the python file
     * @param command the python command
     * @returns {*} the FileState
     */
    function getFileState(fileName, command) {
        var resultFileName = fileName.replace(new RegExp('py$'), 'json');// .py --> .json
        try {
            return jsonfile.readFileSync(resultFileName)
        } catch(e) {
            return { fileName: fileName, command: command};
        }
    }

    function getFileStateFromName(name) {
        if(name == "ackermann.py") {
            return getFileState(codeDir + "/ackermann.py", "python3.4");
        } else if(name == "alloc.py") {
            return getFileState(codeDir + "/alloc.py", "python2.7");
        } else if(name == "dict.py") {
            return getFileState(codeDir + "/dict.py", "python2.7");
        } else if(name == "itertools.py") {
            return getFileState(codeDir + "/itertools.py", "python2.7");
        } else if(name == "mroref.py") {
            return getFileState(codeDir + "/mroref.py", "python2.7");
        } else if(name == "recursion.py") {
            return getFileState(codeDir + "/recursion.py", "python3.4");
        } else if(name == "so.py") {
            return getFileState(codeDir + "/so.py", "python2.7");
        }
    }

    /**
     * Compares all files with different algorithms.
     */
    function runTests() {
        var argv = minimist(process.argv.slice(2));
        var algoArg = argv.a;
        var fileArg = argv.f;

        if(!fileArg || !algoArg || (algoArg != "DDC" && algoArg != "DDL" && algoArg != "HDD" && algoArg != "HDD*"
            && algoArg != "GTR" && algoArg != "GTR*" && algoArg != "GTRX")) {
            console.log("Usage: 'node python-reducer.js -a algo -f file'");
            console.log("Supported algorithms: 'DDC', 'DDL', 'HDD', 'HDD*', 'GTR', 'GTR*', 'GTRX'. Default: 'GTR'");
            console.log("Supported files: ackermann.py, alloc.py, dict.py, itertools.py, mroref.py, recursion.py, so.py");
            return;
        }

        var algo;
        var name;
        var treeAlgo;
        if(algoArg == "DDC") {
            algo = ddminChar;
            name = "DD char-based";
            treeAlgo = false;
        } else if(algoArg == "DDL") {
            algo = ddminLine;
            name = "DD line-based";
            treeAlgo = false;
        } else if(algoArg == "HDD") {
            algo = hdd.hdd;
            name = "HDD";
            treeAlgo = true;
        } else if(algoArg == "HDD*") {
            algo = hdd.hddStar;
            name = "HDD*";
            treeAlgo = true;
        } else if(algoArg == "GTR") {
            algo = (pTree, pTest) => gtrAlgo.gtr("PY", pTree, pTest, false);
            treeAlgo = true;
            name = "GTR";
        } else if(algoArg == "GTR*") {
            algo = (pTree, pTest) => gtrAlgo.gtrStar("PY", pTree, pTest, false);
            treeAlgo = true;
            name = "GTR*";
        } else if(algoArg == "GTRX") {
            algo = (pTree, pTest) => gtrAlgo.gtr("PY", pTree, pTest, true);
            treeAlgo = true;
            name = "GTR (no language information)";
        }

        reduce(getFileStateFromName(fileArg), algo, name, treeAlgo);
    }

    runTests();

})();