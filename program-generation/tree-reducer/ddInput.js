// Author: Satia Herfert

(function() {

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

    exports.Input = Input;

})();