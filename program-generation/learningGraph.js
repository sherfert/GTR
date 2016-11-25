// Author: Satia Herfert

/**
 * Prints a line graph comparing the number of rules found vs. the number of files traversed.
 */
(function() {
    var jsonfile = require('jsonfile');
    var fs = require('fs');
    var child_process = require('child_process');
    var checkWorkingDirectories = require('./util').checkWorkingDirectories;
    var learning = require("./learning");
    // Check that config.js is configured for your current PL
    var config = require("./config").config;
    var treeProvider = require(config.treeProvider);

    checkWorkingDirectories();

    var csv = "Number of files,Found parents\n";

    // Repeat and save data in CSV
    treeProvider.init();
    for(let i = 1, tree = treeProvider.nextTree(); tree; i++, tree = treeProvider.nextTree()) {
        learning.traverseTree(tree);
        learning.finalizeRules();
        learning.writeLearningToDisk();
        var numParents =
            jsonfile.readFileSync(config.inferredKnowledgeDir + "/hddModelRule.json").numParents;
        csv += i + "," + numParents + "\n";

    }

    // Save csv file
    fs.writeFileSync(config.inferredKnowledgeDir + "/learning-graph.csv", csv);

    // Plot
    let plotcommand =
        "set terminal png size 2048,1200 enhanced font 'Verdana,30'\n" +
        "set output '" + config.inferredKnowledgeDir + "/learning-graph.png'\n" +
        "unset key\n" +
        "set datafile separator ','\n" +
        "set xlabel 'Number of files'\n" +
        "set ylabel 'Number of parents found'\n" +
        "plot '" + config.inferredKnowledgeDir + "/learning-graph.csv' using 1:2 with lines title columnheader";

    var result = child_process.spawnSync("gnuplot", [], {
        input: plotcommand,
        encoding: 'utf8',
    });

    console.log(result.stderr);

})();