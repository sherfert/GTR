// Author: Satia Herfert

(function() {

    class Assignment {
        constructor(obj, gain) {
            this.obj = obj;
            this.gain = gain;
        }
    }

    class BTInput {
        constructor(domains, convertToInput) {
            this.domains = domains;
            this.convertToInput = convertToInput;
        }

        toObjects(config) {
            var res = [];
            for(let i = 0; i < config.length; i++) {
                res.push(this.domains[i][config[i]].obj);
            }
            return res;
        }

        toInput(config) {
            return this.convertToInput(this.toObjects(config));
        }
    }

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
                // Check each assignment that is right of the current assignment
                for(let j = currentAssignment + 1; j < btInput.domains[i].length; j++) {
                    // Only check the assingment if its gain is better
                    if(btInput.domains[i][j].gain <= btInput.domains[i][currentAssignment].gain) {
                        continue;
                    }

                    conf[i] = j;
                    // Test the current assignment
                    var result = testInput(btInput.toInput(conf));

                    if(result == "fail") {
                        // If it is valid, we mark that an improvement was found
                        improvementFound = true;
                        // Save the new current assignment
                        currentAssignment = conf[i];
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