/**
 * Created by Jibesh Patra on 12 March, 2016.
 *
 */
(function () {
    function codePreambleJS(date, seed, corpusDir, randomSeed, corpusSize, filetype) {
        var day = date.toDateString(),
            time = date.toTimeString();

        return "/* \n* Randomly generated " + filetype + " program on " + day + " " + time + "\n" +
            "* Corpus: " + corpusDir + " selected top " + corpusSize + " valid file/s \n" +
            "* Random seed: " + randomSeed + "\n" +
            "* Seed: " + seed + "\n" +
            "*/\n\n";
    }

    exports.codePreambleJS = codePreambleJS;

})();