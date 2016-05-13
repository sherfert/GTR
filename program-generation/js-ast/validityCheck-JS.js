/**
 * Created by Jibesh Patra on 07 March, 2016.
 * Checks if a generated JS program is syntactically invalid.
 * *
 */
(function () {
    var esprima = require('esprima');
    var config = require("./../config").config;
    var fs = require('fs');

    function validJS(generated_program, fileName, fileType) {
        var valid = true;
        try {
            esprima.parse(generated_program);
        } catch (err) {
            //console.log("Generated an invalid JS program " + err);

            /* Write only the error to the generatedPrograms directory */
            var file = config.generatedProgramsDir + "/" + fileName + "." + fileType;
            if (!fs.existsSync(config.generatedProgramsDir)) { // Check if the directory exists
                fs.mkdirSync(config.generatedProgramsDir);
            }
            fs.writeFileSync(file, "/* " + err + " */\n");

            /* Write the syntactically invalid program found by esprima to a separate directory */
            var inValidProgramsDirectory = config.invalidProgramsDir;
            file = inValidProgramsDirectory + "/" + fileName + "." + fileType;
            if (!fs.existsSync(inValidProgramsDirectory)) { // Check if the directory exists
                fs.mkdirSync(inValidProgramsDirectory);
            }

            fs.writeFileSync(file, "/* " + err + " */\n" + generated_program);
            valid = false;
        }
        return valid;
    }

    /**
     * Checks if a code is syntactically valid.
     * @param {string} code the code to test
     * @returns {string} {@code ""} if the syntax is fine, and a string with the error message otherwise.
     */
    function testValidityJSCode(code) {
        try {
            esprima.parse(code);
            return "";
        } catch (err) {
            return "Syntax error: " + err;
        }
    }

    exports.validJS = validJS;
    exports.testValidityJSCode = testValidityJSCode;
})();
