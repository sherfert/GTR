// Author: Satia Herfert

(function () {
    "use strict";
    var ruleProvider = require("./ruleProvider");
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;

    var currentRuleInferences = {
        parents: new Map(),
        numTransformations: 0
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
        }
    }

    // This just counts possible transformations. The information is for statistics only.
    function finalizeLearning() {
        // Reset found transformations
        currentRuleInferences.numTransformations = 0;

        // Go through each node label in the parent map
        for (let [cLabel, cParentMap] of currentRuleInferences.parents) {
            for (let [nLabel, nParentMap] of currentRuleInferences.parents) {
                // Collect all l1 such that n -l2-> c is allowed
                if(cParentMap.has(nLabel)) {
                    var l2Set = cParentMap.get(nLabel);
                } else {
                    // We contonie with the next possible parent of c
                    continue;
                }

                // Check if there is a p such that
                // p -l1-> n and p -l1-> c are allowed
                for(let [pLabel, nParentEdgeSet] of nParentMap) {
                    //console.log(`Testing ${pLabel} -> ${nLabel} -> ${cLabel}`);
                    if(cParentMap.has(pLabel)) {
                        // Find the intersection
                        for(let l1 of nParentEdgeSet) {
                            if(cParentMap.get(pLabel).has(l1)) {
                                // Go through all l2 and create transformations
                                for(let l2 of l2Set) {
                                    // Transformation
                                    // p -l1-> n -l2-> c ==> p -l1-> c
                                    currentRuleInferences.numTransformations++;
                                }
                            }
                        }
                    }
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