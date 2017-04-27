// Author: Satia Herfert

/**
 * Compares all python test files with different algorithms.
 */
(function() {
    var fs = require('fs');
    var jsonfile = require('jsonfile');
    var minimist = require('minimist');

    var Reducer = require('./reducer').Reducer;

    var pyTreeProvider = require('../program-generation/py-ast/pyAstProvider');
    var pyTreeGenerator = require('../program-generation/py-ast/pyAstGenerator');
    var jsTreeProvider = require('../program-generation/js-ast/jsAstProvider');
    var jsTreeGenerator = require('../program-generation/js-ast/jsAstGenerator');
    var ShellOracleTester = require("./tree-reducer/inputTester").ShellOracleTester;

    class ShellReducer extends Reducer {
        /**
         * @param shellCommand the shell command that servers as an oracle
         * @param outFile where to write the reduced result
         * @param language "PY"/"JS"
         */
        constructor(language, shellCommand, outFile) {
            super();
            this.language = language;
            this.shellCommand = shellCommand;
            this.outFile = outFile;
        }

        getTreeProvider() {
            if(this.language === "PY") {
                return pyTreeProvider;
            } else {
                return jsTreeProvider;
            }
        }
        getTreeGenerator() {
            if(this.language === "PY") {
                return pyTreeGenerator;
            } else {
                return jsTreeGenerator;
            }
        }
        getInputTester(command, ddAlgo) {
            return new ShellOracleTester(command, ddAlgo, "." + this.language.toLowerCase());
        }
        getEnding() {
            return this.language;
        }
        getFileStateFromName(name) {
            return this.getFileState(name, this.shellCommand);
        }

        reduce(fileState, algorithm, algoPrefix, treeAlgo) {
            var newCode = super.reduce(fileState, algorithm, algoPrefix, treeAlgo);
            fs.writeFileSync(this.outFile, newCode);
        }
    }

    /**
     * Reduces the file
     */
    function runTest() {
        var argv = minimist(process.argv.slice(2));

        var languageArg = argv.l || "PY";
        var oracleFile = argv._[0];
        var outFile = argv._[1];

        if(!languageArg || (languageArg != "PY" && languageArg != "JS") ||
           !oracleFile || !outFile) {
            console.log("Usage: 'node shell-reducer.js -a algo [-l lang] -f input oracle output'");
            console.log("Supported algorithms: 'DDC', 'DDL', 'HDD', 'HDD*', 'GTR', 'GTR*'. Default: 'GTR'");
            console.log("Language MUST be specified for HDD, HDD*, GTR, and GTR*.");
            console.log("Supported languages: 'JS', 'PY'. Default: 'PY'");
            return;
        }

        var reducer = new ShellReducer(languageArg, oracleFile, outFile);
        reducer.runTest();
    }

    runTest();

})();