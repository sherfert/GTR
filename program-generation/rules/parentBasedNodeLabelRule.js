// Author: Michael Pradel

(function() {

    var ruleProvider = require("./ruleProvider");
    var util = require("./../util");
    var deterministicRandom = require("./../deterministicRandom");
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;

    var parentAndEdgeToHisto = new Map();

    function visitNode(node, context) {
        var parent = context.parent();
        if (parent) {
            var lastEdge = context.lastEdge();
            var parentAndEdge = parent.label + "__" + lastEdge.label;
            var histo = parentAndEdgeToHisto.get(parentAndEdge) || new util.Histogram();
            histo.increment(node.label);
            parentAndEdgeToHisto.set(parentAndEdge, histo);
        }
    }

    function finalizeLearning() {
        //console.log("node rule:");
        //util.print(parentAndEdgeToHisto);
        //console.log("------------");
    }

    function pickLabelOfNode(node, context, candidates) {
        //console.log("parentBasedNodelLabelRule: picking label from candidates:");
        //util.print(candidates);
        var parent = context.parent();
        if (parent) {
            var lastEdge = context.lastEdge();
            var parentAndEdge = parent.label + "__" + lastEdge.label;
            var histo = parentAndEdgeToHisto.get(parentAndEdge);
            if (histo) {
                var filteredHisto;
                if (candidates === ruleProvider.dontCare)
                    filteredHisto = histo;
                else
                    filteredHisto = histo.filter(nodeLabel => {
                        return candidates.has(nodeLabel);
                    });
                var selectedLabel = deterministicRandom.pickByFrequency(filteredHisto);
                //console.log("parentBasedNodeLabelRule: picking randomly from histogram of "+parentAndEdge+": " + selectedLabel);
                return new Set([selectedLabel]);
            }
        }

        return ruleProvider.dontCare;
    }

    function pickNextEdgeLabel(node, existingEdgeLabels, context, candidates) {
        return ruleProvider.dontCare;
    }

    function writeRuleInferencesToDisk(fileName) {
        //writeToDisk(fileName, currentRuleInferences);
    }

    // learning
    exports.visitNode = visitNode;
    exports.finalizeLearning = finalizeLearning;

    // generation
    exports.pickNextEdgeLabel = pickNextEdgeLabel;
    exports.pickLabelOfNode = pickLabelOfNode;

    // write rule inferences
    exports.writeRuleInferencesToDisk = writeRuleInferencesToDisk;
})();