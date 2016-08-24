// Author: Satia Herfert

(function() {
    var fs = require('fs');
    var esprima = require('esprima');
    var escodegen = require('escodegen');
    var config = require("./config").config;
    var jsTreeProvider = require(config.treeProvider);
    var jsTreeGenerator = require(config.treeGenerator);
    var pyTreeProvider = require('./py-ast/pyAstProvider');
    var pyTreeGenerator = require('./py-ast/pyAstGenerator');
    var inputTester = require("./tree-reducer/inputTester");
    var execWithCode = require("./tree-reducer/ddMinTree").executeWithCode;
    var hdd = require("./tree-reducer/hdd");
    var modelhdd = require("./tree-reducer/modelHdd");
    var rdd = require("./tree-reducer/rdd");
    var ddminLine = require("./tree-reducer/ddMinLine").ddminLine;
    var ddminChar = require("./tree-reducer/ddMinChar").ddminChar;


    // Javascript ------------------------------------------------------------------------------------------------------
    // var code = "" + fs.readFileSync("tree-reducer/input/test3.js");
    //
    // var ddAlgo = function(code, test) {
    //     return execWithCode(jsTreeProvider, jsTreeGenerator, hdd.hddStar, code, test);
    //     //return execWithCode(rdd.rdd, code, test);
    //     //modelhdd.setUseInferredKnowledge(true);
    //     //return execWithCode(modelhdd.postLevelTransformationHddStar, code, test);
    //     //return ddminLine(code, test);
    // };
    // var tester = new inputTester.CodeTester(code, ddAlgo);
    // var newCode = tester.runTestWithInitialInput();
    // -----------------------------------------------------------------------------------------------------------------

    // Python ----------------------------------------------------------------------------------------------------------
    var ddAlgo = function(code, test) {
        return execWithCode(pyTreeProvider, pyTreeGenerator, hdd.hdd, code, test);
        //return execWithCode(rdd.rdd, code, test);
        //modelhdd.setUseInferredKnowledge(true);
        //return execWithCode(modelhdd.postLevelTransformationHddStar, code, test);
        //return ddminLine(code, test);
    };



    // var pycode = "" + fs.readFileSync("tree-reducer/input/python/bug1.py");
    // var tester = new inputTester.PyCrashTester("python3.4", ddAlgo);
    // var pycode = "" + fs.readFileSync("tree-reducer/input/python/bug2.py");
    // var tester = new inputTester.PyCrashTester("python2.7", ddAlgo);
    // var pycode = "" + fs.readFileSync("tree-reducer/input/python/bug3.py"); // Non-deterministic!
    // var tester = new inputTester.PyCrashTester("python3.4", ddAlgo);
    // var pycode = "" + fs.readFileSync("tree-reducer/input/python/bug4.py");
    // var tester = new inputTester.PyCrashTester("python3.4", ddAlgo);
    // var pycode = "" + fs.readFileSync("tree-reducer/input/python/bug5.py");
    // var tester = new inputTester.PyCrashTester("python2.7", ddAlgo);
    // var pycode = "" + fs.readFileSync("tree-reducer/input/python/bug6.py");
    // var tester = new inputTester.PyCrashTester("python2.7", ddAlgo);
    // var pycode = "" + fs.readFileSync("tree-reducer/input/python/bug7.py");
    // var tester = new inputTester.PyCrashTester("python3.4", ddAlgo);
    var pycode = "" + fs.readFileSync("tree-reducer/input/python/bug8.py"); // Slightly nonde
    var tester = new inputTester.PyCrashTester("python2.7", ddAlgo);
    // var pycode = "" + fs.readFileSync("tree-reducer/input/python/bug9.py");
    // var tester = new inputTester.PyCrashTester("python3.4", ddAlgo);
    // var pycode = "" + fs.readFileSync("tree-reducer/input/python/bug10.py");
    // var tester = new inputTester.PyCrashTester("python2.7", ddAlgo);
    var newCode = tester.runTest(pycode);
    // -----------------------------------------------------------------------------------------------------------------
    
    console.log("RESULT:\n" + newCode);
    console.log("TESTS RUN: " + tester.testsRun);

})();