// Author: Satia Herfert

(function() {
    var Input = require('./ddInput').Input;
    var ddmin = require('./ddMin').ddmin;
    
    /**
     * An input for the ddmin algorithm that uses a tree as input and uses the nodes of
     * a given level as tokens.
     */
    class TreeLevelInput extends Input {
        /**
         *
         * @param {Node} tree The tree that comprises this input
         * @param {number} level the of the tree at which to consider nodes. Must be >= 1.
         * @param {Array.<number>} activeTokens optional list of indices of tokens
         *                                      in the tokens list that are active. Set to all tokens if omitted.
         */
        constructor(tree, level, activeTokens) {
            // Obtain number of nodes in the level
            var numToks = 0;
            tree.applyToLevel(level, function(node) {
                numToks++;
            });

            if(activeTokens === undefined) {
                activeTokens = [];
                // Initially all tokens are active
                for (var i = 0; i < numToks; i++) {
                    activeTokens.push(i);
                }
            }
            super(activeTokens);
            this.tree = tree;
            this.level = level;
        }

        /**
         *
         * @param  {number} num the number of the subset to obtain
         * @return {TreeLevelInput} a new input object that has the same tokens, but only
         * those of the specified subset are active
         */
        getSubset(num) {
            return new TreeLevelInput(this.tree, this.level, this.chunks[num]);
        }

        /**
         *
         * @param  {number} num the number of the complement to obtain
         * @return {TreeLevelInput} a new input object that has the same tokens, but only
         * those of the specified complement are active
         */
        getComplement(num) {
            return new TreeLevelInput(this.tree, this.level, super.getComplementChunks(num));
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
            var ti = this;
            // Go through the previous level and remove the children
            newTree.applyToLevel(this.level - 1, function(node) {
                for (var i = 0; i < node.outgoing.length; i++) {
                    if(ti.activeTokens.indexOf(currentChild) == -1) {
                        // Debug message
                        //console.log("Removing " + node.outgoing[i].label + " from " + node.label);
                        // Remove this node
                        node.outgoing.splice(i, 1);
                        // Repeat this index
                        i--;
                    }
                    // Increment the child number
                    currentChild++;
                }
            });

            return newTree;
        }
    }

    /**
     * Hierarchical delta debugging.
     *
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @returns {Node} the minimized tree.
     */
    function hdd(tree, test) {
        var currentTree = tree;

        // In the original they start with level 0, but we skip the root.
        for(var level = 1; level <= currentTree.depth() ; level++) {
            console.log("Testing level " + level + " in HDD.");
            // XXX Here we are calling currentCode again (ddmin called it before with the same result
            // in the last iteration.) Caching the result would be an optimization.
            currentTree = ddmin(new TreeLevelInput(currentTree, level), test).currentCode;
        }

        return currentTree;
    }

    /**
     * HDD* algorithm. Applies HDD repeatedly until no more nodes are removed.
     * This algorithm ensures 1-minimality, unlike HDD.
     *
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @returns {Node} the minimized tree.
     */
    function hddStar(tree, test) {
        var currentTree = tree;
        var nbNodesBefore;
        var nbNodesAfter = currentTree.nbNodes();

        var i = 0;
        do {
            console.log("Iteration " + ++i + " of HDD*");
            nbNodesBefore = nbNodesAfter;
            currentTree = hdd(currentTree, test);
            nbNodesAfter = currentTree.nbNodes();
        } while(nbNodesAfter < nbNodesBefore);

        return currentTree;
    }
    
    exports.hdd = hdd;
    exports.hddStar = hddStar;
})();