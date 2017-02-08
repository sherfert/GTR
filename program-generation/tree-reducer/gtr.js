// Author: Satia Herfert

(function() {
    var bt = require('./bt');
    var hddScript = require('./hdd');
    var Input = require('./ddInput').Input;
    var TreeLevelInput = hddScript.TreeLevelInput;
    var tfs= require('./transformations');
    var ddmin = require('./ddMin').ddmin;
    var treeCache = require('./treeCache');

    /**
     * An input for the ddmin algorithm that uses a tree as input and uses the nodes of
     * a given level as tokens.
     *
     * Compared to TreeLevelInput for HDD, this TreeLevelALTInput
     * only deletes nodes that were found to be not mandatory using the corpus.
     */
    class TreeLevelALTInput extends Input {
        /**
         *
         * @param {String} pl pl the programming language
         * @param {Node} tree The tree that comprises this input
         * @param {number} level the of the tree at which to consider nodes. Must be >= 1.
         * @param tryAll if all child replacements should be tested, regardless if they are deemed OK from the corpus
         * @param {Array.<number>} activeTokens optional list of indices of tokens
         *                                      in the tokens list that are active. Set to all tokens if omitted.
         * @param {Array} nodesMandatory optional array of boolean values describing for each node of the level
         *                                        whether it is mandatory.
         */
        constructor(pl, tree, level, tryAll, activeTokens, nodesMandatory) {
            if(activeTokens === undefined) {
                // Construct a array of nodes and whether they are mandatory.
                var numToks = 0;
                nodesMandatory = [];
                activeTokens = [];
                tree.applyToLevel(level - 1, function(parent) {
                    for (var i = 0; i < parent.outgoing.length; i++) {
                        // If tryAll is true, we assume no children are mandatory.
                        // Otherwise we use the inferred knowledge
                        var isMandatory = (!tryAll) &&
                            tfs.isMandatoryChildForPL(parent.label, parent.outgoing[i].label, pl);
                        nodesMandatory.push(isMandatory);
                        if(!isMandatory) {
                            // This node may be deleted during the algorithm.
                            // Hence we create a token for it
                            activeTokens.push(numToks);
                            numToks++;
                        }
                    }
                });
            }
            super(activeTokens);
            this.pl = pl;
            this.tree = tree;
            this.level = level;
            this.tryAll = tryAll;
            this.nodesMandatory = nodesMandatory;
        }

        /**
         *
         * @param  {number} num the number of the subset to obtain
         * @return {TreeLevelALTInput} a new input object that has the same tokens, but only
         * those of the specified subset are active
         */
        getSubset(num) {
            return new TreeLevelALTInput(this.pl, this.tree, this.level, this.tryAll, this.chunks[num], this.nodesMandatory);
        }

        /**
         *
         * @param  {number} num the number of the complement to obtain
         * @return {TreeLevelALTInput} a new input object that has the same tokens, but only
         * those of the specified complement are active
         */
        getComplement(num) {
            return new TreeLevelALTInput(this.pl, this.tree, this.level, this.tryAll, super.getComplementChunks(num), this.nodesMandatory);
        }

        /**
         * Tree with all inactive childs of a level removed, including the corresponding subtrees.
         *
         * No knowledge about the tree is used to reduce its size, the nodes are simply removed.
         *
         * @return {Node} a smaller tree.
         */
        get currentCode() {
            // Create a copy of the tree
            var newTree = this.tree.deepCopy();

            var currentChild = 0;
            var currentNonMandatoryChild = 0;
            var ti = this;
            // Go through the previous level and remove the children
            newTree.applyToLevel(this.level - 1, function(node) {
                for (var i = 0; i < node.outgoing.length; i++) {
                    if(!ti.nodesMandatory[currentChild]) {
                        if(ti.activeTokens.indexOf(currentNonMandatoryChild) == -1) {
                            // Debug message
                            //console.log("Removing " + node.outgoing[i].label + " from " + node.label);
                            // Remove this node
                            node.outgoing.splice(i, 1);
                            // Repeat this index
                            i--;
                        }
                        // Increment the child number for all non-mandatory nodes visited
                        currentNonMandatoryChild++;
                    }
                    // Increment the child number for all nodes visited
                    currentChild++;
                }
            });

            return newTree;
        }
    }

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

                    domains.push(assignments);
                }
            });

            //returns a copy of the tree where the nodes assigned "discard" are deleted, and
            //other nodes are replaced.
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

            // After a transformation new assignments can be possible.
            // (e.g., after replace with child, THAT child can also be replaced with one of its children)
            // This function obtains them.
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
     * GTR
     *
     * @param {String} pl the programming language
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @param tryAll if all child replacements should be tested, regardless if they are deemed OK from the corpus
     * @returns {Node} the minimized tree.
     */
    function gtr(pl, tree, test, tryAll) {
        var currentTree = tree;

        for(var level = 1; level <= currentTree.depth() ; level++) {
            console.log("Testing level " + level + " in BTH-TA.");
            // Inclusion of the ddmin that uses inferred knowledge
            currentTree = ddmin(new TreeLevelALTInput(pl, currentTree, level, tryAll), test).currentCode;

            currentTree = bt.bt(new TreeLevelTransformationBTInput(pl, currentTree, level, tryAll), test);
        }
        return currentTree;
    }

    /**
     * GTR* algorithm. Applies GTR repeatedly until no more nodes are removed.
     * This algorithm ensures 1-minimality, unlike BTHTA.
     *
     * @param {String} pl the programming language
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @param tryAll if all child replacements should be tested, regardless if they are deemed OK from the corpus
     * @returns {Node} the minimized tree.
     */
    function gtrStar(pl, tree, test, tryAll) {
        var cachedTest = treeCache.cachedTest(test);
        return hddScript.doWhileTreeShrinks(tree, cachedTest, (pTree, pTest) => bthta(pl, pTree, pTest, tryAll));
    }
    
    exports.gtr = gtr;
    exports.gtrStar = gtrStar;
})();