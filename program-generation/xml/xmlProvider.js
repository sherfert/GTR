/**
 * Created by Jibesh Patra on 26-Apr-2017.
 */

const fs = require('fs');
const DOMParser = require('xmldom').DOMParser;
const config = require("./../config").config;
const loTrees = require("./../labeledOrderedTrees");

let fileNames = [];
let currentIndex = -1;

function init() {
    let filepath = config.corpusDir;
    let files = fs.readdirSync(filepath);
    const maxFiles = config.maxNoOfFilesToLearnFrom;

    if (maxFiles > 0) {
        files = files.slice(0, maxFiles);
    }

    for (let i = 0; i < files.length; i++) {
        let file = filepath + "/" + files[i];
        if (!fs.lstatSync(file).isDirectory()) { // Skip directories
            fileNames.push(file);
        }
    }
    console.log("Found " + fileNames.length + " files.");
}

function xmlObjToTree(obj) {
    const TEXT_NODE = 3;
    if (obj === null) {
        let node = new loTrees.Node(JSON.stringify(obj));
        node.setNull(true);
        return node;
    } else if (typeof obj !== "object") {
        return new loTrees.Node(JSON.stringify(obj));
    } else if (obj.nodeType === TEXT_NODE) {
        return new loTrees.Node(obj.data);
    }

    var node = new loTrees.Node("NODE_" + obj.nodeName);
    for (let j = 0; j < obj.attributes.length; j++) {
        var child = obj.attributes[j];
        let childNode = xmlObjToTree(JSON.parse(child.value));
        node.outgoing.push(new loTrees.Edge("attrib_" + child.name, childNode));
    }

    for (var i = 0; i < obj.childNodes.length; i++) {
        var child = obj.childNodes[i];
        if (child.nodeType === TEXT_NODE && child.data.trim().length === 0) {
            continue;
        }
        let childNode = xmlObjToTree(child);
        node.outgoing.push(new loTrees.Edge("child_" + child.nodeName, childNode));

    }
    return node;
}

function codeToTree(code) {
    var doc = new DOMParser().parseFromString(code).documentElement;
    var tree = xmlObjToTree(doc);
    return tree;
}


function nextTree() {
    while (currentIndex < fileNames.length - 1) {
        currentIndex++;
        console.log("Remaining >> " + parseInt(((fileNames.length - currentIndex) / fileNames.length) * 100) +
            "%  Processing: " + fileNames[currentIndex]);
        var content = fs.readFileSync(fileNames[currentIndex], 'utf8');
        try {
            return codeToTree(content);
        } catch (e) {
            // console.log("Error" + e);
            // Will repeat while loop until a file can be parsed successfully
        }
    }
}

exports.init = init;
exports.nextTree = nextTree;
exports.astToTree = xmlObjToTree;
exports.codeToTree = codeToTree;