// Author: Michael Pradel

(function () {
    "use strict";
    var ruleProvider = require("./ruleProvider");
    var util = require("./../util");
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;

    const maxSubsetSize = 4; // TODO for testing

    // information gathered during learning
    var nodeLabelToAncestorSets = new Map(); // label -> set of strings
    var parentLabelsWithoutOutgoing = new Set();
    var parentLabelsWithOutgoing = new Set();
    var nodehavingParentWithoutOutgoing = new Set();

    // summarized information to be used during generation
    var currentRuleInferences = {
        nodeLabelsWithoutPrerequisite: new Set(),
        nodeLabelToPrerequisite: new Map(),
        blackListedParentLabels: new Set()
    };

    function Prerequisites() {
        this.ancestorSets = new Set(); // set of strings (each string is a "__"-separated sequences of labels)
    }

    Prerequisites.prototype = {
        addDisjunction: function (ancestors) {
            this.ancestorSets.add(labelSetToString(ancestors));
        },
        matches: function (ancestorLabelSet) {
            for (var ancestorsString of this.ancestorSets.values()) {
                var ancestors = new Set(ancestorsString.split("__"));
                if (util.intersect(ancestors, ancestorLabelSet).size === 0) {
                    return false;
                }
            }
            return true;
        }
    };

    function labelSetToString(labels) {
        return Array.from(labels).sort().join("__");
    }

    function isInSet(stringThatRepresentsSet, s) {
        return (stringThatRepresentsSet === s ||
        stringThatRepresentsSet.startsWith(s + "__") ||
        stringThatRepresentsSet.includes("__" + s + "__") ||
        stringThatRepresentsSet.endsWith("__" + s));
    }

    function visitNode(node, context) {
        // remember which incoming edges do not have any outgoing edges
        var parent = context.parent();
        if (parent) {
            if (node.outgoing.length === 0) {
                parentLabelsWithoutOutgoing.add(parent.label);
            } else {
                parentLabelsWithOutgoing.add(parent.label);
            }
            if (parentLabelsWithoutOutgoing.has(parent.label)) {
                nodehavingParentWithoutOutgoing.add(node.label);
            }
        }

        // store ancestors of nodes
        var ancestorSetString = labelSetToString(context.ancestorsLabelSet());

        var ancestorSets = nodeLabelToAncestorSets.get(node.label) || new Set();
        ancestorSets.add(ancestorSetString);
        nodeLabelToAncestorSets.set(node.label, ancestorSets);
    }

    function containsBlackListedLabel(ancestors) {
        for (var blackListed of currentRuleInferences.blackListedParentLabels.values()) {
            if (ancestors.indexOf(blackListed) !== -1) return true;
        }
        return false;
    }

    function extractAncestors(ancestorSets) {
        var result = new Set();
        for (var ancestorsString of ancestorSets.values()) {
            // Do not want to add blank strings to the ancestors
            if (ancestorsString.length == 0) {
                continue;
            }
            var ancestors = ancestorsString.split("__");
            // ignore ancestors where some ancestor is in the blacklist
            if (!containsBlackListedLabel(ancestors)) {
                for (var i = 0; i < ancestors.length; i++) {
                    var ancestor = ancestors[i];
                    result.add(ancestor);
                }
            }
        }
        return result;
    }

    function finalizeLearning() {
        // compute incoming edge labels that never have any outgoing edge labels
        currentRuleInferences.blackListedParentLabels = new Set(Array.from(parentLabelsWithoutOutgoing));
        util.removeAllFromSet(currentRuleInferences.blackListedParentLabels, parentLabelsWithOutgoing);

        //console.log("ancestorConstraintRule: Blacklisted parents:");
        //util.print(currentRuleInferences.blackListedParentLabels);

        //console.log("ancestorConstraintRule: data after visiting nodes:");
        //util.print(nodeLabelToAncestorSets);

        for (var nodeLabel of nodeLabelToAncestorSets.keys()) {
            var ancestorSets = nodeLabelToAncestorSets.get(nodeLabel);
            var workingSet = extractAncestors(ancestorSets);
            for (var subsetSize = 1; subsetSize < workingSet.size && subsetSize <= maxSubsetSize; subsetSize++) {
                //console.log(new Date() + ": Calling subsets with set of size " + workingSet.size + " and target size " + subsetSize);
                var subsets = util.subsets(workingSet, subsetSize);
                //console.log(new Date() + ": Calling subsets .. done");
                //console.log(new Date() + ": Checking for " + nodeLabel + " if subsets are constraints for " + subsets.size + " subsets...");
                for (var subset of subsets.values()) {
                    // check if subset is a constraint for nodeLabel
                    var isConstraint = true;
                    isConstraintsCheck: for (var ancestorsString of ancestorSets.values()) {
                        var ancestors = ancestorsString.split("__");
                        if (util.intersect(new Set(ancestors), subset).size === 0) {
                            isConstraint = false;
                            break isConstraintsCheck;
                        }
                    }
                    if (isConstraint) {
                        // remove subset from workingSet and store constraint
                        util.removeAllFromSet(workingSet, subset);
                        //console.log("  ancestorConstraintRule: Found constraint: " + nodeLabel + " must be child of " + Array.from(subset));
                        var prerequisites = currentRuleInferences.nodeLabelToPrerequisite.get(nodeLabel) || new Prerequisites();
                        prerequisites.addDisjunction(subset);
                        currentRuleInferences.nodeLabelToPrerequisite.set(nodeLabel, prerequisites);
                    }

                }
                //console.log(new Date() + ": Done with checking of subsets are constraints for " + subsets.size + " subsets...");
            }

            /* If there is still something in the working list. They will go as OR constraints */
            /* if (prerequisites && workingSet.size > 0) {
             //let prerequisites = currentRuleInferences.nodeLabelToPrerequisite.get(nodeLabel) || new Prerequisites();
             prerequisites.addDisjunction(workingSet);
             currentRuleInferences.nodeLabelToPrerequisite.set(nodeLabel, prerequisites);
             }*/

            /* Filter out the nodes whose parents are blacklisted*/
            /*  for (let key of nodehavingParentWithoutOutgoing) {
             //util.print(currentRuleInferences.nodeLabelToPrerequisite);
             if (currentRuleInferences.nodeLabelToPrerequisite.has(key)) {
             currentRuleInferences.nodeLabelToPrerequisite.delete(key);
             }
             }*/
        }

        // find node labels without prerequisites
        for (let nodeLabel of nodeLabelToAncestorSets.keys()) {
            if (!currentRuleInferences.nodeLabelToPrerequisite.has(nodeLabel)) {
                currentRuleInferences.nodeLabelsWithoutPrerequisite.add(nodeLabel);
            }
        }
    }

    function containsOnePrerequisite(nodePathLabelSet, prerequisites) {
        for (var nodeLabel of nodePathLabelSet.values()) {
            if (prerequisites.indexOf(nodeLabel) !== -1)
                return true;
        }
        return false;
    }


    /**
     * This function takes a node, and context as input and picks a correct label for the node based on the constraint
     * learned during the learning phase.
     * @param node
     * @param context
     * @param candidates
     * @returns {*}
     * During learning a list is kept for node labels that has ancestor contraints.
     */
    function pickLabelOfNode(node, context, candidates) {

        var parent = context.parent();
        if (parent && currentRuleInferences.blackListedParentLabels.has(parent.label)) {
            return ruleProvider.dontCare;
        }
        if (parent && nodehavingParentWithoutOutgoing.has(parent.label)) {
            return ruleProvider.dontCare;
        }

        if (candidates === ruleProvider.dontCare)
            candidates = new Set();
        /* TODO: The following is fixed. Calculate once and use that value */
        for (var nodeLabel of currentRuleInferences.nodeLabelsWithoutPrerequisite.values()) {
            candidates.add(nodeLabel);
        }
        for (let nodeLabelAndPrerequisites of currentRuleInferences.nodeLabelToPrerequisite.entries()) {
            let nodeLabel = nodeLabelAndPrerequisites[0];
            let prerequisites = nodeLabelAndPrerequisites[1];
            let ancestors = context.ancestorsLabelSet();
            if (prerequisites.matches(ancestors)) {
                candidates.add(nodeLabel);
            }
        }

        if (candidates.size > 0) {
            //console.log("ancestorConstraintRule: allowed is only: ");
            //util.print(candidates);
            return candidates;
        } else {
            //console.log("ancestorConstraintRule: don't care");
            return ruleProvider.dontCare;
        }
    }

    function pickNextEdgeLabel(node, existingEdgeLabels, context, candidates) {
        return ruleProvider.dontCare;
    }

    function writeRuleInferencesToDisk(fileName) {
        // FIXME: Can't save currentRuleInferences.nodeLabelToPrerequisite() to the JSON file. It's always empty
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
