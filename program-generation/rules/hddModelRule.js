// Author: Michael Pradel

(function () {
    "use strict";
    var ruleProvider = require("./ruleProvider");
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;
    var loTrees = require("../labeledOrderedTrees");
    var Node = loTrees.Node;
    var Edge = loTrees.Edge;

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

            // Create Map for children if not created yet
            if(!currentRuleInferences.children.has(node.label)) {
                currentRuleInferences.children.set(node.label, new Map());
            }
            let childMap = currentRuleInferences.children.get(node.label);

            // Save the children
            for(let i = 0; i < node.outgoing.length; i++) {
                let edge = node.outgoing[i];
                let child = edge.target;
                // Only store children that have children themselves
                // (Avoids putting literals and identifiers into the sets)
                if(child.outgoing.length == 0) {
                    continue;
                }

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
        // go through each node label in the children map
        for (let [nodeLabel, childMap] of currentRuleInferences.children) {
            // Abort if the node does not have parents associated
            if(!currentRuleInferences.parents.has(nodeLabel)) {
                continue;
            }

            // go through all edges
            for (let [edgeLabel, childSet] of childMap) {
                // Go through all children
                childLoop: for(let childLabel of childSet) {
                    // Go through the parents
                    for(let [parentLabel, parentEdgeSet] of currentRuleInferences.parents.get(nodeLabel)) {
                        // At least one of the children needs to appear as a child in one of the parents children
                        let parentEdgeLabel = hasPossibleChild(parentLabel, parentEdgeSet, childLabel);
                        if(parentEdgeLabel) {
                            // We found a transformation
                            //console.log(`Replace ${nodeLabel} with child of ${edgeLabel}(${childLabel})`);
                            //console.log(`\tSince ${parentLabel} can have ${parentEdgeLabel}(${nodeLabel}|${childLabel})`);
                            currentRuleInferences.transformations.push(createTransformation(nodeLabel, edgeLabel));
                            break childLoop;
                        }
                    }
                }
            }
        }
    }

    /**
     * Create a transformation rule for modelHdd algorithms. The rule consist of replacing
     * the node with its child found with the given edge label.
     *
     * @param nodeLabel the nodeLabel
     * @param edgeLabel the edgeLabel
     * @returns a transformation usable by modelHdd
     */
    function createTransformation(nodeLabel, edgeLabel) {
        return {
            "in": new Node(nodeLabel, new Edge(edgeLabel, "X")),
            "out": "X"
        };
    }

    /**
     * Checks if a node allows a child. The edge leasing to the child must be included in the given set.
     *
     * @param nodeLabel the label of the node
     * @param nodeEdgeSet all allowed edge labels that may lead to the child
     * @param childLabel the label of the child node
     * @returns {boolean} the edge label that leads to the child, undefined otherwise
     */
    function hasPossibleChild(nodeLabel, nodeEdgeSet, childLabel) {
        let childMap = currentRuleInferences.children.get(nodeLabel);
        // go through all edges
        for (let [edgeLabel, childSet] of childMap) {
            // The edge label must be in the given set
            if(nodeEdgeSet.has(edgeLabel)) {
                // Go through all children
                for (let child of childSet) {
                    if (child == childLabel) {
                        return edgeLabel;
                    }
                }
            }
        }
        return undefined;
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