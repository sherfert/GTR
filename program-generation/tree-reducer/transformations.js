// Author: Satia Herfert

(function() {
    var Input = require('./ddInput').Input;
    var ddmin = require('./ddMin').ddmin;
    var config = require("../config").config;
    var treeProvider = require("../" + config.treeProvider);
    var treeGenerator = require("../" + config.treeGenerator);
    var esprima = require('esprima');
    var loTrees = require("../labeledOrderedTrees");
    var Node = loTrees.Node;
    var Edge = loTrees.Edge;
    

    var T1a = {
        "in": new Node("WhileStatement", new Edge("body", "B")),
        "out": "B"
    };
    var T1b = {
        "in": new Node("DoWhileStatement", new Edge("body", "B")),
        "out": "B"
    };
    var T2a = {
        "in": new Node("IfStatement", new Edge("consequent", "C")),
        "out": "C"
    };
    var T2b = {
        "in": new Node("IfStatement", new Edge("consequent", "C"), new Edge("alternate", "A")),
        "out": "A"
    };
    var T2c = {
        "in": new Node("ConditionalExpression", new Edge("consequent", "C")),
        "out": "C"
    };
    var T2d = {
        "in": new Node("ConditionalExpression", new Edge("consequent", "C"), new Edge("alternate", "A")),
        "out": "A"
    };
    var T3 = {
        "in": new Node("IfStatement", new Edge("test", "T"), new Edge("alternate", "A")),
        "out": new Node("IfStatement", new Edge("test", "T"), new Edge("consequent", "A"))
    };
    var T4 = {
        "in": new Node("WithStatement", new Edge("body", "B")),
        "out": "B"
    };
    var T6a = {
        "in": new Node("ThrowStatement", new Edge("argument", "A")),
        "out": "A"
    };
    var T6b = {
        "in": new Node("ReturnStatement", new Edge("argument", "A")),
        "out": "A"
    };
    var T7a = {
        "in": new Node("TryStatement", new Edge("block", "B")),
        "out": "B"
    };
    var T7b = {
        "in": new Node("TryStatement", new Edge("handler", new Node("CatchClause", new Edge("body", "B")))),
        "out": "B"
    };
    var T7c = {
        "in": new Node("TryStatement", new Edge("finalizer", "B")),
        "out": "B"
    };
    var T8 = {
        "in": new Node("ForStatement", new Edge("body", "B")),
        "out": "B"
    };
    var T9a = {
        "in": new Node("ForInStatement", new Edge("body", "B")),
        "out": "B"
    };
    var T9b = {
        "in": new Node("ForOfStatement", new Edge("body", "B")),
        "out": "B"
    };
    var T10 = {
        "in": new Node("ExpressionStatement", new Edge("expression", new Node("CallExpression",
            new Edge("callee", new Node("FunctionExpression", new Edge("body", "B")))))),
        "out": "B"
    };
    var T11a = {
        "in": new Node("ArrayExpression", new Edge("elements", "E")),
        "out": "E"
    };
    var T11b = {
        "in": new Node("SequenceExpression", new Edge("expressions", "E")),
        "out": "E"
    };
    var T11c = {
        "in": new Node("BlockStatement", new Edge("body", "B")),
        "out": "B"
    };
    var T12 = {
        "in": new Node("ObjectExpression", new Edge("properties", new Node("Property", new Edge("value", "V")))),
        "out": "V"
    };
    var T13a = {
        "in": new Node("UnaryExpression", new Edge("argument", "A")),
        "out": "A"
    };
    var T13b = {
        "in": new Node("UpdateExpression", new Edge("argument", "A")),
        "out": "A"
    };
    var T14a = {
        "in": new Node("BinaryExpression", new Edge("left", "L")),
        "out": "L"
    };
    var T14b = {
        "in": new Node("BinaryExpression", new Edge("right", "R")),
        "out": "R"
    };
    var T14c = {
        "in": new Node("AssignmentExpression", new Edge("left", "L")),
        "out": "L"
    };
    var T14d = {
        "in": new Node("AssignmentExpression", new Edge("right", "R")),
        "out": "R"
    };
    var T14e = {
        "in": new Node("LogicalExpression", new Edge("left", "L")),
        "out": "L"
    };
    var T14f = {
        "in": new Node("LogicalExpression", new Edge("right", "R")),
        "out": "R"
    };

    var transformations = [T1a, T1b, T2a, T2b, T2c, T2d, T3, T4, T6a, T6b, T7a, T7b, T7c, T8, T9a, T9b, T10, T11a, T11b,
        T11c, T12, T13a, T13b, T14a, T14b, T14c, T14d, T14e, T14f];


    function match(tree, rule) {
        // Store named nodes
        var map = {};
        if(test(tree, rule.in, map)) {
            // Return the replacement tree
            return replaceInTree(rule.out, map);
        }

    }

    /**
     * Tests if a tree matches a given pattern tree (inTree). Stores all placeholder nodes of tree in the map.
     * @param tree the original tree
     * @param inTree a pattern tree, where some nodes may be replaced by strings, and thus become placeholders
     * @param map the current placeholder map
     * @returns {boolean} if the tree matches the pattern tree
     */
    function test(tree, inTree, map) {
        if(typeof inTree === 'string') {
            // The current node is a placeholder
            map[inTree] = tree;
            return true;
        }
        // Compare the labels
        if(tree.label != inTree.label) {
            return false;
        }
        // Ensure that each edge if inTree is present in tree
        for (let i = 0; i < inTree.outgoing.length; i++) {
            let found = false;
            for (let j = 0; j < tree.outgoing.length; j++) {
                if(inTree.outgoing[i].label == tree.outgoing[j].label) {
                    found = true;
                    // The labels match, now the child nodes must match too
                    if(!test(tree.outgoing[j].target, inTree.outgoing[i].target, map)) {
                        return false;
                    }
                    break;
                }
            }
            if(!found) {
                return false;
            }
        }

        // All edges were found
        return true;
    }

    /**
     * Given a pattern tree and a replacement map, it replaces all placeholders in the tree
     * with the corresponding replacements from the map.
     * @param tree the pattern tree
     * @param map the replacement map
     * @returns the tree with replacements in place
     */
    function replaceInTree(tree, map) {
        if(typeof tree === 'string') {
            // The current node is a placeholder
            return map[tree];
        }
        // Replace in all child nodes
        for (let i = 0; i < tree.outgoing.length; i++) {
            tree.outgoing[i].target = replaceInTree(tree.outgoing[i].target, map);
        }
        return tree;
    }


    /**
     * Returns an array of all possible transformations of a subtree.
     * @param subtree the subtree
     * @returns {Array} all possible transformations
     */
    function possibleTransformations(subtree) {
        // Try all transformations
        var res = [];
        for(let i = 0; i < transformations.length; i++) {
            var transformed = match(subtree, transformations[i]);
            if(transformed) {
                // There is a possible replacement
                res.push(transformed);
            }
        }
        return res;
    }

    // var code = "if('you' == true) {console.log('p')} else {foo(bar);}";
    // var tree = treeProvider.astToTree(esprima.parse(code)).outgoing[0].target;
    //
    // var res = possibleTransformations(tree);
    // for(let i = 0; i < res.length; i++) {
    //
    //     var resCode = treeGenerator.treeToCodeNoFileIO(res[i]);
    //     console.log(i + ": " + resCode);
    // }


    exports.possibleTransformations = possibleTransformations;

})();