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

    var code = fs.readFileSync("tree-reducer/input/test.js");
    var newCode = ddReducer.ddminChar(code);


    //var ast = esprima.parse(code);
    //var tree = treeProvider.astToTree(ast);
    //var newCode = treeGenerator.treeToCode(tree);
    console.log(newCode);

})();