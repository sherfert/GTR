// Author: Michael Pradel, Jibesh Patra

(function () {
    "use strict";

    var util = require('../util');
    var ruleProvider = require("./ruleProvider");
    var jsonfile = require('jsonfile');
    var fs = require('fs');
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;

    var currentRuleInferences = {
        eachNodeRelationAmongEdgeLabels: new util.FourKeysLists()
    };
    /* TODO Store in maps */
    function visitNode(node, context) {
        for (let i = 0; i < node.outgoing.length; i++) {
            if (node.outgoing.length > 1) {

                let edgeLabel = node.outgoing[i].label;
                let nodeLabel = node.label;
                let targetLabel = node.outgoing[i].target.label;

                for (let j = 0; j < node.outgoing.length; j++) {
                    let nextEdgeLabel = node.outgoing[j].label;
                    if (nextEdgeLabel !== edgeLabel) {
                        let nextTargetLabel = node.outgoing[j].target.label;
                        currentRuleInferences.eachNodeRelationAmongEdgeLabels.append(nodeLabel, edgeLabel, targetLabel, nextEdgeLabel, nextTargetLabel);
                    }
                }
            }
        }
    }

    function finalizeLearning() {

        findAndClearSet(currentRuleInferences.eachNodeRelationAmongEdgeLabels.map);
    }

    function findAndClearSet(map) {
        for (let entry of map) {
            let key = entry[0];
            if (entry[1] instanceof Map) {
                findAndClearSet(entry[1]);
            }
            /* Filter out Sets of length > 1 */
            if (entry[1] instanceof Set && entry[1].size > 1) {
                //entry[1].clear();
                map.delete(key);
            }
        }

    }

    function pickLabelOfNode(node, context, candidates) {
        return ruleProvider.dontCare;
    }

    function pickNextEdgeLabel(node, existingEdgeLabels, context, candidates) {
        return ruleProvider.dontCare;
    }

    function getRuleInferencesFromDisk(fileName) {
        if (!fs.existsSync(fileName)) {
            console.error("File not found");
        } else {
            var data = jsonfile.readFileSync(fileName);
            for (var dataStructure in data) {
                if (data.hasOwnProperty(dataStructure)) {
                    currentRuleInferences[dataStructure] = data[dataStructure];
                }
            }
        }
        util.print(currentRuleInferences);
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
    // get rule inferences from Disk
    exports.getRuleInferencesFromDisk = getRuleInferencesFromDisk;
})();