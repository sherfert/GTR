// Author: Satia Herfert

(function() {
    var tmp = require('tmp');
    var fs = require('fs');
    var child_process = require('child_process');


    /**
     * The most general tester that takes care of connecting the oracle and the DD algorithm,
     * and keeps track of the number of invocations of the test method and the time taken.
     */
    class Tester {

        constructor(ddTestMethod, ddAlgo) {
            // The oracle that tells whether the invocation of an input passed or failed
            this.ddTestMethod = ddTestMethod;
            // The DD algorithm that is used to reduce the input
            this.ddAlgo = ddAlgo;
            // This counter stores the number of tests run so far.
            this.testsRun = 0;
        }

        runTest(initialInput) {
            var that = this;
            var countingTest = function(input) {
                that.testsRun++;
                var startTimeO = process.hrtime();
                var res = that.ddTestMethod(input);
                var timeTakenO = process.hrtime(startTimeO);
                that.timeInOracle += timeTakenO[0] * 1e9 + timeTakenO[1];
                return res;
            };

            this.timeInOracle = 0;
            var startTime = process.hrtime();
            var res = this.ddAlgo(initialInput, countingTest);
            var timeArray = process.hrtime(startTime);
            this.timeTaken = timeArray[0] * 1e9 + timeArray[1];
            
            return res;
        }
    }


    /**
     *  Tests any python command for crashes.
     */
    class PyCrashTester extends Tester {

        /**
         * @param command The shell command to invoke
         * @param ddAlgo the DD algorithm
         */
        constructor(command, ddAlgo) {
            super(function(x) {return this.test(x);}, ddAlgo);
            this.command = command;
        }

        /**
         * Tests an input by executing it and checking if the command crashes.
         * @param {object} input the input to execute
         * @returns {string} "pass" if the input runs without exception, "fail" if the input reproduces the error
         */
        test(input) {
            var result = this.runCommand(input);
            // Stack overflow or segmentation fault
            if(result.status == 134 || result.status == 139) {
                // The same error is triggered
                return "fail";
            } else {
                // No compiler crash
                return "pass";
            }
        }

        runCommand(code) {
            // Write the code to a temporary file (will be removed by library)
            let file = tmp.fileSync({ prefix: 'crashtest-', postfix: '.py' });
            fs.writeFileSync(file.name, code);
            // Return the result of spawning a child process
            var finalCmd = this.command + " " + file.name;
            var result = child_process.spawnSync(finalCmd, [], {
                //encoding: 'utf8',
                shell: true,
                cwd: "/tmp",
                timeout: 500,
                killSignal: 'SIGKILL'
            });

            // We have to cleap up files in the tmp folder, otherwise we produce a lot of garbage
            child_process.spawnSync("rm *.py ", [], {
                shell: true,
                cwd: "/tmp",
            });

            return result;
        }
    }

    /**
     *  Tests gcc/g++ for crashes.
     */
    class GCCCrashTester extends Tester {

        /**
         * @param command: The shell command to invoke to compile the file
         * @param ddAlgo the DD algorithm
         */
        constructor(command, ddAlgo) {
            super(function(x) {return this.test(x);}, ddAlgo);
            this.command = command;
        }

        /**
         * Tests an input by executing it and checking if GCC/G++ crashes.
         * @param {object} input the input to execute
         * @returns {string} "pass" if the input runs without exception, "fail" if the input reproduces the error
         */
        test(input) {
            var result = this.runGcc(input);
            if(result.status == 0) {
                // The same error is triggered (grep was successful)
                return "fail";
            } else {
                // No compiler crash
                return "pass";
            }
        }

        runGcc(code) {
            var commandSuffix = "2>&1 | grep -i 'internal compiler error'";
            // Write the code to a temporary file (will be removed by library)
            let file = tmp.fileSync({ prefix: 'gcctest-', postfix: '.c' });
            fs.writeFileSync(file.name, code);
            // Return the result of spawning a child process
            var finalCmd = this.command + " " + file.name + " " + commandSuffix;
            var result = child_process.spawnSync(finalCmd, [], {
                encoding: 'utf8',
                shell: true,
                cwd: "/tmp",
                timeout: 500,
                killSignal: 'SIGKILL'
            });

            // We have to cleap up files in the tmp folder, otherwise we produce a lot of garbage
            child_process.spawnSync("rm *.o *.out *.c", [], {
                encoding: 'utf8',
                shell: true,
                cwd: "/tmp",
                timeout: 500,
                killSignal: 'SIGKILL'
            });

            return result;
        }
    }

    exports.Tester = Tester;
    exports.PyCrashTester = PyCrashTester;
    exports.GCCCrashTester = GCCCrashTester;
})();