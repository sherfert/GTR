// Author: Michael Pradel, Jibesh Patra

(function () {
    "use strict";
    try {
        var fs = require("fs");
        var learning = require("./learning");
        var onelog = require('single-line-log').stdout;
        var timer = require("./evaluation/timer");
        var config = require("./config").config;
        var deterministicRandom = require("./deterministicRandom");
        var treeGenerator = require(config.treeGenerator);
        var loTrees = require("./labeledOrderedTrees");
        var ruleProvider = require("./rules/ruleProvider");
        var rules = ruleProvider.rules();
        var Context = require("./context").Context;
        var util = require("./util");
        var getCompletePath = require("./util").getCompletePath;
        var currentWorkingDirectory = process.cwd();
        var validityCheck = require("./validityCheck").isValid;
        var crashTest = require("./crashTest").crashTest;
        var getText = require('./getText').getText;

        var generatedFilesvsNodes = {
            title: "Generated files vs Nodes",
            x: [],
            x_title: "files",
            y: [],
            y_title: "number of nodes",
            plotmean: false,
            annotation: true
        }; // For plotting

        var numberOfNodeToGenerationTime = {
            title: "Generated number of Nodes vs Time",
            x: [],
            x_title: "number of Nodes",
            y: [],
            y_title: "time to generate (seconds)",
            plotmean: false,
            annotation: true
        }; // For plotting

        var generatedFilesvsSize = {
            title: "Generated files vs size",
            x: [],
            x_title: "files",
            y: [],
            y_title: "size (KB)",
            plotmean: false,
            annotation: true // for plotting mean and max
        }; // For plotting
        var plot = require('./utilities/plotter').plot;
    } catch (err) {
        console.log(err + "\n  Correct it to continue");
        process.exit(0);
    }

    /* TODO: Use node 'path' module instead of split() */
    function plotData() {
        util.writeToJSONfile(config.generatedNode_vs_generationTime, numberOfNodeToGenerationTime);
        //plot(numberOfNodeToGenerationTime, config.generatedNode_vs_generationTime.split(".json")[0] + ".eps");

        util.writeToJSONfile(config.generatedFiles_vs_Size, generatedFilesvsSize);
        //plot(generatedFilesvsSize, config.generatedFiles_vs_Size.split(".json")[0] + ".eps");

        util.writeToJSONfile(config.generatedFiles_vs_numberOfnodes, generatedFilesvsNodes);
        //plot(generatedFilesvsNodes, config.generatedFiles_vs_numberOfnodes.split(".json")[0] + ".eps");
    }


    function NodeToExpand(node, context) {
        this.node = node;
        this.context = context;
    }

    /**
     * Top-down, left-to-right generation of a tree.
     * @returns {*|Node}
     */
    function generateTree() {
        timer.startTask("generation");
        notifyStartTree();
        var nodesToExpand = []; // work list
        var root = new loTrees.Node("");
        var totalNodes = 1;
        nodesToExpand.push(new NodeToExpand(root, new Context([root], [])));
        while (nodesToExpand.length > 0) {
            var nodeToExpand = nodesToExpand.pop();
            var node = nodeToExpand.node;
            var context = nodeToExpand.context;
            // label this node
            var nodeLabel = pickLabelOfNode(node, context);
            node.label = nodeLabel;

            // create edges that lead to not-yet-expanded nodes
            var edgeLabels = [];
            var nextEdgeLabel = pickNextEdgeLabel(node, edgeLabels, context);
            while (nextEdgeLabel !== undefined && nextEdgeLabel !== '') {
                edgeLabels.push(nextEdgeLabel);
                nextEdgeLabel = pickNextEdgeLabel(node, edgeLabels, context);
            }
            var newNodes = [];
            for (let i = 0; i < edgeLabels.length; i++) {
                var edgeLabel = edgeLabels[i];
                var target = new loTrees.Node("");
                totalNodes++;
                if (totalNodes > config.maxNodesPerGeneratedTree) {
                    stopTimerTask(totalNodes);
                    // console.log("Stopping generation because too many nodes");
                    return;
                }
                var edge = new loTrees.Edge(edgeLabel, target);
                node.outgoing.push(edge);

                var newNodePath = context.nodePath.concat([target]);
                var newEdgePath = context.edgePath.concat([edge]);
                newNodes.push(new NodeToExpand(target, new Context(newNodePath, newEdgePath)));
            }

            // push new nodes onto work list from right to left, so they'll get expanded left to right
            for (let i = newNodes.length - 1; i >= 0; i--) {
                var newNode = newNodes[i];
                nodesToExpand.push(newNode);
            }
        }
        stopTimerTask(totalNodes);
        return root;
    }

    function stopTimerTask(totalNodes) {
        let timeTogenerate = timer.stopTask("generation");
        numberOfNodeToGenerationTime.x.push(totalNodes);
        numberOfNodeToGenerationTime.y.push(timeTogenerate / 1000);
        generatedFilesvsNodes.y.push(totalNodes);
    }

    function notifyStartTree() {
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            if (rule.startTree) rule.startTree();
        }
    }

    function notifyNodeLabelPicked(node, context, label) {
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            if (rule.havePickedLabelOfNode) {
                rule.havePickedLabelOfNode(node, context, label);
            }
        }
    }

    function pickLabelOfNode(node, context) {
        var candidates = ruleProvider.dontCare,
            result;
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            var newCandidates = rule.pickLabelOfNode(node, context, candidates);
            //console.log("For rule "+rule.name);
            //util.print(newCandidates);
            if (newCandidates !== ruleProvider.dontCare) {
                util.assert(newCandidates instanceof Set);
                if (candidates === ruleProvider.dontCare)
                    candidates = newCandidates;
                else
                    candidates = util.intersect(candidates, newCandidates);
                //console.log("rule " + rule.name + " candidates ");
                //util.print(candidates);
                //util.print(newCandidates);

                if (candidates.size === 1) {
                    result = candidates.values().next().value;
                    notifyNodeLabelPicked(node, context, result);
                    //console.log("rule " + rule.name + ": picking node label: " + result);
                    return result;
                }
            }
        }
        if (candidates === ruleProvider.dontCare || candidates.size === 0) {
            // fall back on default strategy
            result = config.generatorDefaults.nodeLabel;
            notifyNodeLabelPicked(node, context, result);
            //console.log("no rule: picking default node label: " + result);
            return result;
        } else {
            util.assert(candidates.size > 1);
            result = deterministicRandom.pickFromSet(candidates);
            notifyNodeLabelPicked(node, context, result);
            //console.log("multiple candidates: picking node label: " + result);
            return result;
        }
    }

    // TODO avoid code duplication
    // TODO break out of loop when candidates become empty
    function pickNextEdgeLabel(node, edgeLabels, context) {
        var candidates = ruleProvider.dontCare;
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            var newCandidates = rule.pickNextEdgeLabel(node, edgeLabels, context, candidates);

            if (newCandidates !== ruleProvider.dontCare) {

                util.assert(newCandidates instanceof Set);
                if (candidates === ruleProvider.dontCare)
                    candidates = newCandidates;
                else
                    candidates = util.intersect(candidates, newCandidates);
                if (candidates.size === 1)
                    return candidates.values().next().value;
            }
        }

        if (candidates === ruleProvider.dontCare || candidates.size === 0) {
            // fall back on random default strategy
            if (deterministicRandom.random() < config.generatorDefaults.probabilityAddAnotherEdge) {
                return config.generatorDefaults.edgeLabel;
            } else {
                return undefined;
            }
        } else {
            util.assert(candidates.size > 1);
            return deterministicRandom.pickFromSet(candidates);
        }
    }

    function generateCodePreamble(filename) {
        return getText("codePreamble", filename);
    }

    function getKnowledgeFromDisk() {
        let directory = getCompletePath(config.inferredKnowledgeDir);
        for (let i = 0; i < rules.length; i++) {
            let rule = rules[i];
            let fileName = directory + "/" + rule.name + ".json";
            rule.getRuleInferencesFromDisk(fileName);
        }
    }

    /* Write code to file. */
    function writeToFile(code, filename, directory) {
        let extension = config.fileType.toLowerCase();
        code = generateCodePreamble(filename) + code;
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory);
        }
        fs.appendFileSync(directory + "/" + filename + "." + extension, code);
    }

    function generate() {
        var logfile = config.generationLogFile;
        /* If usePersistentKnowledge is set to true, then populate the corresponding data-structures for each rule */
        if (config.usePersistentKnowledge) {
            getKnowledgeFromDisk();
        }
        var validTree = 0,
            syntacticallyValidPrograms = 0,
            nonCrashingPrograms = 0,
            directory,
            log = getText("LogPreamble_generation"),
            concludingOptions = [],
            requiredValidTree = config.nbValidTrees,
            maxTries = config.maxNbGeneratedTrees;
        util.writelog(logfile, log); // Start by writing log preamble
        for (var treeNb = 1; validTree < requiredValidTree && treeNb <= maxTries; treeNb++) {
            deterministicRandom.setSeed(); // For a fixed seed, use it, else generate a new random seed.
            var date = new Date(); // Record when the current generation of file started.
            var filename = date.getTime(); // Get the file name of the generated JS file from the date.
            /* Do not generate more than one program for a fixed seed */
            if (!config.useRandomSeed && validTree >= 1 && !config.forceSameProgramGeneration) {
                console.log(getText("fixedSeed"));
                log = getText("LogPreamble_generation", concludingOptions);
                util.writelog(logfile, log);
                process.exit(0);
            }
            generatedFilesvsNodes.x.push(treeNb);
            //console.log("===================== generating next tree ==============");
            onelog("Remaining >> " + (requiredValidTree - validTree - 1) + " Generating tree: " + treeNb + " Surplus: " + ((treeNb - 1) - validTree) + "\n");
            var tree = generateTree();

            if (tree) {
                //util.print(tree);
                var code = treeGenerator.treeToCode(tree);
                //console.log("\n-----------------------\n" + code + "\n-------------------");
                if (code !== undefined) {
                    validTree++;

                    if (validityCheck(code, filename, config.fileType)) { // Check if the code generated is syntactically valid.
                        directory = util.getCompletePath(config.correctSyntaxProgramsDir);

                        writeToFile(code, filename, directory); // write the code to correct syntax directory
                        syntacticallyValidPrograms++;

                        /* If the code is syntactically valid, also test if it passed crash test */
                        if (crashTest(filename, directory, config.fileType) === "pass") { // Use the same directory of the syntactically correct programs
                            nonCrashingPrograms++;
                        }
                    }

                    directory = config.generatedProgramsDir;
                    writeToFile(code, filename, directory); // Write the code to the generated programs directory
                    generatedFilesvsSize.x.push(validTree);
                    generatedFilesvsSize.y.push(util.getFileSizeinKB(directory + "/" + filename + "." + config.fileType.toLowerCase())); // Find out file size from the written generated
                }
            }
            // TODO Find a better way of doing this
            concludingOptions = [requiredValidTree, treeNb, syntacticallyValidPrograms, nonCrashingPrograms]; // The data that is need to write the statistics of the current run to a log
        }
        log = getText("LogConclusion_generation", concludingOptions);
        util.writelog(logfile, log);

        /* finally plot the data */
        plotData();
    }

    exports.generate = generate;

})();
