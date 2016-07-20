// Author: Satia Herfert

(function() {
    var Input = require('./ddInput').Input;
    var hddScript = require('./hdd');
    var possibleTransformations = require('./transformations').possibleTransformations;
    var ddmin = require('./ddMin').ddmin;
    var hdd = hddScript.hdd;
    var TreeLevelInput = hddScript.TreeLevelInput;

    function applyTransformationsToChildren(node, tree, test) {
        var transformationApplied = false;

        //Iterate through the children.
        for (let i = 0; i < node.outgoing.length; i++) {
            var target = node.outgoing[i].target;
            var transformations = possibleTransformations(target);

            // Try each transformation by replacing the child and calling test
            let replaced = false;
            for (let j = 0; j < transformations.length; j++) {
                node.outgoing[i].target = transformations[j];
                if (test(tree) == "fail") {
                    console.log(`replaced ${target} with ${transformations[j]}`);
                    replaced = true;
                    transformationApplied = true;
                    break;
                } else {
                    //console.log(`could not replace ${target} with ${transformations[j]}`)
                }
            }

            // Put the original child in place if we found no replacement
            if (!replaced) {
                node.outgoing[i].target = target;
            } else {
                // If we found a transformation, the replacement might have more
                // transformations, so we must repeat the index
                i--;
            }
        }
        return transformationApplied;
    }

    /**
     * Applies HDD and the transformations in turn, until no more changes are registered.
     *
     * The transformations are done on a per-node bases: The tree is traversed in preorder,
     * and for all nodes, all possible transformations are checked. If a node can be transformed,
     * the new node is also checked for transformations.
     *
     * There is no DD like checking of combinations of transformations, if single ones do not work.
     *
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @returns {Node} the minimized tree.
     */
    function postTransformationHdd(tree, test) {
        // First do the normal hdd
        var currentTree = hdd(tree, test);
        // Now go through all nodes, and try applying transformations
        currentTree.preorder(node => applyTransformationsToChildren(node, currentTree, test));
        return currentTree;
    }

    // Repeats postTransformationHdd
    function postTransformationHddStar(tree, test) {
        return hddScript.doWhileTreeShrinks(tree, test, postTransformationHdd);
    }

    /**
     * Applies on each level first ddmin and then possible transformations.
     *
     * Transformations without combinations, as above.
     *
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @returns {Node} the minimized tree.
     */
    function postLevelTransformationHdd(tree, test) {
        var currentTree = tree;

        // In the original they start with level 0, but we skip the root.
        for(var level = 1; level <= currentTree.depth() ; level++) {
            console.log("Testing level " + level + " in PLT-HDD.");
            currentTree = ddmin(new TreeLevelInput(currentTree, level), test).currentCode;
            // Previous level, since transformations are applied to children
            currentTree.applyToLevel(level - 1, node => applyTransformationsToChildren(node, currentTree, test));
        }

        return currentTree;
    }

    // Repeats postLevelTransformationHdd
    function postLevelTransformationHddStar(tree, test) {
        return hddScript.doWhileTreeShrinks(tree, test, postLevelTransformationHdd);
    }

    exports.postTransformationHdd = postTransformationHdd;
    exports.postTransformationHddStar = postTransformationHddStar;
    exports.postLevelTransformationHdd = postLevelTransformationHdd;
    exports.postLevelTransformationHddStar = postLevelTransformationHddStar;
})();