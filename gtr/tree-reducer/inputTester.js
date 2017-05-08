// Author: Satia Herfert

(function () {
    var tmp = require('tmp');
    var fs = require('fs');
    const path = require('path');
    var child_process = require('child_process');
    var request = require('request');
    var deasync = require('deasync');
    const xmlProvider = require('../../program-generation/xml/xmlProvider');
    const xmlGenerator = require('../../program-generation/xml/xmlGenerator');


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
            var countingTest = function (input) {
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

    class XMLTester extends Tester {
        constructor(ddAlgo, filename) {
            super(function (x) {
                return this.test(x);
            }, ddAlgo);

            this.commandPre = "../program-generation/xml/libxml2-2.9.4/xmllint";
            this.commandPost = "> /dev/null && ../program-generation/xml/gcovr/scripts/gcovr -s -r ../program-generation/xml/libxml2-2.9.4/ | tail -2 | cut -d '(' -f 2 | cut -d ' ' -f 1";

            /* Converted the original XML to tree back and forth to have a consistent coverage measurement */
            let originalXML = fs.readFileSync(filename, {encoding: "utf8"});
            let convertedXML = xmlGenerator.treeToCode(xmlProvider.codeToTree(originalXML));

            let result = this.runCommand(convertedXML);
            let splitCov = ("" + result.stdout).split("\n");
            this.initial_line_cov = splitCov[0];
            this.initial_branch_cov = splitCov[1];
        }

        /**
         * Tests an input by executing it and checking if the status code
         * @param {object} input the input to execute
         * @returns {string} "pass" if the input runs without exception, "fail" if the input reproduces the error
         */
        test(input) {
            var result = this.runCommand(input);
            let splitCov = ("" + result.stdout).split("\n");
            let line_cov = splitCov[0];
            let branch_cov = splitCov[1];
            // For debugging:
            // TODO: JP continue from here. The return value of the following should be line and branch coverage separated by a ','
            //console.log(JSON.stringify(result, 0, 2));
            //console.log("" + result.stderr);
            console.log(branch_cov + " vs " + this.initial_branch_cov);
            console.log(line_cov + " vs " + this.initial_line_cov);

            /* Right now the property we are tying to preserve is same coverage */
            if (branch_cov === this.initial_branch_cov && line_cov === this.initial_line_cov) {
                return "fail"; // property OK
            } else {
                return "pass"; // property not OK
            }
        }

        runCommand(code) {
            // Write the code to a temporary file (will be removed by library)
            let file = tmp.fileSync({prefix: 'crashtest-', postfix: '.xml'});
            fs.writeFileSync(file.name, code);
            //fs.writeFileSync("test.xml", code);


            // Reset coverage
            child_process.spawnSync('find . -name "*.gcda" -type f -delete', [], {
                shell: true,
                cwd: "../program-generation/xml/libxml2-2.9.4"
            });

            // Return the result of spawning a child process
            var finalCmd = this.commandPre + " " + file.name + " " + this.commandPost;
            var result = child_process.spawnSync(finalCmd, [], {
                shell: true,
                timeout: 5000,
                killSignal: 'SIGKILL'
            });

            // We have to clean up files in the tmp folder, otherwise we produce a lot of garbage
            child_process.spawnSync("rm *.xml", [], {
                shell: true,
                cwd: "/tmp",
            });

            return result;
        }
    }

    /**
     * Tests whether PDFs are classified as malicious according to PDF scrutinizer.
     */
    class PDFMaliciousnessTester extends Tester {
        /**
         * @param ddAlgo the DD algorithm
         */
        constructor(ddAlgo) {
            super(function (x) {
                return this.test(x);
            }, ddAlgo);
            this.commandPre = "(cd ../pdf-scrutinizer && exec ./run.sh -pdf";
            this.commandPost = "| tail -1 | grep 'malicious')";
        }

        /**
         * Tests an input by executing it and checking if the status code
         * @param {object} input the input to execute
         * @returns {string} "pass" if the input runs without exception, "fail" if the input reproduces the error
         */
        test(input) {
            var result = this.runCommand(input);
            // For debugging:
            //console.log("" +result.stderr);
            if (result.status == 0) {
                return "fail"; // property OK
            } else {
                return "pass"; // property not OK
            }
        }

        runCommand(code) {
            // Write the code to a temporary file (will be removed by library)
            let file = tmp.fileSync({prefix: 'crashtest-', postfix: '.pdf'});
            fs.writeFileSync(file.name, code);
            // Return the result of spawning a child process
            var finalCmd = this.commandPre + " " + file.name + " " + this.commandPost;
            var result = child_process.spawnSync(finalCmd, [], {
                shell: true,
                timeout: 5000,
                killSignal: 'SIGKILL'
            });

            // We have to clean up files in the tmp folder, otherwise we produce a lot of garbage
            child_process.spawnSync("rm *.pdf", [], {
                shell: true,
                cwd: "/tmp",
            });

            return result;
        }
    }

    /**
     *  Tests any python or javascript code with a user provided shell script as an oracle.
     */
    class ShellOracleTester extends Tester {

        /**
         * @param command The shell command to invoke
         * @param ddAlgo the DD algorithm
         * @param postfix ".py" or ".js"
         */
        constructor(command, ddAlgo, postfix) {
            super(function (x) {
                return this.test(x);
            }, ddAlgo);
            this.command = command;
            this.postfix = postfix;
        }

        /**
         * Tests an input by executing it and checking if the command crashes.
         * @param {object} input the input to execute
         * @returns {string} "pass" if the input runs without exception, "fail" if the input reproduces the error
         */
        test(input) {
            var result = this.runCommand(input, this.postfix);
            if (result.status == 0) {
                return "fail";
            } else {
                return "pass";
            }
        }

        runCommand(code, postfix) {
            // Write the code to a temporary file (will be removed by library)
            let file = tmp.fileSync({prefix: 'crashtest-', postfix: postfix});
            fs.writeFileSync(file.name, code);
            // Return the result of spawning a child process
            var finalCmd = this.command + " " + file.name;
            var result = child_process.spawnSync(finalCmd, [], {
                shell: true,
                timeout: 500,
                killSignal: 'SIGKILL'
            });

            // We have to clean up files in the tmp folder, otherwise we produce a lot of garbage
            child_process.spawnSync("rm *" + postfix, [], {
                shell: true,
                cwd: "/tmp",
            });

            return result;
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
            super(function (x) {
                return this.test(x);
            }, ddAlgo);
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
            if (result.status == 134 || result.status == 139) {
                // The same error is triggered
                return "fail";
            } else {
                // No compiler crash
                return "pass";
            }
        }

        runCommand(code) {
            // Write the code to a temporary file (will be removed by library)
            let file = tmp.fileSync({prefix: 'crashtest-', postfix: '.py'});
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

            // We have to clean up files in the tmp folder, otherwise we produce a lot of garbage
            child_process.spawnSync("rm *.py ", [], {
                shell: true,
                cwd: "/tmp",
            });

            // We have to kill remaining python processes (not handled properly)
            child_process.spawnSync("pkill python", [], {
                encoding: 'utf8',
                shell: true,
                cwd: "/tmp",
                timeout: 500,
                killSignal: 'SIGKILL'
            });

            return result;
        }
    }

    /**
     *  Tests any python command for crashes, by sending HTTP requests to a server that
     *  executes the files.
     *
     *  The server must have been started. Port 9000.
     */
    class PyServerCrashTester extends Tester {

        /**
         * @param command The shell command to invoke
         * @param ddAlgo the DD algorithm
         */
        constructor(command, ddAlgo) {
            super(function (x) {
                return this.test(x);
            }, ddAlgo);
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
            if (result == -11 || result == -6) {
                // The same error is triggered
                return "fail";
            } else {
                // No compiler crash
                return "pass";
            }
        }

        runCommand(code) {
            // Write the code to a temporary file (will be removed by library)
            let file = tmp.fileSync({prefix: 'crashtest-', postfix: '.py'});
            fs.writeFileSync(file.name, code);
            let shortName = (file.name + "").slice(5);

            // Launch a HTTP request to get the result.
            var done = false;
            var data = "1";
            request('http://localhost:9000/run/' + this.command + '/' + shortName,
                function (err, res, body) {
                    done = true;
                    if (!err && res.statusCode == 200) {
                        data = body;
                    }
                });
            deasync.loopWhile(function () {
                return !done;
            });


            var resInt = parseInt(data + "");

            return resInt;
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
            super(function (x) {
                return this.test(x);
            }, ddAlgo);
            this.command = command;
        }

        /**
         * Tests an input by executing it and checking if GCC/G++ crashes.
         * @param {object} input the input to execute
         * @returns {string} "pass" if the input runs without exception, "fail" if the input reproduces the error
         */
        test(input) {
            var result = this.runGcc(input);
            if (result.status == 0) {
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
            let file = tmp.fileSync({prefix: 'gcctest-', postfix: '.c'});
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

            // We have to clean up files in the tmp folder, otherwise we produce a lot of garbage
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
    exports.XMLTester = XMLTester;
    exports.PDFMaliciousnessTester = PDFMaliciousnessTester;
    exports.ShellOracleTester = ShellOracleTester;
    exports.PyCrashTester = PyCrashTester;
    exports.PyServerCrashTester = PyServerCrashTester;
    exports.GCCCrashTester = GCCCrashTester;
})();