// Author: Michael Pradel, Jibesh Patra

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
    var corpusFiletoSize = {
        title: "Corpus file vs size",
        x: [],
        x_title: "files",
        y: [],
        y_title: "size (KB)",
        plotmean: false,
        annotation: true // for plotting mean and max
    }; // For plotting

    var plot = require('../utilities/plotter').plot;
    var trees = [];
    var currentIndex = -1;

    function init() {
        util.writelog(config.generationLogFile, getText("Processing_files"));
        var filepath = config.corpusDir;
        var files = fs.readdirSync(filepath);
        const maxFiles = config.maxNoOfFilesToLearnFrom;
        /* Selecting only top number of files to learn from */
        if (maxFiles > 0) {
            files = files.slice(0, maxFiles);
        }
        fileLoop: for (var i = 0; i < files.length; i++) {
            var file = filepath + "/" + files[i];
            if (!fs.lstatSync(file).isDirectory()) { // Skip directories
                //singleLinelog.clear();
                singleLinelog("Remaining >> " + parseInt(((files.length - i) / files.length) * 100) + "%  Processing: " + files[i]);
                corpusFiletoSize.x.push(i);
                corpusFiletoSize.y.push(util.getFileSizeinKB(file));
                var content = fs.readFileSync(file);
                try {
                    var ast = esprima.parse(content);
                } catch (e) {
                    continue fileLoop; // ignore files with parse errors
                }
                try {
                    var tree = astToTree(ast);
                    trees.push(tree);

                } catch (e) {
                    //console.log("Ignoring a tree because of exceptions");
                }
            }
        }
        /* Plotting each corpus file Vs its size in KB */
        util.writeToJSONfile(process.cwd()+config.corpusFiles_vs_Size, corpusFiletoSize);
        //plot(corpusFiletoSize, config.corpusFiles_vs_Size.split(".json")[0] + ".eps");
    }

    function astToTree(astNode) {
        if (astNode === null || typeof astNode !== "object") {
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

    function nextTree() {
        currentIndex++;
        if (currentIndex < trees.length) {
            return trees[currentIndex];
        }
    }

    exports.init = init;
    exports.nextTree = nextTree;
    exports.astToTree = astToTree;

})();