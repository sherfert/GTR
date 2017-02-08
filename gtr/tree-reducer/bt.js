// Author: Satia Herfert

(function() {

    /**
     * An assignment for the BT algorithm is characterized by an object that MAY be used to build the input
     * in the convertToInput function; and a gain that specifies how good an assignment is. A gain of zero
     * signals that if the variable is assigned this values, the input will not shrink.
     */
    class Assignment {
        constructor(obj, gain) {
            this.obj = obj;
            this.gain = gain;
        }
    }

    /**
     * Input class for the BT algorithm. Subclasses MUST define an array of domains, and an convertToInput function.
     *
     * Each domain array contains Assignments for that variable. The number of variables is deduced from the length of the array.
     * Each domain MUST start contain Assignments ordered by gain and MUST start with an assignment of gain 0.
     *
     * The user-defined convertToInput is a function that accepts as input the result of toObjects with the current
     * configuration. From these objects it builds an object that can be passed to the testInput function of bt.
     * Given a configuration where each variable is asigned the first value of its domain, convertToInput MUST return
     * exactly the original input.
     *
     * Another function getNewAssignment MAY be defined. This function is called each time the bt algorithm finds a
     * valid assignment for a variable that is better than the current one. It MUST return an array of new assignments,
     * that became possible through the current re-assignment. The function MUST accept one argument, which is the current
     * assignment. The returned assignments are stored in the domain after the last entry!
     */
    class BTInput {
        constructor(domains, convertToInput, getNewAssignments) {
            this.domains = domains;
            this.convertToInput = convertToInput;

            // Assign a default function if none is provided
            if(getNewAssignments) {
                this.getNewAssignments = getNewAssignments;
            } else {
                this.getNewAssignments = (a) => undefined;
            }
        }

        /**
         * Converts a confuration (assignments for all variables) to an array of objects, where each object is the one
         * obtained from assignment.obj of the current assignment.
         * @param config the configuration.
         * @returns {Array} an array of objects.
         */
        toObjects(config) {
            var res = [];
            for(let i = 0; i < config.length; i++) {
                res.push(this.domains[i][config[i]].obj);
            }
            return res;
        }

        /**
         * Converts a configuration to in input that testInput in bt will accept. This is done by first
         * converting the configuration to an array of objects using toObjects and then invoking the user-defined
         * convertToInput with this array.
         *
         * @param config the configuration
         * @returns {object} an input for the testInput function.
         */
        toInput(config) {
            return this.convertToInput(this.toObjects(config));
        }
    }

    /**
     * Backtracking algorithm to reduce input sizes. In contrast to ddmin, it tries to look at the chunks
     * in isolation (not combination of chunks). But it allows a chunk/variable to have more than two
     * possible values (keep/delete) as in ddmin, that can be defined by the user of this function.
     *
     * This algorithm considers a set of variables that each can have different domains. The values in a domain
     * MUST be ordered by a "gain" that specifies how good an assignment is. Each domain MUST start with one
     * value that has a gain of 0 (no empty domains allowed). ConvertToInput given a configuration where each
     * variable is asigned the first value of its domain MUST return exactly the original input.
     *
     * The algorithm iterates over all variables and tries assigning values with a better gain. The iteration is
     * repeated as long as at least one variable could be re-assigned in the previous iteration.
     *
     * The result is the object obtained from converToInput given the final configuration in the algorithm.
     *
     * @param {BTInput} btInput a subclass of BTInput that defines the domains and a convertToInput function.
     * @param {function(*): string} testInput a function that tests a current assignment
     *                  (converted with convertToInput) and returns "fail" if the test fails, "pass" if
     *                  the test passes, and "?" if the test is undecidable.
     * @returns {object}       The minimized input converted with convertToInput.
     */
    function bt(btInput, testInput) {
        // Create initial configuration
        var conf = [];
        for(let i = 0; i < btInput.domains.length; i++) {
            // For each domain the first possible assignment
            conf.push(0);
        }

        let improvementFound = false;
        do {
            improvementFound = false;

            // Try to maximize the variables one by one
            for(let i = 0; i < btInput.domains.length; i++) {

                var currentAssignment = conf[i];
                // Check each assignment that is right of the current assignment (by starting with the last one)
                for(let j = btInput.domains[i].length - 1; j > currentAssignment; j--){
                    // Only check the assingment if its gain is better
                    if(btInput.domains[i][j].gain <= btInput.domains[i][currentAssignment].gain) {
                        continue;
                    }

                    // Assign that value
                    conf[i] = j;
                    // Test the current assignment
                    var result = testInput(btInput.toInput(conf));

                    if(result == "fail") {
                        // If it is valid, we mark that an improvement was found
                        improvementFound = true;
                        // Save the new current assignment
                        currentAssignment = conf[i];

                        // See if new assignments became available
                        var newAssignments = btInput.getNewAssignments(btInput.domains[i][j]);
                        if(newAssignments) {
                            // Insert the new assignments after the last entry (insert array into another)
                            Array.prototype.splice.apply(btInput.domains[i],
                                [btInput.domains[i].length, 0].concat(newAssignments));

                            // We have to start over to test the new assignments
                            // Set to after last element, so that after the loop decrement it will point to
                            // the last of the newly inserted elements
                            j = btInput.domains[i].length;
                        }
                    } else {
                        // If not, we revert to the original assignment
                        conf[i] = currentAssignment;
                    }
                }
            }
        } while(improvementFound);

        // Return the final assignment
        return btInput.toInput(conf);
    }
    
    exports.bt = bt;
    exports.Assignment = Assignment;
    exports.BTInput = BTInput;

})();