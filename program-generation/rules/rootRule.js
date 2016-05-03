// Author: Michael Pradel, Jibesh Patra

(function () {
    "use strict";
    var ruleProvider = require("./ruleProvider");
    var deterministicRandom = require("./../deterministicRandom");
    var util = require("./../util");
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;
    var getFromDisk = require('../getRuleInferenceFromDisk').getFromDisk;
    var fs = require('fs');
    var jsonfile = require('jsonfile');
    var currentRuleInferences = {rootNodes: new util.Histogram()};// node label --> number of occurrences as root node


    function visitNode(node, context) {
        if (context.nodePath.length === 1) {
            currentRuleInferences.rootNodes.increment(node.label);
        }
    }

    function finalizeLearning() {
        // nothing to return here
    }

    function writeRuleInferencesToDisk(fileName) {
        writeToDisk(fileName, currentRuleInferences);
    }

    function getRuleInferencesFromDisk(fileName) {
        //currentRuleInferences = getFromDisk(fileName);
    }

    function pickLabelOfNode(node, context, candidates) {
        var root = context.nodePath[0];
        if (node !== root || currentRuleInferences.rootNodes.size() === 0)
            return ruleProvider.dontCare;

        // TODO: filter candidates before taking random decision
        return new Set([deterministicRandom.pickByFrequency(currentRuleInferences.rootNodes)]);
    }

    function pickNextEdgeLabel(node, existingEdgeLabels, context, candidates) {
        return ruleProvider.dontCare;
    }

    // learning
    exports.visitNode = visitNode;
    exports.finalizeLearning = finalizeLearning;

    // generation
    exports.pickNextEdgeLabel = pickNextEdgeLabel;
    exports.pickLabelOfNode = pickLabelOfNode;

    // write rule inferences
    exports.writeRuleInferencesToDisk = writeRuleInferencesToDisk;
    // get rule inferences from Disk
    exports.getRuleInferencesFromDisk = getRuleInferencesFromDisk;
})();
