// Author: Satia Herfert

(function() {
    var Input = require('./ddInput').Input;
    var ddmin = require('./ddMin').ddmin;

    /**
     * An input for the ddmin algorithm that uses a tree as input and splits it into nodes.
     */
    class TreeInput extends Input {
        /**
         *
         * @param {Node} tree The tree that comprises this input
         * @param {Array.<number>} activeTokens optional list of indices of tokens
         *                                      in the tokens list that are active. Set to all tokens if omitted.
         */
        constructor(tree, activeTokens) {
            // Number of nodes, exluding the root
            var numToks = tree.nbNodes() - 1;
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
         * @return {TreeInput} a new input object that has the same tokens, but only
         * those of the specified subset are active
         */
        getSubset(num) {
            return new TreeInput(this.tree, this.chunks[num]);
        }

        /**
         *
         * @param  {number} num the number of the complement to obtain
         * @return {TreeInput} a new input object that has the same tokens, but only
         * those of the specified complement are active
         */
        getComplement(num) {
            return new TreeInput(this.tree, super.getComplementChunks(num));
        }

        /**
         * Tree with all active nodes together. When deleting nodes, the edges that belonged to the child
         *      (not the parent) will be preserved for new connection.
         * @return {Node} a tree with all active nodes put together.
         */
        get currentCode() {
            // Create a copy of the tree
            var newTree = this.tree.deepCopy();
            // Number all tokens (same traversal order as when flattening in the beginning)
            var num = 0;
            newTree.preorder(function(node) {
                if(node != newTree) {
                    node.number = num++;
                }
            });

            // Keep only the nodes that are active
            var ti = this;
            newTree.preorder( function(node) {
                //Iterate through the children.
                for (var i = 0; i < node.outgoing.length; i++) {
                    var outgoing = node.outgoing[i];
                    var target = outgoing.target;
                    if(ti.activeTokens.indexOf(target.number) == -1) {
                        // Remove the target, providing the parent node
                        ti.removeNode(target, node);
                        // This means the same index needs to be repeated, in case the
                        // target's children have been attached here
                        i--;
                    }
                }
            });

            //console.log("New tree:");
            //console.log(newTree.toString());
            // Return the new tree
            return newTree;
        }

        /**
         * Internal method. Removes a node from a tree.
         * @param {Node} node the node to remove.
         * @param {Node} parent its parent.
         */
        removeNode (node, parent) {
            // First remove the edge from the parent
            var removeIndex;
            var removedEdge;
            for (let i = 0; i < parent.outgoing.length; i++) {
                let outgoing = parent.outgoing[i];
                let target = outgoing.target;
                if(target == node) {
                    removedEdge = outgoing;
                    removeIndex = i;
                    parent.outgoing.splice(i, 1);
                    break;
                }
            }
            // Then attach all children to the parent (at the position this node was removed)
            // Reversed iteration order: elements end up in correct order
            for (let i = node.outgoing.length - 1; i >= 0; --i) {
                let outgoing = node.outgoing[i];
                let target = outgoing.target;

                // This places the label of the parent edge
                //parent.outgoing.splice(removeIndex, 0, new Edge(removedEdge.label, target));
                // The results with this are bad, since the Tree->AST conversion queries the nodes with
                // particular names (which then exist) and tries to obtain members on them (which do not exist)
                // resulting often in a failed conversion.

                // This places the label of the child edge
                parent.outgoing.splice(removeIndex, 0, outgoing);
                // The results with this are better, since nodes have children with edges that do not belong to
                // the node, and thus won't even be queried in the conversion process. Effectively, some parts of
                // the tree will be ignored during conversion, but more trees obtained can actually be converted.
            }
        }
    }

    /**
     * Naive tree based ddmin.
     *
     * All nodes are numbered 0..n, excluding the root node.
     * The numbering is done in pre-order. The normal ddmin algorithm
     * is performed on the set of tokens 0..n. To build a tree with
     * some nodes missing, the following procedure is applied:
     * If a node is not present in the current active subset of tokens,
     * the node will be removed from its parent's list of children. All children
     * of the removed node are attached to the parent node, the new edge gets the
     * label of the edge that previously connected the removed node with the child.
     *
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @returns {Node} the minimized tree.
     */
    function ddminTree(tree, test) {
        return ddmin(new TreeInput(tree), test).currentCode;
    }

    /**
     * Convenience function to execute any tree based algorithm directly on code.
     * It can be used at the moment with ddminTree, hdd and hddStar as the first
     * parameter.
     *
     * @param treeProvider the tree provider
     * @param treeGenerator the tree generator
     * @param {function(Node,function(Node): string):Node} algorithm the tree-based algorithm to use
     * @param {String} code the code to minimize
     * @param {function(string): string} test see below
     * @returns {String} the minimized code.
     */
    function executeWithCode(treeProvider, treeGenerator, algorithm, code, test) {
        var tree = treeProvider.codeToTree(code);

        var internalTest = function(t) {
            var c = treeGenerator.treeToCodeNoFileIO(t);
            if(c instanceof Error) {
                // Return "?" if the tree is not convertable
                return "?";
            }
            return test(c);
        };

        var newTree = algorithm(tree, internalTest);
        return treeGenerator.treeToCodeNoFileIO(newTree);
    }

    exports.ddminTree = ddminTree;
    exports.executeWithCode = executeWithCode;

})();