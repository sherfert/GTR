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
     * @returns {Array} the different algorithms
     */
    function createCSV(codeDir) {
        var csvSize = "";
        var csvTests = "";
        var csvTime = "";
        var allFiles = fs.readdirSync(codeDir);

        // All encountered algorithms are listed here (as Strings)
        var algorithms = [];

        // Go through all JSON files
        for (var i = 0; i < allFiles.length; i++) {
            var file = allFiles[i];
            if (file.endsWith(".json")) {
                var stats = fs.statSync(codeDir + "/" + file);
                if (stats.isFile()) {

                    let results = jsonfile.readFileSync(codeDir + "/" + file).results;

                    csvSize += file + ",";
                    csvTests += file + ",";
                    csvTime += file + ",";
                    // Go through all algorithms
                    for (let algo in results) {
                        if (results.hasOwnProperty(algo)) {
                            // Add to the list of algorithms
                            if(algorithms.indexOf(algo) == -1) {
                                algorithms.push(algo);
                            }
                        }
                    }
                    for (let i = 0; i < algorithms.length; i++) {
                        let algo = algorithms[i];
                        if (results.hasOwnProperty(algo)) {
                            csvSize += results[algo].minCode.length + ",";
                            csvTests += results[algo].testsRun + ",";
                            csvTime += (results[algo].timeTaken / 1000000).toFixed(0) + ",";
                        } else {
                            csvSize += ",";
                            csvTests += ",";
                            csvTime += ",";
                        }
                    }
                    csvSize += "\n";
                    csvTests += "\n";
                    csvTime += "\n";
                }
            }
        }

        fs.writeFileSync(codeDir + "/stats/stats-size.csv", createHeader(algorithms, "size") + csvSize);
        fs.writeFileSync(codeDir + "/stats/stats-tests.csv", createHeader(algorithms, "tests") + csvTests);
        fs.writeFileSync(codeDir + "/stats/stats-time.csv", createHeader(algorithms, "time") + csvTime);

        return algorithms;
    }

    function createHeader(algorithms, property) {
        var header = "File,";
        // Header line
        for (let i = 0; i < algorithms.length; i++) {
            header += algorithms[i] + " " + property + ",";
        }
        header += "\n";
        return header;
    }

    /**
     * Plots a histogram. Gnuplot must be installed for this.
     *
     * @param {Array} algorithms the different algorithms
     * @param {String} codeDir the code directory
     * @param {String} property "size", "tests", or "time"
     * @returns {Object} the result from child_process.spawnSync called with gnuplot
     */
    function plot(algorithms, codeDir, property, ylabel) {
        var colors = ["red", "green", "blue", "yellow", "violet", "orange"];

        let plotcommand =
            "set terminal png size 2048,1200\n" +
            "set output '" + codeDir + "/stats/graph-" + property + ".png'\n" +
            "set datafile separator ','\n" +
            "set xtics rotate by -45\n" +
            "set style data histogram\n" +
            "set style fill solid border -1\n" +
            "set xlabel 'Files'\n" +
            "set ylabel '" + ylabel + "'\n" +
            "set style histogram clustered\n" +
            "set logscale y\n" +
            "plot ";

        // The data
        for(let i = 0; i < algorithms.length; i++) {
            plotcommand += "'" + codeDir + "/stats/stats-" + property + ".csv' using "
                + (i+2) +":xticlabels(1) title columnheader linecolor rgb '" + colors[i] + "', ";
        }

        return child_process.spawnSync("gnuplot", [], {
            input: plotcommand,
            encoding: 'utf8',
        });
    }

    /**
     * Creates a boxplot. Gnuplot must be installed for this.
     *
     * @param {Array} algorithms the different algorithms
     * @param {String} codeDir the code directory
     * @param {String} property "size", "tests", or "time"
     * @returns {Object} the result from child_process.spawnSync called with gnuplot
     */
    function boxplot(algorithms, codeDir, property, ylabel) {
        var colors = ["red", "green", "blue", "yellow", "violet", "orange"];

        let plotcommand =
            "set terminal png size 2048,1200 enhanced font 'Verdana,30'\n" +
            "set output '" + codeDir + "/stats/box-" + property + ".png'\n" +
            "set datafile separator ','\n" +
            "set style data boxplot\n" +
            "set style boxplot outliers pointtype 7\n" +
            "set style boxplot fraction 0.95\n" +
            "set boxwidth  0.5\n" +
            "set pointsize 1.5\n" +
            "set style fill solid border -1\n" +
            "set xlabel 'Algorithms'\n" +
            "set ylabel '" + ylabel + "'\n" +
            "set xtics ('' 1) scale 0.0\n";

        // For printing the statistics
        for(let i = 0; i < algorithms.length; i++) {
            let prefix = algorithms[i] + "_" + property;
            plotcommand += "print sprintf('" + prefix + "')\n";
            plotcommand += "stats '" + codeDir + "/stats/stats-" + property + ".csv' using " + (i+2) +
                "prefix 'A" + (i+1) + "'\n";
            plotcommand += "set label " + (i+1) + " gprintf('Avg = %g', A" + (i+1) + "_mean)at "
                + (i+1) + ", A" + (i+1) + "_min*0.75 center font 'Verdana,20'\n"
        }

        plotcommand += "show label\n" +
            "set logscale y\n" +
            "plot ";
        for(let i = 0; i < algorithms.length; i++) {

            plotcommand += "'" + codeDir + "/stats/stats-" + property + ".csv' using "
                + "(" + (i+1) + "):"+ (i+2) +" title columnheader linecolor rgb '" + colors[i] + "', ";
        }

        //console.log(plotcommand);

        return child_process.spawnSync("gnuplot", [], {
            input: plotcommand,
            encoding: 'utf8',
        });
    }

    function createStats(codeDir) {
        // TODO uncomment createCSV again
        var algorithms = ["DD line-based","DD char-based","HDD","HDD*","HDD with child substitution"];// createCSV(codeDir);
        var result = plot(algorithms, codeDir, "size", "File size in characters (log)");
        console.log(result.stderr);
        result = boxplot(algorithms, codeDir, "size", "File size in characters (log)");
        console.log(result.stderr);


        result = plot(algorithms, codeDir, "tests", "Number of oracle executions (log)");
        console.log(result.stderr);
        result = boxplot(algorithms, codeDir, "tests", "Number of oracle executions (log)");
        console.log(result.stderr);


        result = plot(algorithms, codeDir, "time", "Execution time in ms (log)");
        console.log(result.stderr);
        result = boxplot(algorithms, codeDir, "time", "Execution time in ms (log)");
        console.log(result.stderr);

    }

    exports.createStats = createStats;

})();