// Author: Satia Herfert

(function() {
    var esprima = require('esprima');
    var fs = require('fs');
    //var estraverse = require('estraverse');
    var escodegen = require('escodegen');
    var config = require("./config").config;
    var treeProvider = require(config.treeProvider);

    var code = fs.readFileSync("tree-reducer/input/test.js");
    var ast = esprima.parse(code);
    //console.log(JSON.stringify(ast, null, 4));
    //var tree = treeProvider.astToTree(ast);
    //console.log(JSON.stringify(tree, null, 4));

    var newCode = escodegen.generate(ast);
    console.log(newCode);

})();