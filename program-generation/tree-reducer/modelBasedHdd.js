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
    

    var T1 = {
        "in": new Node("WhileStatement", new Edge("body", "B")),
        "out": "B"
    };

    var TSwitchIf = {
        "in": new Node("IfStatement", new Edge("test", "T"), new Edge("consequent", "C"), new Edge("alternate", "A")),
        "out": new Node("IfStatement", new Edge("test", "T"), new Edge("consequent", "A"), new Edge("alternate", "C"))
    };

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

    var code = "if(a) s1; else s2;";
    var tree = treeProvider.astToTree(esprima.parse(code)).outgoing[0].target;

    var res = match(tree, TSwitchIf);
    console.log(JSON.stringify(res, null, 2));
    if(res) {
        var resCode = treeGenerator.treeToCodeNoFileIO(res);
        console.log(resCode);
    }

})();