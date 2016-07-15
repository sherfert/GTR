// Author: Satia Herfert

(function() {
    var fs = require('fs');
    var escodegen = require('escodegen');
    var jsAstProvider = require('./js-ast/jsAstProvider');

    var ast = {
        "type": "WhileStatement",
        "test": {
            "type": "Identifier",
            "name": "a"
        },
        "body": {
            "type": "BlockStatement",
            "body": [
                {
                    "type": "ExpressionStatement",
                    "expression": {
                        "type": "CallExpression",
                        "callee": {
                            "type": "Identifier",
                            "name": "foo"
                        },
                        "arguments": [
                            {
                                "type": "Identifier",
                                "name": "b"
                            }
                        ]
                    }
                }
            ]
        }
    };

    var code = escodegen.generate(ast);
    var tree = jsAstProvider.astToTree(ast);

    console.log(JSON.stringify(tree, null, 2));
    console.log("RESULT:\n" + code);

})();