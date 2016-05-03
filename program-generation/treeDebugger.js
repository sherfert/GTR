// Author: Michael Pradel

// This is not part of the implementation.
// It's only for testing and debugging...

(function() {
    var escodegen = require("escodegen");

    var ast = {
        "type":"Program",
        "body":[
            {
                "type":"ExpressionStatement",
                "expression":{
                    "type":"CallExpression",
                    "callee":{
                        "type":"Identifier",
                        "name":"foo"//{
                            //"type":"foo"//,
                            //"":"x"
                        //}
                    },
                    "arguments":[]
                }
            }
        ]
    };

    var code = escodegen.generate(ast);
    console.log(code);


})();