// Author: Satia Herfert

(function() {
    var bt = require('./bt');
    var hddScript = require('./hdd');

    /**
     * An input for the BT algorithm that uses a level of a tree as input.
     *
     * The variables are the nodes of the level. Each domain has two assigments: keep and discard.
     *
     * The convertToInput function returns a copy of the tree where the nodes assigned "discard" are deleted.
     */
    class TreeLevelBTInput extends bt.BTInput {
        /**
         * @param {Node} tree The tree that comprises this input
         * @param {number} level the of the tree at which to consider nodes. Must be >= 1.
         */
        constructor(tree, level) {
            var domains = [];
            tree.applyToLevel(level, function(node) {
                let assignments = [];
                // Keep the node
                assignments.push(new bt.Assignment(node, 0));
                // Discard the node
                assignments.push(new bt.Assignment(undefined, 1));

                domains.push(assignments);
            });

            var convertToInput = function(objects) {
                // Create a copy of the tree
                var newTree = tree.deepCopy();

                var currentChild = 0;
                // Go through the previous level and remove the children
                newTree.applyToLevel(level - 1, function(node) {
                    for (var i = 0; i < node.outgoing.length; i++, currentChild++) {
                        var nodeOrUndef = objects[currentChild];

                        if(nodeOrUndef == undefined) {
                            // Debug message
                            //console.log("Removing " + node.outgoing[i].label + " from " + node.label);
                            // Remove this node
                            node.outgoing.splice(i, 1);
                            // Repeat this index
                            i--;
                        }
                    }
                });

                return newTree;
            };

            super(domains, convertToInput);
        }
    }

    /**
     * Hierarchical backtracking.
     *
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @returns {Node} the minimized tree.
     */
    function bth(tree, test) {
        var currentTree = tree;

        for(var level = 1; level <= currentTree.depth() ; level++) {
            console.log("Testing level " + level + " in BTH.");
            currentTree = bt.bt(new TreeLevelBTInput(currentTree, level), test);
        }
        return currentTree;
    }
    /**
     * BTH* algorithm. Applies BTH repeatedly until no more nodes are removed.
     * This algorithm ensures 1-minimality, unlike BTH.
     *
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @returns {Node} the minimized tree.
     */
    function bthStar(tree, test) {
        return hddScript.doWhileTreeShrinks(tree, test, bth);
    }
    
    exports.bth = bth;
    exports.bthStar = bthStar;
})();