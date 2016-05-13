// Author: Satia Herfert

(function() {
    var crashTester = require("../js-ast/crashTest-JS");

    /**
     * A method that executes the code and returns an error object obtained from the execution.
     * @type {function(string) : object}
     */
    var testMethod = testWithChildProcess;//testCodeWithTryCatchEval;

    /**
     * Creates a tester that compares subsequent code executions to an execution of the code given here.
     * The comparison is based on the error the code generates.
     * @param initialCode the initial code that servers as a base for comparison
     * @constructor
     */
    function Tester(initialCode) {
        this.initialCode = initialCode;
        // Run the initial code and save error message
        this.errorMessage = testMethod(initialCode);
        console.log("Error obtained: " + this.errorMessage);
    }

    /**
     * Tests a code by executing it and comparing the error to the error obtained in the initial execution.
     * @param {string} code the code to execute
     * @returns {string} "pass" if the code runs without exception, "fail" if the code reproduces the same
     *      error as in the initial execution, "?" if another error is produced.
     */
    Tester.prototype.test = function(code) {
        var errmsg = testMethod(code);
        console.log("Error obtained: " + errmsg);
        if(errmsg == this.errorMessage) {
            // The same error is triggered
            return "fail";
        } else if(!errmsg) {
            // The program runs fine
            return "pass";
        } else {
            // A different error is triggered
            return "?";
        }
    };

    function testWithChildProcess(code) {
        // TODO first run a syntax check because this is slow as hell
        var res = crashTester.crashTestJSCode(code);
        if(res.status == 0) {
            // It ran successfully - no error
            return "";
        } else {
            // Parse stderr and obtain the error message
            var lines = res.stderr.split('\n', 5);
            // Remove the empty line node generates for non-syntax errors (seriously, why!?)
            if(lines[3] === "") {
                lines.splice(3, 1);
            }
            // The third line in the array contains the error message
            return lines[3];
        }
    }

    /**
     * Runs arbitrary code in eval and returns the error, if any.
     * FIXME hangs if the code contains an endless loop.
     * FIXME can create global variables, in which case consecutive executions depend on previous ones
     * @param {string} code the code to execute
     * @returns {string} the message or {@code "" } if the code runs without exception.
     */
    function testCodeWithTryCatchEval(code) {
        console.log("Testing:");
        console.log(code);
        try {
            eval(code);
        } catch(e) {
            return e.toString();
        }
        return "";
    }

    exports.Tester = Tester;
})();