// Author: Satia Herfert

(function() {
    var loTrees = require("./../labeledOrderedTrees");

    /**
     * Abstract class for all kinds of input to the ddmin algorithm.
     *
     * Subclasses should define the following additional methods:
     * getSubset(num) : Obtain a copy of the input where the active tokens are set to the num'th chunk.
     * getComplement(num) : Obtain a copy of the input where the active tokens are set to the complement of the
     *  num'th chunk.
     * get currentCode() : Obtain the code that corresponds to the current active tokens. The type should be the
     *  same as the input type that was used to create the Input in the beginning.
     */
    class Input {
        /**
         * @param {Array.<number>} activeTokens list of indices of tokens
         *                                      in the tokens list that are active.
         */
        constructor(activeTokens) {
            this.activeTokens = activeTokens;
        }

        /**
         *
         * @return {number} the length of the currently selected subset, that is the
         * number of active tokens.
         */
        get length() {
            return this.activeTokens.length;
        }

        /**
         * Configures the granularity for the subsequent calls to getSubset and
         * getComplement.
         * @param {number} n the number of chunks to split the current subset into.
         */
        set granularity(n) {
            // The maximum size a chunk can have
            var maxChunkSize = Math.ceil(this.activeTokens.length / n);
            // Number of chunks with the maximum length
            var maxLengthChunks = n;
            // Some chunks must be shorter if there is no clean division
            if(this.activeTokens.length % n != 0) {
                maxLengthChunks = this.activeTokens.length % n;
            }

            // Split the activeTokens into n chunks
            var index = 0;
            this.chunks =[];
            for (var i = 0; i < n; i++) {
                var chunkSize = (i < maxLengthChunks) ? maxChunkSize : maxChunkSize - 1;
                this.chunks.push(this.activeTokens.slice(index, index + chunkSize));
                index += chunkSize;
            }
        }

        /**
         * Gets the chunks that are associated with a complement.
         *
         * @param {number} num the number of the complement chunks to obtain
         * @returns {Array} the chunks that are associated with the complement of the given number.
         */
        getComplementChunks(num) {
            var complement = [];
            for (var i = 0; i < this.chunks.length; i++) {
                // Skip the num-th entry
                if(i == num) {
                    continue;
                }
                for (var j = 0; j < this.chunks[i].length; j++) {
                    complement.push(this.chunks[i][j]);
                }
            }
            return complement;
        }
    }

    /**
     * An input for the ddmin algorithm that uses text as input and splits it into char-tokens.
     */
    class TextInput extends Input {
        /**
         *
         * @param {string} text The text that comprises this input
         * @param {Array.<string>} tokens optional tokens of the text.
         *                                Auto-generated if omitted
         * @param {Array.<number>} activeTokens optional list of indices of tokens
         *                                      in the tokens list that are active. Set to all tokens if omitted.
         */
        constructor(text, tokens, activeTokens) {
            if(tokens === undefined) {
                tokens = Array.from(text);
            }
            if(activeTokens === undefined) {
                activeTokens = [];
                // Initially all tokens are active
                for (var i = 0; i < tokens.length; i++) {
                    activeTokens.push(i);
                }
            }
            super(activeTokens);
            this.text = text;
            this.tokens = tokens;
        }

        /**
         *
         * @param  {number} num the number of the subset to obtain
         * @return {TextInput} a new input object that has the same tokens, but only
         * those of the specified subset are active
         */
        getSubset(num) {
            return new TextInput(this.text, this.tokens, this.chunks[num]);
        }

        /**
         *
         * @param  {number} num the number of the complement to obtain
         * @return {TextInput} a new input object that has the same tokens, but only
         * those of the specified complement are active
         */
        getComplement(num) {
            return new TextInput(this.text, this.tokens, super.getComplementChunks(num));
        }

        /**
         * Obtains the code that results from putting all active tokens together.
         * @return {string} the code that is obtained by concatenating all active
         * tokens
         */
        get currentCode() {
            var str = "";
            for (var i = 0; i < this.activeTokens.length; i++) {
                str = str + this.tokens[this.activeTokens[i]];
            }
            return str;
        }
    }

    /**
     * An input for the ddmin algorithm that uses text as input and splits it into line-tokens.
     */
    class LineInput extends Input {
        /**
         *
         * @param {string} text The text that comprises this input
         * @param {Array.<string>} tokens optional tokens of the text.
         *                                Auto-generated if omitted
         * @param {Array.<number>} activeTokens optional list of indices of tokens
         *                                      in the tokens list that are active. Set to all tokens if omitted.
         */
        constructor(text, tokens, activeTokens) {
            if(tokens === undefined) {
                tokens = text.split('\n');
            }
            if(activeTokens === undefined) {
                activeTokens = [];
                // Initially all tokens are active
                for (var i = 0; i < tokens.length; i++) {
                    activeTokens.push(i);
                }
            }
            super(activeTokens);
            this.text = text;
            this.tokens = tokens;
        }

        /**
         *
         * @param  {number} num the number of the subset to obtain
         * @return {LineInput} a new input object that has the same tokens, but only
         * those of the specified subset are active
         */
        getSubset(num) {
            return new LineInput(this.text, this.tokens, this.chunks[num]);
        }

        /**
         *
         * @param  {number} num the number of the complement to obtain
         * @return {LineInput} a new input object that has the same tokens, but only
         * those of the specified complement are active
         */
        getComplement(num) {
            return new LineInput(this.text, this.tokens, super.getComplementChunks(num));
        }

        /**
         * Obtains the code that results from putting all active tokens together.
         * @return {string} the code that is obtained by concatenating all active
         * tokens
         */
        get currentCode() {
            var str = "";
            for (var i = 0; i < this.activeTokens.length; i++) {
                str = str + this.tokens[this.activeTokens[i]] + '\n';
            }
            return str;
        }
    }

    /**
     * An input for the ddmin algorithm that uses a tree as input and splits it into nodes.
     */
    class TreeInput extends Input {
        /**
         *
         * @param {Node} tree The tree that comprises this input
         * @param {Array.<node>} tokens optional nodes of the tree.
         *                                Auto-generated if omitted
         * @param {Array.<number>} activeTokens optional list of indices of tokens
         *                                      in the tokens list that are active. Set to all tokens if omitted.
         */
        constructor(tree, tokens, activeTokens) {
            if(tokens === undefined) {
                tokens = [];
                // Flatten the nodes into an array
                var num = 0;
                tree.preorder(function(node) {
                    tokens.push(node);
                    if(node != tree) {
                        node.number = num++;
                    }
                });
                // Remove the root, since it is not eligible for removal
                tokens.splice(0,1);
                console.log("len:" + tokens.length);
                console.log(tree.toString());
            }
            if(activeTokens === undefined) {
                activeTokens = [];
                // Initially all tokens are active
                for (var i = 0; i < tokens.length; i++) {
                    activeTokens.push(i);
                }
            }
            super(activeTokens);
            this.tree = tree;
            this.tokens = tokens;
        }

        /**
         *
         * @param  {number} num the number of the subset to obtain
         * @return {TreeInput} a new input object that has the same tokens, but only
         * those of the specified subset are active
         */
        getSubset(num) {
            return new TreeInput(this.tree, this.tokens, this.chunks[num]);
        }

        /**
         *
         * @param  {number} num the number of the complement to obtain
         * @return {TreeInput} a new input object that has the same tokens, but only
         * those of the specified complement are active
         */
        getComplement(num) {
            return new TreeInput(this.tree, this.tokens, super.getComplementChunks(num));
        }

        /**
         * Tree with all active nodes together. When deleting nodes, the edges that belonged to the parent
         *      (not the child) will be preserved for new connection.
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
            // Attach incoming edges to the nodes, so we can find the parent while traversing the tree
            newTree.attachIncomingEdges();

            // FIXME This is still buggy. The list of edges is changed while preorder iterates over it
            // Keep only the nodes that are active
            var activeTokens = this.activeTokens;
            newTree.preorder( function(node) {
                if(node != newTree && activeTokens.indexOf(node.number) == -1) {
                    // The node is removed
                    console.log("removing node " + node.number);

                    // First remove the edge from the parent
                    var parent = node.incoming.target;
                    var removeIndex;
                    for (let i = 0; i < parent.outgoing.length; i++) {
                        let outgoing = parent.outgoing[i];
                        let target = outgoing.target;
                        if(target == node) {
                            console.log("Removing edge " + outgoing.label);
                            parent.outgoing.splice(i, 1);
                            removeIndex = i;
                            break;
                        }
                    }
                    // Then attach all children to the parent (at the position this node was removed)
                    // Reversed iteration order: elements end up in correct order
                    for (let i = node.outgoing.length - 1; i >= 0; --i) {
                        let outgoing = node.outgoing[i];
                        let target = outgoing.target;
                        parent.outgoing.splice(removeIndex, 0, new loTrees.Edge(node.incoming.label, target));
                    }
                }
            });

            console.log("New tree:");
            console.log(newTree.toString());
            // Return the new tree
            return newTree;
        }
    }

    // TODO comments

    function ddminTree(tree, test) {
        return ddmin(new TreeInput(tree), test).currentCode;
    }

    function ddminChar(text, test) {
        return ddmin(new TextInput(text), test).currentCode;
    }

    function ddminLine(text, test) {
        return ddmin(new LineInput(text), test).currentCode;
    }

    // A map that serves as a cache for ddmin
    var cache;

    /**
     * Implements a generic ddmin algorithm. The input needs to be of type Input
     * or a descendant.
     * @param  {Input} input    The Input to minimize
     * @param  {function(string): string} test  a test function that evaluates a
     *                                    predicate, given the code and returns "fail" if the test fails, "pass" if
     *                                    the test passes, and "?" if the test is undecidable
     * @return {Input}       The minimized input.
     */
    function ddmin(input, test) {
        // Empty the cache
        cache = {};
        return ddmin2(input, 2, test);
    }

    /**
     * The implementation of ddmin with a current granularity.
     * @param  {Input} input The Input to minimize
     * @param  {number} n     the granularity
     * @param  {function(string): string} test  s.a.
     * @return {Input}       The minimized input.
     */
    function ddmin2(input, n, test) {
        var len = input.length;
        if(len == 1) {
            // No further minimization possible
            console.log("Return' subset: " + input.activeTokens);
            return input;
        }

        // Set the granularity on the input
        input.granularity = n;

        // Try reducing to subset
        for(let i = 0; i < n; i++) {
            // Obtain subset
            let subset = input.getSubset(i);
            let result;
            // Check the cache
            let key = subset.activeTokens.toString();
            if(cache.hasOwnProperty(key)) {
                console.log("Using cached value");
                result = cache[key];
            } else {
                console.log("Testing subset: " + key);
                // No cached value available
                result = test(subset.currentCode);
                // Cache the result
                cache[key] = result;
            }

            console.log("Testing result: " + result);
            // Test the subset
            if(result == "fail") {
                console.log("Continue with subset and granularity " + 2
                    + " and length " + subset.length);
                return ddmin2(subset, 2, test);
            }
        }

        // Try reducing to complement
        for(let i = 0; i < n; i++) {
            // Obtain subset
            let subset = input.getComplement(i);
            let result;
            // Check the cache
            let key = subset.activeTokens.toString();
            if(cache.hasOwnProperty(key)) {
                console.log("Using cached value");
                result = cache[key];
            } else {

                console.log("Testing complm: " + key);
                // No cached value available
                result = test(subset.currentCode);
                // Cache the result
                cache[key] = result;
            }

            console.log("Testing result: " + result);
            // Test the subset
            if(result == "fail") {
                console.log("Continue with complement and granularity " + Math.max(n - 1, 2)
                    + " and length " + subset.length);
                return ddmin2(subset, Math.max(n - 1, 2), test);
            }
        }

        if(n < len) {
            // Increase granularity
            console.log("Increasing granularity to " + Math.min(len, 2 * n));
            return ddmin2(input, Math.min(len, 2 * n), test);
        }

        // Otherwise done
        console.log("Return' subset: " + input.activeTokens);
        return input;
    }

    exports.ddminTree = ddminTree;
    exports.ddminChar = ddminChar;
    exports.ddminLine = ddminLine;
})();