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
    var hdd = require("./tree-reducer/hdd");
    var modelhdd = require("./tree-reducer/modelHdd");
    var rdd = require("./tree-reducer/rdd");

    var code = "" + fs.readFileSync("tree-reducer/input/test3.js");

    var ddAlgo = function(code, test) {
        //return execWithCode(hdd.hddStar, code, test);
        //return execWithCode(rdd.rdd, code, test);
        return execWithCode(modelhdd.postTransformationHddStar, code, test);
        //return ddmin.ddminLine(code, test);
    };

    var tester = new inputTester.CodeTester(code, ddAlgo);
    var newCode = tester.runTestWithInitialInput();
    
    console.log("RESULT:\n" + newCode);
    console.log("TESTS RUN: " + tester.testsRun);

})();