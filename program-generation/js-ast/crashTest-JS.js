/**
 * Created by Jibesh Patra on 11 March, 2016.
 * Time: 17:31
 */
(function () {
    "use strict";
    var config = require("../config").config;
    var fs = require('fs');
    var child_process = require('child_process');
    var tmp = require('tmp');

    /**
     * Tests if a randomly generated program crashes in node.
     *
     * @param {string} filename - The filename to crash test on
     * @param {string} directory - The path of file that needs to be crash tested
     * @returns {string} 'pass' if the crash test passes, 'fail' other-wise
     * */
    function crashTestJS(filename, directory) {
        let nodePath = config.nodePath;
        let test_result = "pass";

        /* Check if node exists */
        if (!fs.existsSync(nodePath)) {
            console.error("Could not crash test, node not found in " + nodePath);
            test_result = "fail"; // Should we report the result as false, if node is not found?
        } else {
            let file = " " + directory + "/" + filename;
            let executableProgram = nodePath + file;
            try {
                /* FIXME node is not terminating for infinite loops even after the parent process terminates. */
                child_process.execSync(executableProgram, {
                    timeout: 2000,
                    stdio: 'pipe',
                    shell: true,
                    killSignal: 'SIGKILL'
                });

            } catch (err) {
                test_result = "fail";
            }
        }
        return test_result;
    }

    // TODO extract the interesting part of the error message
    function crashTestJSCode(code) {
        let nodePath = config.nodePath;

        /* Check if node exists */
        if (!fs.existsSync(nodePath)) {
            console.error("Could not crash test, node not found in " + nodePath);
            return {name:"NodeNotFound", message:"Could not crash test, node not found in " + nodePath};
        } else {
            // Write the code to a temporary file
            let file = tmp.fileSync();
            fs.writeFileSync(file.name, code);
            let executableProgram = nodePath + " " + file.name;
            try {
                child_process.execSync(executableProgram, {
                    timeout: 2000,
                    stdio: 'pipe',
                    shell: '/bin/bash',
                    killSignal: 'SIGKILL'
                });

            } catch (e) {
                return e;
            }
        }
        return {name: "", message:""};
    }

    exports.crashTestJS = crashTestJS;
    exports.crashTestJSCode = crashTestJSCode;
})();