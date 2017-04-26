// Author: Satia Herfert

/**
 * Compares all test files with different algorithms.
 */
(function () {
    var fs = require('fs');
    var jsonfile = require('jsonfile');
    var minimist = require('minimist');

    var execWithCode = require("./tree-reducer/ddMinTree").executeWithCode;
    var hdd = require("./tree-reducer/hdd");
    var gtrAlgo = require("./tree-reducer/gtr");
    var ddminLine = require("./tree-reducer/ddMinLine").ddminLine;
    var ddminChar = require("./tree-reducer/ddMinChar").ddminChar;

    /**
     * Abstract reducer.
     *
     * Subclasses should define the following additional methods:
     * getTreeProvider()
     * getTreeGenerator()
     * getInputTester(command, ddAlgo)
     * getEnding() : String
     * getFileStateFromName(name: String)
     */
    class Reducer {
        /**
         * Reduces the code of one file a reduction algorithm to a hopefully smaller piece of code
         * that exposes the same bug.
         *
         * @param fileState the fileState of the file to minimize.
         * @param algorithm a function reference to the algorithm to use
         * @param {String} algoPrefix the prefix to use for the given algorithm for the JSON file
         * @param treeAlgo true, if algorithm refers to a tree-based algorith; false, if it refers to a code-based algorithm
         * @return the new code
         */
        reduce(fileState, algorithm, algoPrefix, treeAlgo) {
            console.log("Starting reduction of " + fileState.fileName);

            var treeProvider = this.getTreeProvider();
            var treeGenerator = this.getTreeGenerator();

            // DD algorithm
            var ddAlgo;
            if (treeAlgo) {
                ddAlgo = function (code, test) {
                    return execWithCode(treeProvider, treeGenerator, algorithm, code, test);
                };
            } else {
                ddAlgo = function (code, test) {
                    return algorithm(code, test);
                };
            }

            var code = "" + fs.readFileSync(fileState.fileName);
            fileState.origSize = code.length;


            var tester = this.getInputTester(fileState.command, ddAlgo);
            var c2t = treeProvider.codeToTree(code);
            fileState.origSizeNodes = c2t.nbNodes();
            var code2tree2code = treeGenerator.treeToCode(c2t);
            if (tester.test(code2tree2code) === "pass") {
                console.log("The crash cannot be reproduced after code->tree->code conversion. Aborting.");
                return;
            }

            var newCode = tester.runTest(code);
            var newTree = treeProvider.codeToTree(newCode);

            // Create a results object if inexistant
            if (!fileState.results) {
                fileState.results = {};
            }

            fileState.results[algoPrefix] = {};
            fileState.results[algoPrefix].minCode = newCode;
            fileState.results[algoPrefix].size = newCode.length;
            fileState.results[algoPrefix].sizeNodes = newTree.nbNodes();
            fileState.results[algoPrefix].testsRun = tester.testsRun;
            fileState.results[algoPrefix].timeTaken = tester.timeTaken;
            fileState.results[algoPrefix].timeInOracle = tester.timeInOracle;
            console.log("Num tests: " + tester.testsRun + ` in ${fileState.results[algoPrefix].timeTaken} nanoseconds`);

            // Write to file
            var resultFileName = fileState.fileName.replace(new RegExp(this.getEnding().toLowerCase() + '$'), 'json');// .* --> .json
            fs.writeFileSync(resultFileName, JSON.stringify(fileState, 0, 2));

            console.log("Reduction done of " + fileState.fileName);
            return newCode;
        }

        /**
         * Gets a fileState by reading the JSON, or creates a new one.
         * @param fileName the name of the python file
         * @param command the python command
         * @returns {*} the FileState
         */
        getFileState(fileName, command) {
            var resultFileName = fileName.replace(new RegExp(this.getEnding().toLowerCase()+'$'), 'json');// .* --> .json
            try {
                return jsonfile.readFileSync(resultFileName)
            } catch (e) {
                return {fileName: fileName, command: command};
            }
        }

        /**
         * Reduces a file with one algorithm.
         */
        runTest() {
            var argv = minimist(process.argv.slice(2));
            var algoArg = argv.a;
            var fileArg = argv.f;

            if (!fileArg || !algoArg || (algoArg != "DDC" && algoArg != "DDL" && algoArg != "HDD" && algoArg != "HDD*"
                && algoArg != "GTR" && algoArg != "GTR*" && algoArg != "GTRX")) {
                console.log("Usage: 'node reducer.js -a algo -f file'");
                console.log("Supported algorithms: 'DDC', 'DDL', 'HDD', 'HDD*', 'GTR', 'GTR*', 'GTRX'.");
                return;
            }

            var algo;
            var name;
            var treeAlgo;
            if (algoArg == "DDC") {
                algo = ddminChar;
                name = "DD char-based";
                treeAlgo = false;
            } else if (algoArg == "DDL") {
                algo = ddminLine;
                name = "DD line-based";
                treeAlgo = false;
            } else if (algoArg == "HDD") {
                algo = hdd.hdd;
                name = "HDD";
                treeAlgo = true;
            } else if (algoArg == "HDD*") {
                algo = hdd.hddStar;
                name = "HDD*";
                treeAlgo = true;
            } else if (algoArg == "GTR") {
                algo = (pTree, pTest) => gtrAlgo.gtr(this.getEnding(), pTree, pTest, false);
                treeAlgo = true;
                name = "GTR";
            } else if (algoArg == "GTR*") {
                algo = (pTree, pTest) => gtrAlgo.gtrStar(this.getEnding(), pTree, pTest, false);
                treeAlgo = true;
                name = "GTR*";
            } else if (algoArg == "GTRX") {
                algo = (pTree, pTest) => gtrAlgo.gtr(this.getEnding(), pTree, pTest, true);
                treeAlgo = true;
                name = "GTR (no language information)";
            }

            this.reduce(this.getFileStateFromName(fileArg), algo, name, treeAlgo);
        }
    }

    exports.Reducer = Reducer;

})();