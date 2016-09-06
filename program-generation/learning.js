// Author: Michael Pradel

(function () {
    "use strict";
    var singleLinelog = require('single-line-log').stdout;
    var config = require("./config").config;
    var treeProvider = require(config.treeProvider);
    treeProvider.init();
    var rules = require("./rules/ruleProvider").rules();
    var util = require("./util");
    var getCompletePath = require("./util").getCompletePath;
    var context = require("./context");
    var getText = require('./getText').getText;
    var corpus = require('./corpus');
    var corpusFilesAndNodes = {
        title: "Files vs Number of nodes",
        x: [],
        x_title: "files",
        y: [],
        y_title: "number of nodes",
        plotmean: false,
        annotation: true
    };

    var nbTraversed = 0, numberOfNodes = 0;

    function traverseTrees() {
        var tree = treeProvider.nextTree();
        while (tree) {
            traverseTree(tree);
            tree = treeProvider.nextTree();
            nbTraversed++;
            corpusFilesAndNodes.x.push(nbTraversed);
            corpusFilesAndNodes.y.push(numberOfNodes);
            //singleLinelog.clear();
            singleLinelog("Traversed " + nbTraversed + " trees\n");
        }
        corpus.setCorpusSize(nbTraversed);
        let filetoWrite = process.cwd() + config.corpusFiles_vs_numberOfnodes;
        util.writeToJSONfile(filetoWrite, corpusFilesAndNodes);
    }

    /**
     * Depth-first traversal of each node in a tree.
     * @param root Root node of a tree.
     */
    function traverseTree(root) {
        numberOfNodes = 0;
        var currentNodePath = [root];
        var currentEdgePath = [];
        var currentChildIndices = [-1];
        visitNode(root, new context.Context(currentNodePath, currentEdgePath));
        while (currentNodePath.length !== 0) {
            util.assert(currentNodePath.length === currentEdgePath.length + 1);
            var currentNode = currentNodePath[currentNodePath.length - 1];
            currentChildIndices[currentChildIndices.length - 1]++;
            var currentChildIndex = currentChildIndices[currentChildIndices.length - 1];
            var outgoing = currentNode.outgoing;
            if (currentChildIndex < outgoing.length) {
                var childNode = outgoing[currentChildIndex].target;
                var edge = outgoing[currentChildIndex];
                currentNodePath.push(childNode);
                currentEdgePath.push(edge);
                currentChildIndices.push(-1);
                visitNode(childNode, new context.Context(currentNodePath, currentEdgePath));
            } else {
                currentNodePath.pop();
                if (currentEdgePath.length > 0) currentEdgePath.pop();
                currentChildIndices.pop();
            }
        }
    }

    function visitNode(node, context) {
        numberOfNodes++;
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            //console.log("Visiting node "+node.label+" with "+rule.name);
            rule.visitNode(node, context);
            //console.log("done")
        }
    }

    function finalizeRules() {
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            rule.finalizeLearning();
        }
    }

    function writeLearningToDisk() {
        let directory = getCompletePath(config.inferredKnowledgeDir);
        for (let i = 0; i < rules.length; i++) {
            let rule = rules[i];
            let fileName = directory + "/" + rule.name + ".json";
            rule.writeRuleInferencesToDisk(fileName);
        }
    }


    function learn() {
        let logfile = config.generationLogFile;
        if (config.usePersistentKnowledge) {
            singleLinelog("Using previously learned knowledge from the disk\n");
            return;
        }
        util.writelog(logfile, getText("Traversal_start"));
        traverseTrees();
        util.writelog(logfile, getText("Traversal_end"));
        console.log("Traversal done, will now finalize rules");
        finalizeRules();
        util.writelog(logfile, getText("Finalized_rules"));
        console.log("Done with finalizing rules");
        writeLearningToDisk();
        console.log("Wrote rule-inferences to disk");
    }

    exports.learn = learn;
})();
