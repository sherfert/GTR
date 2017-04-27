var util = require("./../util");
var loTrees = require("./../labeledOrderedTrees");
const XMLSerializer = require('xmldom').XMLSerializer;
const DOMImplementation = require('xmldom').DOMImplementation;

function treeToxmlObj(tree, xmldoc) {
    util.assert(tree instanceof loTrees.Node);
    let label = tree.label;
    let element;

    if (label.startsWith("NODE_")) {
        let tagName = label.split("NODE_")[1];
        element = xmldoc.createElement(tagName);

        for (let j = 0; j < tree.outgoing.length; j++) {
            let child = tree.outgoing[j].target;
            let edgeLabel = tree.outgoing[j].label;

            if (edgeLabel.startsWith("attrib_")) {
                let attribname = edgeLabel.split("attrib_")[1];
                element.setAttribute(attribname, child.label);
            } else {
                let childobj = treeToxmlObj(child, xmldoc);
                element.appendChild(childobj);
            }

        }
    } else {
        element = xmldoc.createTextNode(label);
    }
    return element;
}


function treeToCode(tree) {
    let xmldoc = new DOMImplementation().createDocument("", "__OWN__", null);
    let xmlobj = treeToxmlObj(tree, xmldoc);
    xmldoc.appendChild(xmlobj);

    return new XMLSerializer().serializeToString(xmldoc).slice("<__OWN__/>".length);
}

// Just to be compatible with the previous archticture...
function treeToCodeNoFileIO(tree) {
    return treeToCode(tree);
}

/*(function () {
 getlotree.init();
 let tree = getlotree.nextTree();
 console.log(tree.toString());
 console.log(treeToCode(tree));
 let xml = treeToCode(tree);
 fs.writeFileSync("newfile.xml", xml);
 })();*/

exports.treeToCode = treeToCode;
exports.treeToCodeNoFileIO = treeToCodeNoFileIO;