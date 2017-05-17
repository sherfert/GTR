/**
 * Created by Jibesh Patra on 05-May-2017.
 */
/**
 * Compares all XMl test files with different algorithms.
 */
(function () {
    var fs = require('fs');
    var jsonfile = require('jsonfile');
    var minimist = require('minimist');

    var Reducer = require('./reducer').Reducer;

    var xmlTreeProvider = require('../program-generation/xml/xmlProvider');
    var xmlTreeGenerator = require('../program-generation/xml/xmlGenerator');
    var inputTester = require("./tree-reducer/inputTester");

    var codeDir = "tree-reducer/input/xml";

    class XMLReducer extends Reducer {
        getTreeProvider() {
            return xmlTreeProvider;
        }

        getTreeGenerator() {
            return xmlTreeGenerator;
        }

        getInputTester(command, ddAlgo, fileName) {
            return new inputTester.XMLTester(ddAlgo, fileName);
        }

        getEnding() {
            return "XML";
        }

        getEncoding() {
            return "utf8";
        }

        getFileStateFromName(name) {
            return this.getFileState(codeDir + "/" + name, "");
        }
    }

    new XMLReducer().runTest();

})();