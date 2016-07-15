// Author: Satia Herfert

(function() {
    var Input = require('./ddInput').Input;
    var hdd = require('./hdd').hdd;
    var possibleTransformations = require('./transformations').possibleTransformations;

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
        var currentTree = tree;
        do {
            var transformationApplied = false;

            // First do the normal hdd
            currentTree = hdd(currentTree, test);

            // Now go through all nodes, and try applying transformations
            currentTree.preorder(function (node) {
                //Iterate through the children.
                for (let i = 0; i < node.outgoing.length; i++) {
                    var target = node.outgoing[i].target;
                    var transformations = possibleTransformations(target);
                    // Try each transformation by replacing the child and calling test
                    let replaced = false;
                    for (let j = 0; j < transformations.length; j++) {
                        node.outgoing[i].target = transformations[j];
                        if (test(currentTree) == "fail") {
                            //console.log(`replaced ${target} with ${transformations[j]}`);
                            replaced = true;
                            transformationApplied = true;
                            break;
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
            });
        } while(transformationApplied);

        return currentTree;
    }

    exports.postTransformationHdd = postTransformationHdd;
})();