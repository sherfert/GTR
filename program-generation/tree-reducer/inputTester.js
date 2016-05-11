// Author: Satia Herfert

(function() {
    var crashTester = require("../js-ast/crashTest-JS");

    /**
     * A method that executes the code and returns an error object obtained from the execution.
     * @type {function(string) : object}
     */
    var testMethod = testCodeWithTryCatchEval;//crashTester.crashTestJSCode;

    /**
     * Creates a tester that compares subsequent code executions to an execution of the code given here.
     * The comparison is based on the error the code generates.
     * @param initialCode the initial code that servers as a base for comparison
     * @constructor
     */
    function Tester(initialCode) {
        this.initialCode = initialCode;
        // Run the initial code and save error type and message
        var e = testMethod(initialCode);
        console.log("Error obtained: " + e);
        this.errorType = e.name;
        this.errorMessage = e.message;
    }

    /**
     * Tests a code by executing it and comparing the error to the error obtained in the initial execution.
     * @param {string} code the code to execute
     * @returns {string} "pass" if the code runs without exception, "fail" if the code reproduces the same
     *      error as in the initial execution, "?" if another error is produced.
     */
    Tester.prototype.test = function(code) {
        var e = testMethod(code);
        console.log("Error obtained: " + e);
        if(e.name == this.errorType && e.message == this.errorMessage) {
            // The same error is triggered
            return "fail";
        } else if(!e.name) {
            // The program runs fine
            return "pass";
        } else {
            // A different error is triggered
            return "?";
        }
    };

    /**
     * Runs arbitrary code in eval and returns the error, if any.
     * FIXME hangs if the code contains an endless loop.
     * FIXME can create global variables, in which case consecutive executions depend on previous ones
     * @param {string} code the code to execute
     * @returns {object} the error or {@code {name: "", message:""} } if the code runs without exception.
     */
    function testCodeWithTryCatchEval(code) {
        console.log("Testing:");
        console.log(code);
        try {
            eval(code);
        } catch(e) {
            return e;
        }
        return {name: "", message:""};
    }

    exports.Tester = Tester;
})();