// Author: Satia Herfert

(function() {
    var bt = require('./bt');
    var hddScript = require('./hdd');
    var tfs= require('./transformations');

    /**
     * An input for the BT algorithm that uses a level of a tree as input, and includes tree transformations.
     *
     * The variables are the nodes of the level. Each domain has at least two assigments: keep and discard. If child
     * substitutions apply to the node, it has more assignments that will replace it.
     *
     * The convertToInput function returns a copy of the tree where the nodes assigned "discard" are deleted, and
     * other nodes are replaced.
     */
    class TreeLevelTransformationBTInput extends bt.BTInput {
        /**
         *
         * @param {String} pl pl the programming language
         * @param {Node} tree The tree that comprises this input
         * @param {number} level the of the tree at which to consider nodes. Must be >= 1.
         * @param tryAll if all child replacements should be tested, regardless if they are deemed OK from the corpus
         */
        constructor(pl, tree, level, tryAll) {
            var domains = [];
            // Previous level (to capture the parent information)
            tree.applyToLevel(level - 1, function(p) {
                // Go through all children of p
                for(let i = 0; i < p.outgoing.length; i++) {
                    let l1 = p.outgoing[i].label;
                    let n = p.outgoing[i].target;

                    // create an assignment array for each n node
                    let assignments = [];
                    // "Keep the node" assignment
                    assignments.push(new bt.Assignment({p: p, n: n}, 0));

                    // Go through all children of n
                    for(let j = 0; j < n.outgoing.length; j++) {
                        let c = n.outgoing[j].target;

                        // Test, if a PNC transformation is allowed
                        if(tryAll || tfs.pncTransformationAllowedForPL(p.label, l1, c.label, pl)) {
                            // Assignment for replacing N with C (gain 1)
                            assignments.push(new bt.Assignment({p: p, l1:l1, n: c}, 1));
                        }
                    }

                    // "Discard the node" assignment (maximum gain)
                    assignments.push(new bt.Assignment(undefined, Number.MAX_SAFE_INTEGER));

                    domains.push(assignments);
                }
            });

            var convertToInput = function(objects) {
                // Create a copy of the tree
                var newTree = tree.deepCopy();

                var currentChild = 0;
                // Go through the previous level and remove or replace the children
                newTree.applyToLevel(level - 1, function(node) {
                    for (var i = 0; i < node.outgoing.length; i++, currentChild++) {
                        var nodeOrUndef = objects[currentChild];

                        if(nodeOrUndef == undefined) {
                            // Remove this node
                            node.outgoing.splice(i, 1);
                            // Repeat this index
                            i--;
                        } else {
                            // Replace the node
                            node.outgoing[i].target = nodeOrUndef.n;
                        }
                    }
                });

                return newTree;
            };

            var getNewAssignments = function(currentAssignment) {
                if(!currentAssignment.obj) {
                    return undefined;
                }
                var newAssignments = [];
                var p = currentAssignment.obj.p;
                var l1 = currentAssignment.obj.l1;
                var n = currentAssignment.obj.n;
                var previousGain = currentAssignment.gain;

                // Go through all children of the new n
                for(let j = 0; j < n.outgoing.length; j++) {
                    let c = n.outgoing[j].target;

                    // Test, if a PNC transformation is allowed
                    if(tryAll || tfs.pncTransformationAllowedForPL(p.label, l1, c.label, pl)) {
                        // Assignment for replacing N with C (1 gain more than before)
                        newAssignments.push(new bt.Assignment({p: p, l1:l1, n: c}, previousGain + 1));
                    }
                }

                if(newAssignments.length > 0){
                    return newAssignments;
                }else{
                    return undefined;
                }
            };

            super(domains, convertToInput, getNewAssignments);
        }
    }

    /**
     * Hierarchical backtracking with transformations.
     *
     * @param {String} pl the programming language
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @param tryAll if all child replacements should be tested, regardless if they are deemed OK from the corpus
     * @returns {Node} the minimized tree.
     */
    function bthta(pl, tree, test, tryAll) {
        var currentTree = tree;

        for(var level = 1; level <= currentTree.depth() ; level++) {
            console.log("Testing level " + level + " in BTH.");
            currentTree = bt.bt(new TreeLevelTransformationBTInput(pl, currentTree, level, tryAll), test);
        }
        return currentTree;
    }

    /**
     * BTHTA* algorithm. Applies BTHTA repeatedly until no more nodes are removed.
     * This algorithm ensures 1-minimality, unlike BTHTA.
     *
     * @param {String} pl the programming language
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @param tryAll if all child replacements should be tested, regardless if they are deemed OK from the corpus
     * @returns {Node} the minimized tree.
     */
    function bthtaStar(pl, tree, test, tryAll) {
        return hddScript.doWhileTreeShrinks(tree, test, (pTree, pTest) => bthta(pl, pTree, pTest, tryAll));
    }
    
    exports.bthta = bthta;
    exports.bthtaStar = bthtaStar;
})();