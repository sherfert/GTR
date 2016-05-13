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


    /** Simply checks if a fixed code snippet is contained.
     */
    function simpleTest(code) {
        var snippet1 = "var x = 23;";
        var snippet2 = "x = z;";

        if(code.indexOf(snippet1) > -1 && code.indexOf(snippet2) > -1) {
            // Snippet is included, code crashes
            return "fail";
        }
        return "pass";
    }

    var code = "" + fs.readFileSync("tree-reducer/input/input2.js");
    //var tester = new inputTester.CodeTester(code);

    var ast = esprima.parse(code);
    var tree = treeProvider.astToTree(ast);
    var tester = new inputTester.JSTreeTester(tree);


    var test = function(c) { return tester.test(c)};
    var newTree = ddReducer.ddminTree(tree, test);



    var newCode = treeGenerator.treeToCode(tree);
    console.log("RESULT:\n" + newCode);

})();