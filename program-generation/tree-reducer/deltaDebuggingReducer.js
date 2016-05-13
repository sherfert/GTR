// Author: Satia Herfert

(function() {

    // TODO extract all input independent methods to a common supertype

    /**
     *
     * @param {string} text The text that comprises this input
     * @param {Array.<string>} tokens optional tokens of the text.
     *                                Auto-generated if omitted
     * @param {Array.<number>} activeTokens optional list of indices of tokens
     *                                      in the tokens list that are active. Set to all tokens if omitted.
     */
    function TextInput(text, tokens, activeTokens) {
        this.text = text;

        if(tokens === undefined) {
            tokens = Array.from(text);
        }
        this.tokens = tokens;

        if(activeTokens === undefined) {
            activeTokens = [];
            // Initially all tokens are active
            for (var i = 0; i < tokens.length; i++) {
                activeTokens.push(i);
            }
        }
        this.activeTokens = activeTokens;
    }

    /**
     *
     * @return {number} the length of the currently selected subset, that is the
     * number of active tokens.
     */
    TextInput.prototype.getLength = function() {
        return this.activeTokens.length;
    };

    /**
     * Configures the granularity for the subsequent calls to getSubset and
     * getComplement.
     * @param {number} n the number of chunks to split the current subset into.
     */
    TextInput.prototype.setGranularity = function(n) {
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
    };

    /**
     *
     * @param  {number} num the number of the subset to obtain
     * @return {TextInput} a new input object that has the same tokens, but only
     * those of the specified subset are active
     */
    TextInput.prototype.getSubset = function(num) {
        return new TextInput(this.text, this.tokens, this.chunks[num]);
    };

    /**
     *
     * @param  {number} num the number of the complement to obtain
     * @return {TextInput} a new input object that has the same tokens, but only
     * those of the specified complement are active
     */
    TextInput.prototype.getComplement = function(num) {
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
        return new TextInput(this.text, this.tokens, complement);
    };

    /**
     * Obtains the code that results from putting all active tokens together.
     * @return {string} the code that is obtained by concatenating all active
     * tokens
     */
    TextInput.prototype.getCurrentCode = function() {
        var str = "";
        for (var i = 0; i < this.activeTokens.length; i++) {
            str = str + this.tokens[this.activeTokens[i]];
        }
        return str;
    };

    function ddminTree(tree, test) {
        return tree;
    }

    function ddminChar(text, test) {
        return ddmin(new TextInput(text), test).getCurrentCode();
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
        var len = input.getLength();
        if(len == 1) {
            // No further minimization possible
            console.log("Return' subset: " + input.activeTokens);
            return input;
        }

        // Set the granularity on the input
        input.setGranularity(n);

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
                // No cached value available
                result = test(subset.getCurrentCode());
                // Cache the result
                cache[key] = result;
            }

            console.log("Testing subset: " + key + "\n\tyields " + result);
            // Test the subset
            if(result == "fail") {
                console.log("Continue with subset and granularity " + 2
                    + " and length " + subset.getLength());
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
                // No cached value available
                result = test(subset.getCurrentCode());
                // Cache the result
                cache[key] = result;
            }

            console.log("Testing complm: " + subset.activeTokens + "\n\tyields " + result);
            // Test the subset
            if(result == "fail") {
                console.log("Continue with complement and granularity " + Math.max(n - 1, 2)
                    + " and length " + subset.getLength());
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
})();