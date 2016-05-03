// Author: Michael Pradel

(function () {

    var ruleProvider = require("./ruleProvider");
    var util = require("./../util");
    var deterministicRandom = require("./../deterministicRandom");
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;

    var ancestorToHisto = new Map();

    function summarizePrefix(node, context) {
        var grandParent = context.grandParent();
        if (grandParent) {
            var secondToLastEdge = context.secondToLastEdge();
            var parent = context.parent();
            var lastEdge = context.lastEdge();
            var prefix = [grandParent.label, secondToLastEdge.label, parent.label, lastEdge.label].join("__");
            return prefix;
        }
    }

    function visitNode(node, context) {
        var prefix = summarizePrefix(node, context);
        if (prefix) {
            var histo = ancestorToHisto.get(prefix) || new util.Histogram();
            histo.increment(node.label);
            ancestorToHisto.set(prefix, histo);
        }
    }

    function finalizeLearning() {
        //console.log("ancestor-based node rule:");
        //console.log("------------");
        //util.print(ancestorToHisto);
    }

    function pickLabelOfNode(node, context, candidates) {
        var prefix = summarizePrefix(node, context);
        if (prefix) {
            var histo = ancestorToHisto.get(prefix);
            if (histo) {
                var filteredHisto;
                if (candidates === ruleProvider.dontCare)
                    filteredHisto = histo;
                else
                    filteredHisto = histo.filter(nodeLabel => {
                        return candidates.has(nodeLabel);
                    });
                var selectedLabel = deterministicRandom.pickByFrequency(filteredHisto);
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