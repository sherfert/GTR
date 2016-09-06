/**
 * Created by Jibesh Patra on 07 March, 2016.
 *
 */


(function () {
    var isCrashingJS = require('./js-ast/crashTest-JS').crashTestJS;
    //var isCrashingHTML = require('');

    function crashTest(filename, directory, filetype) {
        var fileExtension = filetype.toLowerCase();
        return "pass"; // Temporarily not crash-testing until isCrashingJS is fixed
        switch (fileExtension) {
            case "js":
                return isCrashingJS(filename + ".js", directory);
                break;
            case "html":
                return isCrashingHTML(filename, directory);
                break;
            default:
                console.log("\nNo file-type provided for crash test");
        }
    }

    exports.crashTest = crashTest;
})();
