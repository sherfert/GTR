// Author: Satia Herfert

/**
 * Compares all PDF test files with different algorithms.
 */
(function() {
    var fs = require('fs');
    var jsonfile = require('jsonfile');
    var minimist = require('minimist');

    var Reducer = require('./reducer').Reducer;

    var inputTester = require("./tree-reducer/inputTester");

    var codeDir = "tree-reducer/input/pdf";

    class PDFReducer extends Reducer {
        getTreeProvider() {
            // TODO
        }
        getTreeGenerator() {
            // TODO
        }
        getInputTester(command, ddAlgo) {
            return new inputTester.PDFMaliciousnessTester(ddAlgo);
        }
        getEnding() {
            return "PDF";
        }
        getFileStateFromName(name) {
            return this.getFileState(name, "");
        }
    }

    // TODO
    //new PDFReducer().runTest();

    var code = fs.readFileSync(codeDir + "/CVE-2009-4324_PDF_2009-11-30_note200911.pdf=1ST0DAYFILE");
    var code2 = fs.readFileSync(codeDir + "/gtr-paper.pdf");
    var result = new PDFReducer().getInputTester("", null).test(code2);
    console.log(result);

})();