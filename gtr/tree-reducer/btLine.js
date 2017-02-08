// Author: Satia Herfert

(function() {
    var bt = require('./bt');

    /**
     * An input for the bt algorithm that uses text as input and splits it into line-tokens.
     */
    class LineBTInput extends bt.BTInput {
        /**
         * @param {string} text The text that comprises this input
         */
        constructor(text) {

            var domains = [];
            var splits = text.split('\n');
            for(let i = 0; i < splits.length; i++) {
                let assignments = [];
                // Keep the line
                assignments.push(new bt.Assignment(splits[i], 0));
                // Discard the line
                assignments.push(new bt.Assignment("", 1));

                domains.push(assignments);
            }

            var convertToInput = function(objects) {
                // Join the fragments with newlines together.
                //console.log("Input: " + objects.join("\n"));
                return objects.join("\n");
            };

            super(domains, convertToInput);
            this.text = text;
        }
    }

    /**
     * Line based backtracking.
     * @param {string} text the program
     * @param {function(string): string} test see ddmin
     * @returns {string} the minimized code.
     */
    function btLine(text, test) {
        return bt.bt(new LineBTInput(text), test);
    }

    exports.btLine = btLine;

})();