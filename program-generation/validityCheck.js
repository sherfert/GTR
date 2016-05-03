/**
 * Created by Jibesh Patra on 11 March, 2016.
 * Time: 17:15
 */

(function () {
    var isValidJS = require('./js-ast/validityCheck-JS').validJS;
    //var isValidHTML = require('');

    function isValid(generatedProgram, filename, filetype) {
        var fileExtension = filetype.toLowerCase();
        switch (fileExtension) {
            case "js":
                return isValidJS(generatedProgram, filename, fileExtension);
                break;
            case "html":
                return true;
                // TODO implement the following
                return isValidHTML(generatedProgram, filename, fileExtension);
                break;
            default:
                console.log("\nNo file-type provided for validity check");
        }
    }

    exports.isValid = isValid;
})();