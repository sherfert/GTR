// Author: Michael Pradel

(function() {

    var escodegen = require("escodegen");
    var util = require("./../util");
    var loTrees = require("./../labeledOrderedTrees");
    var jsonfile = require('jsonfile');
    var fs = require('fs');
    var config = require("../config").config;

    /**
     * Transform an ordered, labeled tree into an ESTree-compatible AST.
     * @param tree An ordered, labeled tree.
     */
    function treeToAST(tree) {
        util.assert(tree instanceof loTrees.Node);

        var astNode = {
            type:tree.label
        };
        var propNameToTargets = {};
        for (let i = 0; i < tree.outgoing.length; i++) {
            var edge = tree.outgoing[i];
            var targetsWithThisName = propNameToTargets[edge.label] || [];
            targetsWithThisName.push(edge.target);
            propNameToTargets[edge.label] = targetsWithThisName;
        }
        var propNames = Object.keys(propNameToTargets);
        for (let i = 0; i < propNames.length; i++) {
            var propName = propNames[i];
            var targets = propNameToTargets[propName];
            if (targets.length > 1 || needsArray(tree.label, propName)) {
                astNode[propName] = [];
                for (let j = 0; j < targets.length; j++) {
                    var target = targets[j];
                    if (target.label !== "") {
                        // Do not push undefined nodes
                        let child = treeToAST(target);
                        if(child) {
                            astNode[propName].push(child);
                        }
                    }
                }
            } else {
                util.assert(targets.length === 1, targets);
                astNode[propName] = treeToAST(targets[0]);
            }
        }
        // add empty arrays even if there's no outgoing edge
        var arrayProps = mandatoryArrayProperties[astNode.type];
        if (arrayProps) {
            for (var prop in arrayProps) {
                if (astNode[prop] === undefined) astNode[prop] = [];
            }
        }

        // special case: RegExp isn't a "type" actually --> remove the "type" property
        if (astNode.type === "RegExp") {
            delete astNode.type;
        }

        // TODO testing
        // Check that all mandatory child nodes exist and are not undefined or empty, otherwise return undefined
        if(mandatoryChildProperties[astNode.type]) {
            for (let i = 0; i < mandatoryChildProperties[astNode.type].length; i++) {
                let requiredChild = mandatoryChildProperties[astNode.type][i];
                if(!astNode[requiredChild] || astNode[requiredChild].length == 0) {
                    console.log("Removing AST node since it is missing a required child.");
                    return undefined;
                }
            }
        }

        // Check for missing child nodes that require special handling
        if(specialChildProperties[astNode.type]) {
            for (var key in specialChildProperties[astNode.type]) {
                if (specialChildProperties[astNode.type].hasOwnProperty(key)) {
                    let handler = specialChildProperties[astNode.type][key];
                    if(!astNode[key]) {
                        console.log("Handling AST node since it is missing a special child.");
                        return handler(astNode);
                    }
                }
            }
        }

        var mandatoryArrayTypes = Object.keys(mandatoryArrayProperties);
        /* TODO: This is a temporary workaround. To check if tree.outgoing.length is always = 0 in the corpus
         * FIXME: Remove 'ThisExpression' and 'EmptyStatement' from this check.
         * */
        if (tree.outgoing.length === 0 && mandatoryArrayTypes.indexOf(tree.label) === -1
            && tree.label !== "ThisExpression" && tree.label !== "EmptyStatement") {
            /* Special case for RegExp. Test if the string is a RegExp. This tests if the first
             *  and the last character of a string is a /
             * */

            if (/^[/].*[/]$/.test(tree.label)) {
                return new RegExp(tree.label);
            }
            try {
                return JSON.parse(tree.label);
            } catch (err) {
                return tree.label;
            }
        }

        return astNode;
    }


    // All these maps are based on https://developer.mozilla.org/en-US/docs/Mozilla/Projects/SpiderMonkey/Parser_API

    // Some nodes have properties that must be an array
    var mandatoryArrayProperties = {
        Program:{body:true},
        Function:{params:true, defaults:true},
        BlockStatement:{body:true},
        SwitchStatement:{cases:true},
        TryStatement:{cases:true,guardedHandlers:true,handlers:true},
        LetStatement:{head:true},
        FunctionDeclaration:{params:true,defaults:true},
        VariableDeclaration:{declarations:true},
        ArrayExpression:{elements:true},
        ObjectExpression:{properties:true},
        FunctionExpression:{params:true,defaults:true},
        ArrowExpression:{params:true,defaults:true},
        SequenceExpression:{expressions:true},
        NewExpression:{arguments:true},
        CallExpression:{arguments:true},
        ComprehensionExpression:{blocks:true},
        GeneratorExpression:{blocks:true},
        LetExpression:{head:true},
        ObjectPattern:{properties:true},
        ArrayPattern:{elements:true},
        SwitchCase:{consequent:true}
    };

    // Some child properties are mandatory
    var mandatoryChildProperties = {
        CallExpression:["callee"],
        ExpressionStatement:["expression"],
        LogicalExpression:["operator"],
        BinaryExpression:["operator"],
        AssignmentExpression:["operator"],
        UpdateExpression:["agument"],
        Identifier:["name"],
        UnaryExpression:["argument"],
        IfStatement:["consequent", "test"],
        FunctionDeclaration:["id","body"],
        FunctionExpression:["body"],
        ArrowFunctionExpression:["body"],
        MemberExpression:["object"],
        VariableDeclaration:["declarations"],
        VariableDeclarator:["id"],
        ForStatement:["body"],
        TryStatement:["block"],
        CatchClause:["param", "body"],
        Literal:["value"],
        WithStatement:["object", "body"],
        SwitchStatement:["discriminant"],
        ThrowStatement:["argument"],
        WhileStatememt:["test", "body"],
        DoWhileStatememt:["test", "body"],
        ForInStatement:["left", "right", "body"],
        ForOfStatement:["left", "right", "body"],
        ConditionalExpression:["test"],
        NewExpression:["callee"]
    };

    // Some nodes need special handling if certain childs are missing or empty
    var specialChildProperties = {
        LogicalExpression:{left: (node) => (node.left || node.right), right: (node) => (node.left || node.right)},
        BinaryExpression:{left: (node) => (node.left || node.right), right: (node) => (node.left || node.right)},
        AssignmentExpression:{left: (node) => (node.left || node.right), right: (node) => (node.left || node.right)},
        ConditionalExpression:{consequent: (node) => (node.consequent || node.alternate),
            alternate: (node) => (node.consequent || node.alternate)},
        UnaryExpression:{operator: (node) => node.argument},
        UpdateExpression:{operator: (node) => node.argument},
        MemberExpression:{property: (node) => node.object}
    };

    function needsArray(type, prop) {
        var props = mandatoryArrayProperties[type];
        return props && props[prop];
    }

    function treeToCode(tree) {
        var ast = treeToAST(tree);
        //util.print(tree);
        //util.print(ast);
        //console.log("AST:\n" + JSON.stringify(ast, 0, 2) + "\n");
        try {
            var code = escodegen.generate(ast);
            return code;
        } catch (e) {
            //console.log("\nPretty printing AST failed: " + e);

            /* Write the invalid ASTs to a file in the invalidAST directory for the purposes of debugging */
            if (!fs.existsSync(config.invalidASTsDir)) { // Check if the directory exists
                fs.mkdirSync(config.invalidASTsDir);
            }
            /* Finally, write the tree in a text file and the AST in a json file */
            var filename = new Date().getTime().toString();
            var treeString = JSON.stringify(tree);
            treeString.replace(/,/g, ",\n\t"); // Format the tree
            treeString = "Error :" + e + "\n\n" + treeString;
            fs.writeFileSync(config.invalidASTsDir + "/" + filename + ".txt", treeString);
            jsonfile.writeFileSync(config.invalidASTsDir + "/" + filename + ".json", ast);

            return undefined;
        }
    }

    /**
     * Converts a tree to code, but does not write anything into the invalid AST dir
     * in case of exceptions.
     * @param {Node} tree the tree
     * @returns {String|Error} the code or the caught exception.
     */
    function treeToCodeNoFileIO(tree) {
        var ast = treeToAST(tree);
        console.log("Trying:");
        console.log(JSON.stringify(ast, null, 2));

        try {
            return escodegen.generate(ast);
        } catch (e) {
            return e;
        }
    }

    exports.treeToCode = treeToCode;
    exports.treeToCodeNoFileIO = treeToCodeNoFileIO;

})();
