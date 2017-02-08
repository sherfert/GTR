// Author: Satia Herfert

(function() {
    var Input = require('./ddInput').Input;
    var ddmin = require('./ddMin').ddmin;
    
    /**
     * An input for the ddmin algorithm that uses a tree as input and uses the immediate children as tokens.
     */
    class SubTreeInput extends Input {
        /**
         *
         * @param {Node} tree The tree that comprises this input
         * @param {Array.<number>} activeTokens optional list of indices of tokens
         *                                      in the tokens list that are active. Set to all tokens if omitted.
         */
        constructor(tree, activeTokens) {
            // Obtain number of children
            var numToks = tree.outgoing.length;

            if(activeTokens === undefined) {
                activeTokens = [];
                // Initially all tokens are active
                for (var i = 0; i < numToks; i++) {
                    activeTokens.push(i);
                }
            }
            super(activeTokens);
            this.tree = tree;
        }

        /**
         *
         * @param  {number} num the number of the subset to obtain
         * @return {SubTreeInput} a new input object that has the same tokens, but only
         * those of the specified subset are active
         */
        getSubset(num) {
            return new SubTreeInput(this.tree,this.chunks[num]);
        }

        /**
         *
         * @param  {number} num the number of the complement to obtain
         * @return {SubTreeInput} a new input object that has the same tokens, but only
         * those of the specified complement are active
         */
        getComplement(num) {
            return new SubTreeInput(this.tree, super.getComplementChunks(num));
        }

        /**
         * Tree with all inactive childs removed, including the corresponding subtrees.
         *
         * No knowledge about the tree is used to reduce its size, the nodes are simply removed.
         *
         * @return {Node} a smaller tree.
         */
        get currentCode() {
            // Create a copy of the tree
            var newTree = this.tree.deepCopy();

            var currentChild = 0;
            for (var i = 0; i < newTree.outgoing.length; i++) {
                if(this.activeTokens.indexOf(currentChild) == -1) {
                    // Debug message
                    //console.log("Removing " + newTree.outgoing[i].label + " from " + newTree.label);
                    // Remove this node
                    newTree.outgoing.splice(i, 1);
                    // Repeat this index
                    i--;
                }
                // Increment the child number
                currentChild++;
            }

            return newTree;
        }
    }

    /**
     * Recursive delta debugging.
     *
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @returns {Node} the minimized tree.
     */
    function rdd(tree, test) {
        // If the tree is only one node, we can return immediately
        if(tree.outgoing.length == 0) {
            return tree;
        }

        // Start with the immediate children
        var smallerTree = ddmin(new SubTreeInput(tree), test).currentCode;

        // Use recursion to minimize each of the remaining children
        for (var i = 0; i < smallerTree.outgoing.length; i++) {
            // Build another test function that replaces the original subtree with the smaller one
            var recursiveTest = function(subtree) {
                // Attach the subtree to the original tree
                // No need to make copies of the smallerTree here, because the recursive invocation still has a
                // reference to the subtree currently being minimized.
                smallerTree.outgoing[i].target = subtree;
                return test(smallerTree);
            };

            // Replace the child with its minimized version
            smallerTree.outgoing[i].target = rdd(smallerTree.outgoing[i].target, recursiveTest);
        }

        return smallerTree;
    }

    /**
     * RDD* algorithm. Applies RDD repeatedly until no more nodes are removed.
     * This algorithm ensures 1-minimality, unlike RDD.
     *
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @returns {Node} the minimized tree.
     */
    function rddStar(tree, test) {
        var currentTree = tree;
        var nbNodesBefore;
        var nbNodesAfter = currentTree.nbNodes();

        var i = 0;
        do {
            console.log("Iteration " + ++i + " of RDD*");
            nbNodesBefore = nbNodesAfter;
            currentTree = rdd(currentTree, test);
            nbNodesAfter = currentTree.nbNodes();
        } while(nbNodesAfter < nbNodesBefore);

        return currentTree;
    }
    
    exports.rdd = rdd;
    exports.rddStar = rddStar;
})();