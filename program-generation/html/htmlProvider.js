// Author: Michael Pradel

(function() {

    // TODO: avoid code duplication with jsAstProvider

    var parse5 = require("parse5");
    var fs = require("fs");
    var config = require("./../config").config;
    var util = require("./../util");
    var loTrees = require("./../labeledOrderedTrees");

    var excludedPropNames = new Set(["parentNode", "nodeName"]);

    var trees = [];
    var currentIndex = -1;

    function init() {
        var filePath = config.corpusDir;
        var files = fs.readdirSync(filePath);
        fileLoop: for (var i = 0; i < files.length && i < config.maxNoOfFilesToLearnFrom; i++) {
            var file = filePath + "/" + files[i];
            if (!fs.lstatSync(file).isDirectory()) { // Skip directories
                var content = fs.readFileSync(file, {encoding:"utf8"});
                try {
                    var document = parse5.parse(content);
                } catch (e) {
                    continue fileLoop; // ignore files with parse errors
                }
                try {
                    var tree = htmlNodeToTree(document);
                    //console.log("===== Tree to learn from:");
                    //util.print(tree);
                    console.log("Tree size: " + tree.nbNodes());
                    //console.log("==========================");
                    trees.push(tree);
                } catch (e) {
                    console.log("Ignoring a tree because of exceptions");
                }
            }
        }
    }

    function htmlNodeToTree(htmlNode) {
        if (htmlNode === null) {
            return new loTrees.Node("null");
        }
        var nodeName = htmlNode.nodeName;
        if (htmlNode.hasOwnProperty("name") && htmlNode.hasOwnProperty("value")) {
            nodeName = "attribute";  // special case: attribute node, which has no "nodeName"
        }
        if (nodeName !== undefined) {
            var newNode = new loTrees.Node(nodeName);
            var propNames = Object.keys(htmlNode);
            for (var i = 0; i < propNames.length; i++) {
                var propName = propNames[i];
                if (!excludedPropNames.has(propName)) {
                    var prop = htmlNode[propName];
                    if (Array.isArray(prop)) {
                        for (var j = 0; j < prop.length; j++) {
                            var childHtmlNode = prop[j];
                            // encode info about target in edge label
                            var edgeLabel = propName === "childNodes" ? (propName + "_" + childHtmlNode.nodeName) : propName;
                            var newEdge = new loTrees.Edge(edgeLabel, htmlNodeToTree(childHtmlNode));
                            newNode.outgoing.push(newEdge);
                        }
                    } else {
                        // encode info about target in edge label
                        var edgeLabel = propName === "childNodes" ? (propName + "_" + prop.nodeName) : propName;
                        var newEdge = new loTrees.Edge(edgeLabel, htmlNodeToTree(prop));
                        newNode.outgoing.push(newEdge);
                    }
                }
            }
            return newNode;
        } else {
            if (!(typeof htmlNode === "string" || typeof htmlNode === "boolean")) {
                console.log("handling " + (typeof htmlNode) + " as string");
            }
            return new loTrees.Node("PRIMPAD_" + htmlNode + "_PRIMPAD");
        }
    }

    function nextTree() {
        currentIndex++;
        if (currentIndex < trees.length) {
            return trees[currentIndex];
        }
    }

    exports.init = init;
    exports.nextTree = nextTree;

})();