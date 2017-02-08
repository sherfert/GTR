// Author: Satia Herfert

/**
 * Compares all python test files with different algorithms.
 */
(function() {
    var fs = require('fs');
    var jsonfile = require('jsonfile');

    var pyTreeProvider = require('../program-generation//py-ast/pyAstProvider');
    var pyTreeGenerator = require('../program-generation//py-ast/pyAstGenerator');
    var inputTester = require("./tree-reducer/inputTester");

    var execWithCode = require("./tree-reducer/ddMinTree").executeWithCode;
    var hdd = require("./tree-reducer/hdd");
    var gtrAlgo = require("./tree-reducer/gtr");
    var ddminLine = require("./tree-reducer/ddMinLine").ddminLine;
    var ddminChar = require("./tree-reducer/ddMinChar").ddminChar;


    /**
     * Reduces the code of one file using HDD (or other tree algorithm) to a hopefully smaller piece of code
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
        var code2tree2code = pyTreeGenerator.treeToCode(pyTreeProvider.codeToTree(pycode));
        if(tester.test(code2tree2code) == "pass") {
            console.log("The crash cannot be reproduced after code->tree->code conversion. Aborting.");
            return;
        }

        var newCode = tester.runTest(pycode);

        // Create an results object if inexistant
        if(!fileState.results) {
            fileState.results = {};
        }

        fileState.results[algoPrefix] = {};
        fileState.results[algoPrefix].minCode  = newCode;
        fileState.results[algoPrefix].size  = newCode.length;
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

    /**
     * Compares all files with different algorithms.
     */
    function runTests() {
        // DDMin char
        //reduceAllFiles(ddminChar, "DD char-based", false);
        // DDMin line
        reduceAllFiles(ddminLine, "DD line-based", false);

        // HDD and the like
        reduceAllFiles(hdd.hdd, "HDD", true);
        reduceAllFiles(hdd.hddStar, "HDD*", true);

        var gtr = (pTree, pTest) => gtrAlgo.gtr("PY", pTree, pTest, false);
        reduceAllFiles(gtr, "GTR", true);
         var gtrS = (pTree, pTest) => gtrAlgo.gtrStar("PY", pTree, pTest, false);
        reduceAllFiles(gtrS, "GTR*", true);
        var gtr2 = (pTree, pTest) => gtrAlgo.gtr("PY", pTree, pTest, true);
        reduceAllFiles(gtr2, "GTR (no language information)", true);
    }

    runTests();

})();