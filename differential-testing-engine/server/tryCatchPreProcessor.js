// Author: Michael Pradel

/**
 * Takes a piece of JS code, surrounds it with try-catch, and
 * appends the outcome of the execution ("crash" or "okay") as the final expression.
 */
(function() {

    var esprima = require('esprima');
    var escodegen = require('escodegen');

    var template = 'var result = "okay";\
    var print = function (ip) {\
        return console.log(ip);\
    };\
    var alert = function (ip){\
        return console.log(ip);\
    };\
    var uneval = function (code){\
        return code;\
    };\
    try {\
    } catch(e) {\
        result = "crash";\
    }\
    result;';

    function preProcess(code) {
        try {
            var ast = esprima.parse(code);
        } catch (e) {
            return;
        }

        var templateAst = esprima.parse(template);
        var tryStmt = templateAst.body[4];
        if (tryStmt.type !== "TryStatement") throw "Unexpected parsing result -- cannot find TryStatement in template.";

        for (var i = 0; i < ast.body.length; i++) {
            var stmt = ast.body[i];
            tryStmt.block.body.push(stmt);
        }

        var transformedCode = escodegen.generate(templateAst);
        return transformedCode;
    }

    exports.preProcess = preProcess;

})();