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
    var inputTester = require("./tree-reducer/inputTester");

    var codeDir = "tree-reducer/input/python";

    class PythonReducer extends Reducer {
        getTreeProvider() {
            return pyTreeProvider;
        }
        getTreeGenerator() {
            return pyTreeGenerator;
        }
        getInputTester(command, ddAlgo, fileName) {
            return new inputTester.PyCrashTester(command, ddAlgo);
        }
        getEnding() {
            return "PY";
        }
        getEncoding() {
            return "utf8";
        }
        getFileStateFromName(name) {
            if(name == "ackermann.py") {
                return this.getFileState(codeDir + "/ackermann.py", "python3.4");
            } else if(name == "alloc.py") {
                return this.getFileState(codeDir + "/alloc.py", "python2.7");
            } else if(name == "dict.py") {
                return this.getFileState(codeDir + "/dict.py", "python2.7");
            } else if(name == "itertools.py") {
                return this.getFileState(codeDir + "/itertools.py", "python2.7");
            } else if(name == "mroref.py") {
                return this.getFileState(codeDir + "/mroref.py", "python2.7");
            } else if(name == "recursion.py") {
                return this.getFileState(codeDir + "/recursion.py", "python3.4");
            } else if(name == "so.py") {
                return this.getFileState(codeDir + "/so.py", "python2.7");
            }
        }
    }

    new PythonReducer().runTest();

})();