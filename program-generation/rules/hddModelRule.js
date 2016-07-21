// Author: Michael Pradel

(function () {
    "use strict";
    var ruleProvider = require("./ruleProvider");
    var jsonfile = require('jsonfile');
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;
    var currentRuleInferences = {
        children: new Map(),
        parents: new Map(),
        transformations: []
    };

    function visitNode(node, context) {
        // Only do sth for nodes with children
        if(node.outgoing.length > 0) {
            // Save the parent
            if(context.parent()) {
                // Create Set if not created yet
                if(!currentRuleInferences.parents.has(node.label)) {
                    currentRuleInferences.parents.set(node.label, new Set());
                }
                let parentSet = currentRuleInferences.parents.get(node.label);
                // Add parent to Set
                parentSet.add(context.parent().label);
            }

            // Create Map for children if not created yet
            if(!currentRuleInferences.children.has(node.label)) {
                currentRuleInferences.children.set(node.label, new Map());
            }
            let childMap = currentRuleInferences.children.get(node.label);

            // Save the children
            for(let i = 0; i < node.outgoing.length; i++) {
                let edge = node.outgoing[i];
                let child = edge.target;

                // Create Set for the particular edge if not created yet
                if(!childMap.has(edge.label)) {
                    childMap.set(edge.label, new Set());
                }
                let edgeChildSet = childMap.get(edge.label);

                // Save the current child
                edgeChildSet.add(child.label);
            }
        }
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