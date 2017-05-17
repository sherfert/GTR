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
                // a child edge
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

    let xmlStr = '<?xml version="1.1"?>' + new XMLSerializer().serializeToString(xmldoc).slice("<__OWN__/>".length);
    return encodeString(xmlStr);
}

// Just to be compatible with the previous archticture...
function treeToCodeNoFileIO(tree) {
    return treeToCode(tree);
}

/**
 * Escapes invalid XML 1.1 characters in Strings
 * @param str
 * @returns {string}
 */
function encodeString(str) {
    let res = "";
    for (let i = 0; i < str.length; i++) {
        res += encodeChar(str[i], str.charCodeAt(i))
    }
    return res;
}

/**
 * Escapes invalid XML 1.1 characters
 * @param char
 * @param charCode
 * @returns {*}
 */
function encodeChar(char, charCode) {
    // RestrictedChar::=[#x1-#x8] | [#xB-#xC] |
    // [#xE-#x1F] | [#x7F-#x84] | [#x86-#x9F]
    if ((charCode >= 0x1 && charCode <= 0x8) ||
        (charCode >= 0xB && charCode <= 0xC) ||
        (charCode >= 0xE && charCode <= 0x1F) ||
        (charCode >= 0x7F && charCode <= 0x84) ||
        (charCode >= 0x86 && charCode <= 0x9F)
    ) {
        return "&#" + charCode + ";";
    } else {
        return char;
    }
}

exports.treeToCode = treeToCode;
exports.treeToCodeNoFileIO = treeToCodeNoFileIO;