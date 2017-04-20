// Author: Satia Herfert

/**
 * Using the JSON files that were created, this file creates csv files with statistics.
 */
(function () {
    var jsonfile = require('jsonfile');
    var fs = require('fs');

    /**
     * Creates the CSV files
     * @param {String} codeDir the code directory
     */
    function createStats(codeDir) {
        var csvSize = "";
        var csvSizeNodes = "";
        var csvReduction = "";
        var csvReductionNodes = "";
        var csvTests = "";
        var csvTime = "";
        var csvInOracle = "";
        var allFiles = fs.readdirSync(codeDir);

        // All encountered algorithms are listed here (as Strings)
        var algorithms = [];

        // Go through all JSON files
        for (var i = 0; i < allFiles.length; i++) {
            var file = allFiles[i];
            if (file.endsWith(".json")) {
                var stats = fs.statSync(codeDir + "/" + file);
                if (stats.isFile()) {

                    let json = jsonfile.readFileSync(codeDir + "/" + file);
                    let results = json.results;

                    csvSize += file + ",";
                    csvSizeNodes += file + ",";
                    csvReduction += file + ",";
                    csvReductionNodes += file + ",";
                    csvTests += file + ",";
                    csvTime += file + ",";
                    csvInOracle += file + ",";

                    // Save original size
                    csvSize += json.origSize + ",";
                    csvSizeNodes += json.origSizeNodes + ",";

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
                            csvSize += results[algo].size + ",";
                            csvSizeNodes += results[algo].sizeNodes + ",";
                            csvReduction += 100 * (1 - results[algo].size / json.origSize) + ",";
                            csvReductionNodes += 100 * (1 - results[algo].sizeNodes / json.origSizeNodes) + ",";
                            csvTests += results[algo].testsRun + ",";
                            csvTime += (results[algo].timeTaken / 1000000000).toFixed(3) + ",";
                            csvInOracle += (results[algo].timeInOracle / results[algo].timeTaken * 100).toFixed(3) + ",";
                        } else {
                            csvSize += ",";
                            csvSizeNodes += ",";
                            csvReduction += ",";
                            csvReductionNodes += ",";
                            csvTests += ",";
                            csvTime += ",";
                            csvInOracle += ",";
                        }
                    }
                    csvSize += "\n";
                    csvSizeNodes += "\n";
                    csvReduction += "\n";
                    csvReductionNodes += "\n";
                    csvTests += "\n";
                    csvTime += "\n";
                    csvInOracle += "\n";
                }
            }
        }

        fs.writeFileSync(codeDir + "/stats/stats-size.csv", createHeader(["Original"].concat(algorithms), "size") + csvSize);
        fs.writeFileSync(codeDir + "/stats/stats-size-nodes.csv", createHeader(["Original"].concat(algorithms), "nodes") + csvSizeNodes);
        fs.writeFileSync(codeDir + "/stats/stats-reduction.csv", createHeader(algorithms, "reduction") + csvReduction);
        fs.writeFileSync(codeDir + "/stats/stats-reduction-nodes.csv", createHeader(algorithms, "reduction") + csvReductionNodes);
        fs.writeFileSync(codeDir + "/stats/stats-tests.csv", createHeader(algorithms, "tests") + csvTests);
        fs.writeFileSync(codeDir + "/stats/stats-time.csv", createHeader(algorithms, "time") + csvTime);
        fs.writeFileSync(codeDir + "/stats/stats-inoracle.csv", createHeader(algorithms, "inOracle") + csvInOracle);
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


    exports.createStats = createStats;

})();