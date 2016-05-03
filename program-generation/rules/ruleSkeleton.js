// Author: Michael Pradel

(function () {
    "use strict";
    var ruleProvider = require("./ruleProvider");
    var jsonfile = require('jsonfile');
    var toJSON = require('./../util').toJSON;
    var currentRuleInferences = {}; // An object that contains inferences for the current rule
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;

    function visitNode(node, context) {
        // nothing to return here
    }

    function finalizeLearning() {
        // nothing to return here
    }

    function pickLabelOfNode(node, context, candidates) {
        return ruleProvider.dontCare;
    }

    function pickNextEdgeLabel(node, existingEdgeLabels, context, candidates) {
        return ruleProvider.dontCare;
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