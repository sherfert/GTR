// Author: Satia Herfert

/**
 * Compares all PDF test files with different algorithms.
 */
(function() {
    var fs = require('fs');
    var jsonfile = require('jsonfile');
    var minimist = require('minimist');

    var Reducer = require('./reducer').Reducer;

    var pdfTreeProvider = require('../program-generation/pdf/pdfProvider');
    var pdfTreeGenerator = require('../program-generation/pdf/pdfGenerator');
    var inputTester = require("./tree-reducer/inputTester");

    var codeDir = "tree-reducer/input/pdf";

    class PDFReducer extends Reducer {
        getTreeProvider() {
            return pdfTreeProvider;
        }
        getTreeGenerator() {
            return pdfTreeGenerator;
        }
        getInputTester(command, ddAlgo) {
            return new inputTester.PDFMaliciousnessTester(ddAlgo);
        }
        getEnding() {
            return "PDF";
        }
        getEncoding() {
            return null;
        }
        getFileStateFromName(name) {
            return this.getFileState(codeDir + "/" + name, "");
        }
    }

    new PDFReducer().runTest();

})();