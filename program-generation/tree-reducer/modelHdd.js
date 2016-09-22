// Author: Satia Herfert

(function() {
    var hddScript = require('./hdd');
    var tfs= require('./transformations');
    var ddmin = require('./ddMin').ddmin;
    var TreeLevelInput = hddScript.TreeLevelInput;
    var treeCache = require('./treeCache');

    /**
     * Applies transformations to a node.
     *
     * @param {String} pl the programming language
     * @param node the node
     * @param tree the whole tree
     * @param test the oracle
     * @returns {boolean} if at least one transformation could be applied.
     */
    function applyTransformationsToNode(pl, node, tree, test) {
        let transformationApplied = false;
        let replaced = false;

        do {
            let origLabel = node.label;
            let origOutgoing = node.outgoing;
            let transformations = tfs.possibleTransformationsWithModel(node, pl);
            replaced = false;

            // Try each transformation by replacing the label and children and calling test
            for (let j = 0; j < transformations.length; j++) {
                var replacement = transformations[j];
                node.label = replacement.label;
                node.outgoing = replacement.outgoing;

                if (test(tree) == "fail") {
                    //console.log(`replaced ${target} with ${transformations[j]}`);
                    replaced = true;
                    transformationApplied = true;
                    break;
                } else {
                    //console.log(`could not replace ${target} with ${transformations[j]}`)
                }
            }

            // Put the original label in children in place if we found no replacement
            if (!replaced) {
                node.label = origLabel;
                node.outgoing = origOutgoing;
            }
        } while(replaced);

        return transformationApplied;
    }

    /**
     * Applies on each level first ddmin and then possible transformations.
     *
     * There is no DD like checking of combinations of transformations, if single ones do not work.
     *
     * @param {String} pl the programming language
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @returns {Node} the minimized tree.
     */
    function postLevelTransformationHdd(pl, tree, test) {
        var currentTree = tree;

        // In the original they start with level 0, but we skip the root.
        for(var level = 1; level <= currentTree.depth() ; level++) {
            console.log("Testing level " + level + " in PLT-HDD.");
            currentTree = ddmin(new TreeLevelInput(currentTree, level), test).currentCode;
            currentTree.applyToLevel(level, node => applyTransformationsToNode(pl, node, currentTree, test));
        }

        return currentTree;
    }

    /**
     * Repeats PLT-HDD until nothing changes any more.
     * @param {String} pl the programming language
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @returns {Node} the minimized tree.
     */
    function postLevelTransformationHddStar(pl, tree, test) {
        var cachedTest = treeCache.cachedTest(test);
        return hddScript.doWhileTreeShrinks(tree, cachedTest, (pTree, pTest) => postLevelTransformationHdd(pl, pTree, pTest));
    }

    exports.postLevelTransformationHdd = postLevelTransformationHdd;
    exports.postLevelTransformationHddStar = postLevelTransformationHddStar;
})();