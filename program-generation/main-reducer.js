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

    var code = "" + fs.readFileSync("tree-reducer/input/test.js");

    // var tester = new inputTester.CodeTester(code);
    // var test = function(c) { return tester.test(c)};
    // var newCode = ddReducer.ddminLine(code, test);

    var ast = esprima.parse(code);
    var tree = treeProvider.astToTree(ast);
    var tester = new inputTester.JSTreeTester(tree);
    var test = function(c) { return tester.test(c)};
    var newTree = ddReducer.hddStar(tree, test);
    var newCode = treeGenerator.treeToCode(newTree);


    console.log("RESULT:\n" + newCode);

})();