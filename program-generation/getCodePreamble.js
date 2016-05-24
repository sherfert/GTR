/**
 * Created by Jibesh Patra on 12 March, 2016.
 *
 */
(function () {
    "use strict";
    var getCodePreambleJS = require('./js-ast/codePreamble-JS').codePreambleJS;
    var getCodePreambleHTML = require('./html/codePreamble-HTML').codePreambleHTML;

    var deterministicRandom = require("./deterministicRandom");
    var config = require("./config").config;
    var corpus = require("./corpus");

    function getCodePreamble(filetype, filename) {
        let date = new Date(filename), // Getting the date, when the file was created
            seed = deterministicRandom.getSeed(),
            corpusDir = config.corpusDir,
            randomSeed = config.useRandomSeed,
            corpusSize = corpus.getCorpusSize();

        switch (filetype.toLowerCase()) {
            case "js":
                return getCodePreambleJS(date, seed, corpusDir, randomSeed, corpusSize, filetype);
                break;
            case "html":
                return getCodePreambleHTML(date, seed, corpusDir, randomSeed, corpusSize, filetype);
                break;
            default:
                console.log("\nNo file-type provided for code preamble");
        }
    }

    exports.getCodePreamble = getCodePreamble;
})();