// Author: Michael Pradel

/**
 * During learning, learns association rules of the form:
 * If the ancestors are A-a-B-b-X, then we should also have D-d-B-b-X.
 *
 * During generation, keep track of which long prefixes (e.g., A-a-B-b)
 * have already been generated with which labels (e.g., X).
 * If the generation gives a label X to some node, check if this matches
 * any of our rules. If yes, leave a to-do for later, to comply with the rule.
 * When picking a node's label that matches a to-do, do it.
 */

(function () {

    var ruleProvider = require("./ruleProvider");
    var util = require("./../util");
    var deterministicRandom = require("./../deterministicRandom");
    var writeToDisk = require('../saveRuleInferencesToDisk').writeToDisk;

    // gathered while visiting nodes during learning
    var suffixToPrefixes = new Map();  // string --> set of strings
    // summary of gathered knowledge
    var longPrefixToFrequency = new util.Histogram();
    var antecedentToConsequentToRule = new Map();  // string --> Map

    // gathered during generation
    var longPrefixToLabels = new Map(); // string --> set of strings
    var longPrefixToLabelTodos = new Map(); // string --> array of strings

    function Rule(antecedent, consequent) {
        this.antecedent = antecedent;
        this.consequent = consequent;
        this.support = 0;
        this.confidence = 0;
    }

    function getAllRules() {
        var result = [];
        antecedentToConsequentToRule.forEach((consequentToRule, _) => {
            consequentToRule.forEach((rule, _) => {
                result.push(rule);
            });
        });
        return result;
    }

    function getRule(antecedent, consequent) {
        var consequentToRule = antecedentToConsequentToRule.get(antecedent);
        if (consequentToRule) {
            return consequentToRule.get(consequent);
        }
    }

    function addRule(rule) {
        var consequentToRule = antecedentToConsequentToRule.get(rule.antecedent) || new Map();
        consequentToRule.set(rule.consequent, rule);
        antecedentToConsequentToRule.set(rule.antecedent, consequentToRule);
    }

    function visitNode(node, context) {
        if (context.nodePath.length >= 3) {
            var parentNodeLabel = context.parent().label;
            var grandParentNodeLabel = context.grandParent().label;
            var lastEdgeLabel = context.lastEdge().label;
            var secondToLastEdgeLabel = context.secondToLastEdge().label;
            var suffix = parentNodeLabel + "__" + lastEdgeLabel + "__" + node.label;
            var prefixes = suffixToPrefixes.get(suffix) || new Set();
            prefixes.add(grandParentNodeLabel + "__" + secondToLastEdgeLabel);
            suffixToPrefixes.set(suffix, prefixes);
        }
    }

    function finalizeLearning() {
        suffixToPrefixes.forEach((prefixes, suffix) => {
            for (var prefix of prefixes.values()) {
                var longPrefix = (prefix + "__" + suffix).split("__").slice(0, -1).join("__");

                // increment count for this long prefix
                longPrefixToFrequency.increment(longPrefix);

                if (prefixes.size > 1) {
                    // increment support of rule for each pair of long prefixes
                    for (var prefix2 of prefixes.values()) {
                        var longPrefix2 = (prefix2 + "__" + suffix).split("__").slice(0, -1).join("__");
                        if (longPrefix !== longPrefix2) {
                            incrementRuleSupport(longPrefix, longPrefix2);
                        }
                    }
                }
            }
        });

        var allRules = getAllRules();
        for (var i = 0; i < allRules.length; i++) {
            var rule = allRules[i];
            rule.confidence = rule.support / longPrefixToFrequency.get(rule.antecedent);
        }

        //console.log("Rules from commonSequenceRule:");
        //for (var i = 0; i < allRules.length; i++) {
        //    var rule = allRules[i];
        //    util.print(rule);
        //}
    }

    function incrementRuleSupport(antecedent, consequent) {
        var rule = getRule(antecedent, consequent);
        if (rule === undefined) {
            rule = new Rule(antecedent, consequent);
            addRule(rule);
        }
        rule.support++;
    }

    function contextToLongPrefix(context) {
        var nodePath = context.nodePath;
        var edgePath = context.edgePath;
        if (nodePath.length < 3) return;
        var longPrefix = context.grandParent().label + "__" + context.secondToLastEdge().label + "__" + context.parent().label + "__" + context.lastEdge().label;
        return longPrefix;
    }

    function pickLabelOfNode(node, context, candidates) {
        var longPrefix = contextToLongPrefix(context);
        if (longPrefix) {
            var labelTodos = longPrefixToLabelTodos.get(longPrefix);
            if (labelTodos !== undefined) {
                util.assert(labelTodos.length > 0);
                var label = labelTodos[0];
                if (labelTodos.length === 1) {
                    longPrefixToLabelTodos.delete(longPrefix);
                } else {
                    longPrefixToLabelTodos.set(longPrefix, labelTodos.slice(1)); // keep remaining to-dos
                }
                //console.log("commonSequenceRule: have picked label " + label + " for long prefix " + longPrefix);
                return new Set([label]);
            }
        }
        return ruleProvider.dontCare;
    }

    function startTree() {
        longPrefixToLabels.clear();
        longPrefixToLabelTodos.clear();
    }

    function havePickedLabelOfNode(node, context, label) {
        var longPrefix = contextToLongPrefix(context);
        if (longPrefix) {
            var labels = longPrefixToLabels.get(longPrefix) || new Set();
            labels.add(label);
            longPrefixToLabels.set(longPrefix, labels);

            var consequentToRule = antecedentToConsequentToRule.get(longPrefix);
            if (consequentToRule) {
                consequentToRule.forEach((rule, consequent) => {
                    if (deterministicRandom.random() < rule.confidence) {
                        // we want to comply with this rule
                        // check if we already comply, otherwise leave a to-do for later
                        var existingLabels = longPrefixToLabels.get(consequent) || new Set();
                        if (!existingLabels.has(label)) {
                            var labelTodos = longPrefixToLabelTodos.get(consequent) || [];
                            //console.log("commonSequenceRule: adding todo: " + consequent + " --> " + label);
                            labelTodos.push(label);
                            longPrefixToLabelTodos.set(consequent, labelTodos);
                        }
                    }
                });
            }
        }
    }

    function pickNextEdgeLabel(node, existingEdgeLabels, context, candidates) {
        return ruleProvider.dontCare;
    }

    function writeRuleInferencesToDisk(fileName) {
    }

    // learning
    exports.visitNode = visitNode;
    exports.finalizeLearning = finalizeLearning;

    // generation
    exports.startTree = startTree;
    exports.pickNextEdgeLabel = pickNextEdgeLabel;
    exports.pickLabelOfNode = pickLabelOfNode;
    exports.havePickedLabelOfNode = havePickedLabelOfNode;

    // write rule inferences
    exports.writeRuleInferencesToDisk = writeRuleInferencesToDisk;
})();