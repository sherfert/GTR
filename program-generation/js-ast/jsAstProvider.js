// Author: Michael Pradel, Jibesh Patra, Satia Herfert

(function () {

    var fs = require("fs");
    var esprima = require("esprima");
    var config = require("./../config").config;
    var loTrees = require("./../labeledOrderedTrees");
    var util = require("./../util");
    var singleLinelog = require('single-line-log').stdout;
    var getText = require('../getText').getText;
    var ignoredASTProps = {
        type: true,
        raw: true,
        sourceType: true
    };

    var fileNames = [];
    var currentIndex = -1;

    function init() {
        fileNames = [];
        currentIndex = -1;

        util.writelog(config.generationLogFile, getText("Processing_files"));
        var filepath = config.corpusDir;
        var files = fs.readdirSync(filepath);
        const maxFiles = config.maxNoOfFilesToLearnFrom;
        if (maxFiles > 0) {
            files = files.slice(0, maxFiles);
         }
        for (var i = 0; i < files.length; i++) {
            var file = filepath + "/" + files[i];
            if (!fs.lstatSync(file).isDirectory()) { // Skip directories

                fileNames.push(file);
            }
        }
    }

    function astToTree(astNode) {
        if (astNode === null) {
            let node = new loTrees.Node(JSON.stringify(astNode));
            node.setNull(true);
            return node;
        } else if (typeof astNode !== "object") {
            return new loTrees.Node(JSON.stringify(astNode));
        } else if (astNode.pattern !== undefined && astNode.flags !== undefined) {
            return new loTrees.Node("RegExp");
        } else if (astNode instanceof RegExp) {
            return new loTrees.Node(astNode + "");
        }
        util.assert(astNode.type !== undefined);
        var node = new loTrees.Node(astNode.type);
        var astProps = Object.keys(astNode);
        for (var i = 0; i < astProps.length; i++) {
            var astProp = astProps[i];
            if (!ignoredASTProps.hasOwnProperty(astProp)) {
                var astChild = astNode[astProp];
                if (Array.isArray(astChild)) {
                    if (astChild.length > 0) {
                        for (var j = 0; j < astChild.length; j++) {
                            var astChildJ = astChild[j];
                            node.outgoing.push(new loTrees.Edge(astProp, astToTree(astChildJ)));
                        }
                    }
                } else {
                    node.outgoing.push(new loTrees.Edge(astProp, astToTree(astChild)));
                }
            }
        }
        return node;
    }

    function codeToTree(code) {
        var ast = esprima.parse(code);
        return astToTree(ast);
    }

    function nextTree() {
        while (currentIndex < fileNames.length - 1) {
            currentIndex++;
            singleLinelog("Remaining >> " + parseInt(((fileNames.length - currentIndex) / fileNames.length) * 100) +
                "%  Processing: " + fileNames[currentIndex]);
            var content = fs.readFileSync(fileNames[currentIndex]);
            try {
                return codeToTree(content);
            } catch (e) {
                // Will repeat while loop until a file can be parsed successfully
            }
        }
    }

    exports.init = init;
    exports.nextTree = nextTree;
    exports.astToTree = astToTree;
    exports.codeToTree = codeToTree;

})();