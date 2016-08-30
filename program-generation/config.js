// Author: Michael Pradel, Jibesh Patra

(function() {

    /* List of rules to be used by the current run. Comment out the rules you do not want to use.
    *  There could be chained dependence among rules.
    * */
    var ruleNames = [
        // "ancestorConstraintRule",
        // "rootRule",
        // "commonSequenceRule",
        // "edgeLabelRule",
        // "ancestorBasedNodeLabelRule",
        // "parentBasedNodeLabelRule"
        // "edgeToedgeTargetConstrain"
        "hddModelRule"
    ];

    var generatorDefaults = {
        nodeLabel: "",
        edgeLabel: "",
        probabilityAddAnotherEdge: 0.1
    };

    exports.config = {
        ruleNames: ruleNames,
        // treeProvider: "./js-ast/jsAstProvider",
        // treeGenerator: "./js-ast/jsAstGenerator",
        treeProvider: "./py-ast/pyAstProvider",
        treeGenerator: "./py-ast/pyAstGenerator",
        //treeProvider: "./html/htmlProvider",
        //treeGenerator: "./html/htmlGenerator",


        /*  Working Directories.
         *  While creating or deleting a directory, also update checkWorkingDirectories() in main.js
         *  TODO Make all directories relative to main.js
         /* Mandatory directories */

        fileType: "Py", // also change treeProvider, treeGenerator
        corpusDir: "./corpusForTestingPy",

        maxNoOfFilesToLearnFrom: 0, // 0 for all files in the directory
        //differentialTestingDirectory: "/nknkjn",
        /* If this (usePersistentKnowledge) is set to 'true' then the corpus is ignored. inferredKnowledgeDir is used to search
         for knowledge. For each rule, if the corresponding file is not found, then the program terminates.
         */
        usePersistentKnowledge: false,
        resultsDir: "./results",
        inferredKnowledgeDir: "results/inferredKnowledge",
        generatedProgramsDir: "./results/generatedPrograms",
        invalidASTsDir: "./results/invalidASTs", // Needed for debugging purposes, where escodegen fails to convert a tree to AST
        invalidProgramsDir: "./results/invalidPrograms", // Syntactically invalid programs. Detected only by esprima
        correctSyntaxProgramsDir: "./results/syntacticallyCorrectPrograms", // Filter syntactically correct programs using esprima
        statsandPlotsDir: "./results/stats-and-plots",
        /* End of working directories */

        generatorDefaults: generatorDefaults,
        maxNodesPerGeneratedTree: 1000,
        fixedSeed: 1,
        useRandomSeed: true,
        maxNbGeneratedTrees: 10, // Maximum tries to generate the required valid. Ideally, maxNbGeneratedTrees > nbValidTrees
        nbValidTrees: 10,
        forceSameProgramGeneration: false, // If the seed is fixed and useRandomSeed is set to 'true'. The the program will generate the same program over and over. Prevent this?
        nodePath: "/home/satia/.nvm/versions/node/v6.5.0/bin/node", // This is necessary for testing if a generated program crashes while execution
        generationLogFile: "generation.log",

        /* Stats and Plots */
        /* The plot function is called from jsAstProvider.js, learning.js, generation.js */
        generatedNode_vs_generationTime: "./results/stats-and-plots/generated-nodes-vs-generation-time.json",
        corpusFiles_vs_numberOfnodes: "/results/stats-and-plots/corpus-files-vs-nodes.json", //learning.js
        generatedFiles_vs_numberOfnodes: "./results/stats-and-plots/generated-files-vs-nodes.json",
        corpusFiles_vs_Size: "/results/stats-and-plots/corpus-files-vs-size.json",
        generatedFiles_vs_Size: "./results/stats-and-plots/generated-files-vs-size.json"
    };

})();
