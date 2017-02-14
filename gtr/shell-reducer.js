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
    var jsTreeProvider = require('../program-generation/js-ast/jsAstProvider');
    var jsTreeGenerator = require('../program-generation/js-ast/jsAstGenerator');
    var ShellOracleTester = require("./tree-reducer/inputTester").ShellOracleTester;

    var execWithCode = require("./tree-reducer/ddMinTree").executeWithCode;
    var hdd = require("./tree-reducer/hdd");
    var gtrAlgo = require("./tree-reducer/gtr");
    var ddminLine = require("./tree-reducer/ddMinLine").ddminLine;
    var ddminChar = require("./tree-reducer/ddMinChar").ddminChar;


    /**
     * Reduces the code of one file using a reduction algorithm to a hopefully smaller piece of code
     * that exposes the same bug.
     *
     * @param algorithm a function reference to the algorithm to use
     * @param treeAlgo true, if algorithm refers to a tree-based algorith; false, if it refers to a code-based algorithm
     * @param shellCommand the shell command that servers as an oracle
     * @param fileName the name of the file to reduce
     * @param outFile where to write the reduced result
     * @param language "PY"/"JS"
     */
    function reduce(algorithm, treeAlgo, shellCommand, fileName, outFile, language) {
        console.log("Starting reduction");

        var postfix = "." + language.toLowerCase();
        var treeProvider;
        var treeGenerator;
        if(language == "PY") {
            treeProvider = pyTreeProvider;
            treeGenerator = pyTreeGenerator;
        } else {
            treeProvider = jsTreeProvider;
            treeGenerator = jsTreeGenerator;
        }

        // Reduction algorithm
        var ddAlgo;
        if(treeAlgo) {
            ddAlgo = function(code, test) {
                return execWithCode(treeProvider, treeGenerator, algorithm, code, test);
            };
        } else {
            ddAlgo = function(code, test) {
                return algorithm(code, test);
            };
        }

        var code = "" + fs.readFileSync(fileName);

        var tester = new ShellOracleTester(shellCommand, ddAlgo, postfix);
        if(treeAlgo) {
            var code2tree2code = treeGenerator.treeToCode(treeProvider.codeToTree(code));
            if (tester.test(code2tree2code) == "pass") {
                console.log("The crash cannot be reproduced after code->tree->code conversion. Aborting.");
                return;
            }
        }

        var newCode = tester.runTest(code);

        console.log("Reduction done");
        console.log("Oracle invocations: " + tester.testsRun);
        console.log(`Time taken: ${tester.timeTaken} nanoseconds`);
        console.log(`Time spent in the oracle: ${tester.timeInOracle} nanoseconds`);
        console.log("Size before reduction: " + code.length);
        console.log("Size after reduction: " + newCode.length);
        console.log("Writing minimized code to " + outFile);

        fs.writeFileSync(outFile, newCode);

    }

    /**
     * Reduces the file
     */
    function runTest() {
        var argv = minimist(process.argv.slice(2));

        var languageArg = argv.l || "PY";
        var algoArg = argv.a || "GTR";
        var oracleFile = argv._[0];
        var inFile = argv._[1];
        var outFile = argv._[2];

        if(!languageArg || (languageArg != "PY" && languageArg != "JS") ||
           !algoArg || (algoArg != "DDC" && algoArg != "DDL" && algoArg != "HDD" && algoArg != "HDD*" && algoArg != "GTR" && algoArg != "GTR*") ||
           !oracleFile || !inFile || !outFile) {
            console.log("Usage: 'node shell-reducer.js [-a algo [-l lang]] oracle input output'");
            console.log("Supported algorithms: 'DDC', 'DDL', 'HDD', 'HDD*', 'GTR', 'GTR*'. Default: 'GTR'");
            console.log("Language MUST be specified for HDD, HDD*, GTR, and GTR*.");
            console.log("Supported languages: 'JS', 'PY'. Default: 'PY'");
            return;
        }

        var algo;
        var treeAlgo;
        if(algoArg == "DDC") {
            algo = ddminChar;
            treeAlgo = false;
        } else if(algoArg == "DDL") {
            algo = ddminLine;
            treeAlgo = false;
        } else if(algoArg == "HDD") {
            algo = hdd.hdd;
            treeAlgo = true;
        } else if(algoArg == "HDD*") {
            algo = hdd.hddStar;
            treeAlgo = true;
        } else if(algoArg == "GTR") {
            algo = (pTree, pTest) => gtrAlgo.gtr(languageArg, pTree, pTest, false);
            treeAlgo = true;
        } else if(algoArg == "GTR*") {
            algo = (pTree, pTest) => gtrAlgo.gtrStar(languageArg, pTree, pTest, false);
            treeAlgo = true;
        }

        reduce(algo, treeAlgo, oracleFile, inFile, outFile, languageArg);
    }

    runTest();

})();