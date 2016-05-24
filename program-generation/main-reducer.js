// Author: Satia Herfert

(function() {
    var fs = require('fs');
    var esprima = require('esprima');
    var escodegen = require('escodegen');
    var learning = require("./learning");
    var config = require("./config").config;
    var treeProvider = require(config.treeProvider);
    var treeGenerator = require(config.treeGenerator);
    var ddReducer = require("./tree-reducer/deltaDebuggingReducer");
    var inputTester = require("./tree-reducer/inputTester");

    var code = "" + fs.readFileSync("tree-reducer/input/test3.js");

    var tester = new inputTester.CodeTester(code);
    var test = function(c) { return tester.test(c)};
    //var newCode = ddReducer.ddminChar(code, test);
    // Beware that execute with code does not count failed tree->code conversions
    // towards the test run count.
    var newCode = ddReducer.executeWithCode(ddReducer.hdd, code, test);

    // var ast = esprima.parse(code);
    // var tree = treeProvider.astToTree(ast);
    // var tester = new inputTester.JSTreeTester(tree);
    // var test = function(c) { return tester.test(c)};
    // var newTree = ddReducer.hdd(tree, test);
    // var newCode = treeGenerator.treeToCodeNoFileIO(newTree);


    console.log("RESULT:\n" + newCode);
    console.log("TESTS RUN: " + tester.testsRun);

})();