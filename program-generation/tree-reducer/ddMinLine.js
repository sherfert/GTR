// Author: Satia Herfert

(function() {
    var Input = require('./ddInput').Input;
    var ddmin = require('./ddMin').ddmin;

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
     * Line based ddmin.
     * @param {string} text the program
     * @param {function(string): string} test see ddmin
     * @returns {string} the minimized code.
     */
    function ddminLine(text, test) {
        return ddmin(new LineInput(text), test).currentCode;
    }

    exports.ddminLine = ddminLine;

})();