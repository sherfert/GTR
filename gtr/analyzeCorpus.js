// Author: Satia Herfert

/**
 * Learn the information required for GTR from a corpus.
 * This creates a file ../program-generation/results/inferredKnowledge/gtrModelRule.json
 *
 * Creates also CSV in the same directory. Compares the number of rules found vs. the number of files traversed.
 */
(function() {
    var config = require("../program-generation/config").config;
    var treeProvider;

    var languageArg = process.argv[2];

    if(!languageArg || (languageArg != "PY" && languageArg != "JS" && languageArg != "PDF")) {
        console.log("Usage: 'node analyzeCorpus.js [lang]'");
        console.log("Supported languages: 'JS', 'PY', 'PDF'");
        return;
    } else if(languageArg == "PY") {
        // Reconfigure for Python
        config.treeProvider = config.directory + "/py-ast/pyAstProvider";
        config.treeGenerator = config.directory + "/py-ast/pyAstGenerator";
        config.corpusDir = config.directory + "/corpusForTestingPy";
        config.fileType = "PY";
        treeProvider = require("../program-generation/py-ast/pyAstProvider");
    } else if(languageArg == "JS") {
        // Reconfigure for JS
        config.treeProvider = config.directory + "/js-ast/jsAstProvider";
        config.treeGenerator = config.directory + "/js-ast/jsAstGenerator";
        config.corpusDir = config.directory + "/corpusForTestingJS";
        config.fileType = "JS";
        treeProvider = require("../program-generation/js-ast/jsAstProvider");
    } else {
        // Reconfigure for PDF
        config.treeProvider = config.directory + "/pdf/pdfProvider";
        config.treeGenerator = config.directory + "/pdf/pdfGenerator";
        config.corpusDir = config.directory + "/corpusForTestingPDF";
        config.fileType = "PDF";
        treeProvider = require("../program-generation/pdf/pdfProvider");
    }

    var jsonfile = require('jsonfile');
    var fs = require('fs');
    var child_process = require('child_process');
    var checkWorkingDirectories = require('../program-generation/util').checkWorkingDirectories;
    var learning = require("../program-generation/learning");

    checkWorkingDirectories();

    var csv = "Number of files,Found parents\n";

    // Repeat and save data in CSV
    treeProvider.init();
    for(let i = 1, tree = treeProvider.nextTree(); tree; i++, tree = treeProvider.nextTree()) {
        learning.traverseTree(tree);
        learning.finalizeRules();
        learning.writeLearningToDisk();
        var numParents =
            jsonfile.readFileSync(config.inferredKnowledgeDir + "/gtrModelRule.json").numParents;
        csv += i + "," + numParents + "\n";

        // Save csv file
        // FIXME actually we do'nt want this inside the loop
        fs.writeFileSync(config.inferredKnowledgeDir + "/learning-graph.csv", csv);
    }

    // Save csv file
    fs.writeFileSync(config.inferredKnowledgeDir + "/learning-graph.csv", csv);

})();