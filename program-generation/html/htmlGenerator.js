// Author: Michael Pradel

(function() {

    // TODO: avoid code duplication with jsAstProvider

    var parse5 = require("parse5");
    var fs = require("fs");
    var config = require("./../config").config;
    var util = require("./../util");
    var loTrees = require("./../labeledOrderedTrees");
    var jsonfile = require('jsonfile');

    function treeToHTMLNode(tree, parentHTMLNode) {
        util.assert(tree instanceof loTrees.Node);

        if (tree.label === "null") return null;
        else if (tree.label === "false") return false;
        else if (tree.label === "true") return true;

        // remove padding for primitive values
        if (tree.label.startsWith(("PRIMPAD_")) && tree.label.endsWith("_PRIMPAD")) {
            tree.label = tree.label.slice(8, -8);
        }

        if (tree.outgoing.length === 0) {
            return tree.label;
        }

        var htmlNode = {};
        if (tree.label !== "attribute") htmlNode.nodeName = tree.label;
        var edgeLabelToTargets = new Map();
        for (var i = 0; i < tree.outgoing.length; i++) {
            var edge = tree.outgoing[i];
            if (edge.label.startsWith("childNodes_")) edge.label = "childNodes"; // remove target info from edge labels
            var targets = edgeLabelToTargets.get(edge.label) || [];
            targets.push(edge.target);
            edgeLabelToTargets.set(edge.label, targets);
        }
        edgeLabelToTargets.forEach((targets, edgeLabel) => {
            if (edgeLabel === "attrs" || edgeLabel === "childNodes") {
                var children = [];
                for (var i = 0; i < targets.length; i++) {
                    var target = targets[i];
                    children.push(treeToHTMLNode(target, htmlNode));
                }
                htmlNode[edgeLabel] = children;
            } else {
                if (targets.length === 0) {
                    // nothing to do
                } else if (targets.length === 1) {
                    htmlNode[edgeLabel] = treeToHTMLNode(targets[0], htmlNode);
                } else throw "Unexpected number of targets: " + targets.length;
            }
        });

        // except for some nodes, add required properties: attrs, childNodes, parentNode
        if (tree.label !== "attribute") {
            if (tree.label !== "#documentType" && tree.label !== "#text" && tree.label !== "#comment") {
                if (htmlNode.childNodes === undefined) htmlNode.childNodes = [];
                if (htmlNode.attrs === undefined) htmlNode.attrs = [];
            }
            if (parentHTMLNode !== undefined) htmlNode.parentNode = parentHTMLNode;
        }

        return htmlNode;
    }

    function treeToCode(tree) {
        try {
            //console.log("---------");
            //util.print(tree);
            //console.log("---------");
            var document = treeToHTMLNode(tree);
            //util.print(document);
            //console.log("---------");
            var htmlString = parse5.serialize(document);
            return htmlString
        } catch (e) {
            console.log("Pretty printing HTML failed: " + e);

            /* Write the invalid ASTs to a file in the invalidAST directory for the purposes of debugging */
            if (!fs.existsSync(config.invalidASTsDir)) { // Check if the directory exists
                fs.mkdirSync(config.invalidASTsDir);
            }
            /* Finally, write the tree in a text file and the AST in a json file */
            var filename = new Date().getTime().toString();
            var treeString = JSON.stringify(tree);
            treeString.replace(/,/g, ",\n\t"); // Format the tree
            treeString = "Error :" + e + "\n\n" + treeString;
            fs.writeFileSync(config.invalidASTsDir + "/" + filename + ".txt", treeString);
            jsonfile.writeFileSync(config.invalidASTsDir + "/" + filename + ".json", document);

            return undefined;
        }
    }

    exports.treeToCode = treeToCode;

})();