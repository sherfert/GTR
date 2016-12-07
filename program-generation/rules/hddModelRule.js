// Author: Satia Herfert

(function () {
    "use strict";
    var ruleProvider = require("./ruleProvider");
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;

    var currentRuleInferences = {
        parents: new Map(),
        mandatoryChildren: new Map(),
        numParents: 0
    };

    function visitNode(node, context) {
        // Only do sth for nodes with children (because leaves are just identifiers, etc. for which we don't want rules)
        if(node.outgoing.length > 0) {
            // Save the parent
            if(context.parent()) {
                // Create Map if not created yet
                if(!currentRuleInferences.parents.has(node.label)) {
                    currentRuleInferences.parents.set(node.label, new Map());
                }
                let parentMap = currentRuleInferences.parents.get(node.label);


                // Create a Set for the parent edges that lead to this node if not created yet
                let parent = context.parent();
                if(!parentMap.has(parent.label)) {
                    parentMap.set(parent.label, new Set())
                }
                let parentEdgeSet = parentMap.get(parent.label);

                // Add parent edge to Set
                parentEdgeSet.add(context.lastEdge().label);
            }
            // Save mandatory children
            var childrenSet = new Set();
            // Add all children...
            for(let i = 0; i < node.outgoing.length; i++) {
                //... that are not a null value
                if(!node.outgoing[i].target.isNull()) {
                    childrenSet.add(node.outgoing[i].label);
                }
            }
            if(currentRuleInferences.mandatoryChildren.has(node.label)) {
                // Intersect with so far mandatory children
                var intersection = new Set([...childrenSet].filter(x =>
                    currentRuleInferences.mandatoryChildren.get(node.label).has(x)));

                currentRuleInferences.mandatoryChildren.set(node.label, intersection);
            } else {
                //Put the set in the map
                currentRuleInferences.mandatoryChildren.set(node.label, childrenSet);
            }
        }
    }

    // This just counts parents. The information is for statistics only.
    function finalizeLearning() {
        // Reset found parents
        currentRuleInferences.numParents = 0;

        // Go through each node label in the parent map
        for (let [childNodeLabel, parentMap] of currentRuleInferences.parents) {
            for (let [parentLabel, edgeNameSet] of parentMap) {
                for(let edgeName of edgeNameSet) {
                    currentRuleInferences.numParents++;
                }
            }
        }
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