// Author: Satia Herfert

/**
 * Using the JSON files that were created, this file creates two csv files,
 * comparing minimal code sizes and tests run for the different reduction algorithms, and one plot
 * file showing both statistics as an histogram.
 */
(function () {
    var jsonfile = require('jsonfile');
    var fs = require('fs');
    var child_process = require('child_process');

    /**
     * Creates the CSV files
     * @param {String} codeDir the code directory
     * @returns {number} the number of different algorithms
     */
    function createCSV(codeDir) {
        var csvSize = "";
        var csvTests = "";
        var allFiles = fs.readdirSync(codeDir);
        var numAlgos = 0;

        let headerCreated = false;

        // Go through all JSON files
        for (var i = 0; i < allFiles.length; i++) {
            var file = allFiles[i];
            if (file.endsWith(".json")) {
                var stats = fs.statSync(codeDir + "/" + file);
                if (stats.isFile()) {

                    let results = jsonfile.readFileSync(codeDir + "/" + file).results;

                    // Create header line
                    if(!headerCreated) {
                        headerCreated = true;

                        csvSize += "File,";
                        csvTests += "File,";
                        // Header line
                        for (var algo in results) {
                            if (results.hasOwnProperty(algo)) {
                                numAlgos++;
                                csvSize += algo + " size,";
                                csvTests += algo + " tests,";
                            }
                        }
                        csvSize += "\n";
                        csvTests += "\n";
                    }

                    csvSize += file + ",";
                    csvTests += file + ",";
                    // Go through all algorithms
                    for (var algo in results) {
                        if (results.hasOwnProperty(algo)) {
                            csvSize += results[algo].minCode.length + ",";
                            csvTests += results[algo].testsRun + ",";
                        }
                    }
                    csvSize += "\n";
                    csvTests += "\n";
                }
            }
        }

        fs.writeFileSync(codeDir + "/stats/stats-size.csv", csvSize);
        fs.writeFileSync(codeDir + "/stats/stats-tests.csv", csvTests);

        return numAlgos;
    }

    /**
     * Plots the statistics. Gnuplot must be installed for this.
     *
     * @param {number} numAlgos the number of different algorithms
     * @param {String} codeDir the code directory
     * @returns {Object} the result from child_process.spawnSync called with gnuplot
     */
    function plot(numAlgos, codeDir) {
        var colors = ["red", "green", "blue", "yellow", "violet", "orange"];

        let plotcommand =
            "set terminal png size 2048,1200\n" +
            "set output '" + codeDir + "/stats/graph.png'\n" +
            "set datafile separator ','\n" +
            "set xtics rotate by -45\n" +
            "set style data histogram\n" +
            "set style fill solid border -1\n" +
            "set style histogram clustered\n" +
            "set boxwidth 0.8 relative\n" +
            "plot ";

        // The sizes
        for(let i = 0; i < numAlgos; i++) {
            plotcommand += "'" + codeDir + "/stats/stats-size.csv' using "
                + (i+2) +":xticlabels(1) title columnheader linecolor rgb '" + colors[i] + "', ";
        }
        // The tests
        for(let i = 0; i < numAlgos; i++) {
            plotcommand += "'" + codeDir + "/stats/stats-tests.csv' using "
                + (i+2) +":xticlabels(1) title columnheader linecolor rgb '" + colors[i] + "' fillstyle pattern 1, ";
        }

        return child_process.spawnSync("gnuplot", [], {
            input: plotcommand,
            encoding: 'utf8',
        });
    }

    function createStats(codeDir) {
        var numAlgos = createCSV(codeDir);
        var result = plot(numAlgos, codeDir);
        console.log(result.stderr);
    }

    exports.createStats = createStats;

})();
