// Author: Michael Pradel, Jibesh Patra

(function () {
    "use strict";

    var ruleProvider = require("./ruleProvider");
    var util = require("./../util.js");
    var deterministicRandom = require("./../deterministicRandom");
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;

    // data extracted during learning
    var nodeLabelToEdgeLabelExistence = new util.TwoKeysHistogram();
    var nodeLabelToEdgeLabelFrequency = new util.TwoKeysList();
    var nodeLabelToFrequency = new util.Histogram();

    // summary of extracted data for faster lookup during generation:
    var currentRuleInferences = {nodeToEdgeLabelExistenceProbabilities: new Map()};
    //var nodeToEdgeLabelExistenceProbabilities = new Map();
    // TODO: could also summarize nodeLabelToEdgeLabelFrequency for better performance, if needed

    function visitNode(node, context) {
        var edgeLabelToFrequency = new util.Histogram();
        var nodeLabel = node.label;
        nodeLabelToFrequency.increment(nodeLabel);
        for (var i = 0; i < node.outgoing.length; i++) {
            var edgeLabel = node.outgoing[i].label;
            edgeLabelToFrequency.increment(edgeLabel);
        }

        edgeLabelToFrequency.map.forEach((frequency, edgeLabel) => {
            nodeLabelToEdgeLabelExistence.increment(nodeLabel, edgeLabel);
            nodeLabelToEdgeLabelFrequency.append(nodeLabel, edgeLabel, frequency);
        });
    }

    function finalizeLearning() {
        nodeLabelToFrequency.map.forEach((nodeFrequency, nodeLabel) => {
            var edgeLabelExistenceProbabilities = currentRuleInferences.nodeToEdgeLabelExistenceProbabilities.get(nodeLabel) || new Map();
            var edgeLabelToExistenceFrequency = nodeLabelToEdgeLabelExistence.map.get(nodeLabel);
            if (edgeLabelToExistenceFrequency) {
                edgeLabelToExistenceFrequency.forEach((edgeFrequency, edgeLabel) => {
                    var prob = edgeFrequency / nodeFrequency;
                    edgeLabelExistenceProbabilities.set(edgeLabel, prob);
                });
            }
            if (edgeLabelExistenceProbabilities.size > 0) {
                currentRuleInferences.nodeToEdgeLabelExistenceProbabilities.set(nodeLabel, edgeLabelExistenceProbabilities);
            }
        });
        //console.log("Summary of edgeLabelRule's edge propabilities:");
        //util.print(currentRuleInferences.nodeToEdgeLabelExistenceProbabilities);
        //console.log("Summary of edgeLabelRule's edge frequencies:");
        //util.print(nodeLabelToEdgeLabelFrequency);
    }

    function pickLabelOfNode(node, context, candidates) {
        return ruleProvider.dontCare;
    }

    var lastSeenNode;
    var planForLastSeenNode;  // edge labels --> Number

    function planEdges(node, context) {
        planForLastSeenNode = new Map();
        lastSeenNode = node;
        var edgeExistenceProbabilities = currentRuleInferences.nodeToEdgeLabelExistenceProbabilities.get(node.label);
        if (edgeExistenceProbabilities) {
            edgeExistenceProbabilities.forEach((prob, edgeLabel) => {
                if (deterministicRandom.random() < prob) {
                    var edgeFrequencies = nodeLabelToEdgeLabelFrequency.get(node.label, edgeLabel);
                    var number = deterministicRandom.pickArrayElement(edgeFrequencies);
                    planForLastSeenNode.set(edgeLabel, number);
                }
            });
        }
        //console.log("Planned edges for "+node.label+":");
        //util.print(planForLastSeenNode);
    }

    function pickEdgeAccordingToPlan(node, existingEdgeLabels, context) {
        // count existing edge labels
        var existingLabelHistogram = new util.Histogram();
        for (var i = 0; i < existingEdgeLabels.length; i++) {
            var edgeLabel = existingEdgeLabels[i];
            existingLabelHistogram.increment(edgeLabel);
        }

        // compare to plan and return the first missing edge that we find
        for (var edgeLabelAndPlannedFreq of planForLastSeenNode.entries()) {
            var edgeLabel = edgeLabelAndPlannedFreq[0];
            var plannedFreq = edgeLabelAndPlannedFreq[1];
            if (plannedFreq > existingLabelHistogram.get(edgeLabel)) {
                return edgeLabel;
            }
        }
    }

    function pickNextEdgeLabel(node, existingEdgeLabels, context, candidates) {
        if (lastSeenNode === undefined || lastSeenNode !== node) {
            planEdges(node, context);
        }
        var edgeLabel = pickEdgeAccordingToPlan(node, existingEdgeLabels, context);
        if (edgeLabel) {
            return new Set([edgeLabel]);
        } else {
            return new Set();
        }
    }

    function writeRuleInferencesToDisk(fileName) {
        writeToDisk(fileName, currentRuleInferences);
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
