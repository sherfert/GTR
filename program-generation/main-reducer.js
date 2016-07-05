// Author: Satia Herfert

(function() {
    var fs = require('fs');
    var esprima = require('esprima');
    var escodegen = require('escodegen');
    var config = require("./config").config;
    var treeProvider = require(config.treeProvider);
    var treeGenerator = require(config.treeGenerator);
    var inputTester = require("./tree-reducer/inputTester");
    var execWithCode = require("./tree-reducer/ddMinTree").executeWithCode;
    var ddmin = require("./tree-reducer/hdd");

    var code = "" + fs.readFileSync("tree-reducer/input/test.js");

    var ddAlgo = function(code, test) {
        return execWithCode(ddmin.hddStar, code, test);
        //return ddmin.ddminLine(code, test);
    };

    var tester = new inputTester.CodeTester(code, ddAlgo);
    var newCode = tester.runTestWithInitialInput();
    
    console.log("RESULT:\n" + newCode);
    console.log("TESTS RUN: " + tester.testsRun);

})();