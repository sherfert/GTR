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

    var tester = new inputTester.CodeTester(code);
    var test = function(c) { return tester.test(c)};
    //var newCode = ddReducer.ddminChar(code, test);
    // Beware that execute with code does not count failed tree->code conversions
    // towards the test run count.
    var newCode = execWithCode(ddmin.hddStar, code, test);
    //var newCode = ddmin.ddminLine(code, test);

    // var ast = esprima.parse(code);
    // var tree = treeProvider.astToTree(ast);
    // var tester = new inputTester.JSTreeTester(tree);
    // var test = function(c) { return tester.test(c)};
    // var newTree = ddReducer.hdd(tree, test);
    // var newCode = treeGenerator.treeToCodeNoFileIO(newTree);


    console.log("RESULT:\n" + newCode);
    console.log("TESTS RUN: " + tester.testsRun);

})();