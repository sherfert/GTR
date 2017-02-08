// Author: Satia Herfert

(function() {
    var jsonfile = require('jsonfile');
    
    // Map of programming language (String) -> Map of Parents
    var inferredParents = {};
    // Map of programming language (String) -> Map of mandatory children
    var mandatoryChildren = {};

    // Read inferred information from JSON files
    try {
        let js = jsonfile.readFileSync(__dirname + "/inferredRules/gtrModelRule-js.json");
        let py = jsonfile.readFileSync(__dirname + "/inferredRules/gtrModelRule-py.json");

        inferredParents["JS"] = js.parents;
        inferredParents["PY"] = py.parents;
        mandatoryChildren["JS"] = js.mandatoryChildren;
        mandatoryChildren["PY"] = py.mandatoryChildren;

    } catch(e) {
        // No model
        console.log("NO MODEL OF INFERRED RULES");
        console.log(e);
    }

    /**
     * Tells whether a PNC transformation is allowed with the given arguments.
     *
     * @param p the label of the P node
     * @param l1 the label of the l1 edge
     * @param c the label of the C node
     * @param parents the parents map
     * @returns {boolean} if the transformation is allowed
     */
    function pncTransformationAllowed(p, l1, c, parents) {
        // We assume this is only called if the current subtree contains p -l1-> n -l2-> c
        // Therefore, we only need to test if: p -l1-> c is allowed
        var cParentMap = parents[c];
        if(cParentMap) {
            var l1Set = cParentMap[p];
            if(l1Set) {
                if(l1Set.indexOf(l1) != -1) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Tells wheter an outgoing edge of a node is a mandatory edge.
     * @param nodeLabel the label of the node
     * @param edgeLabel the label of the edge
     * @param mC the mandatoryChildren map
     * @returns {boolean} if the child is mandatory
     */
    function isMandatoryChild(nodeLabel, edgeLabel, mC) {
        var edgeSet = mC[nodeLabel];
        if(edgeSet) {
            if(edgeSet.indexOf(edgeLabel) != -1) {
                return true;
            }
        }
        return false;
    }

    /**
     * Tells whether a PNC transformation is allowed with the given arguments.
     *
     * @param p the label of the P node
     * @param l1 the label of the l1 edge
     * @param c the label of the C node
     * @param pl the programming language. Either 'JS' or 'PY'
     * @returns {boolean} if the transformation is allowed
     */
    function pncTransformationAllowedForPL(p, l1, c, pl) {
        return pncTransformationAllowed(p, l1, c, inferredParents[pl]);
    }

    /**
     * Tells wheter an outgoing edge of a node is a mandatory edge.
     * @param nodeLabel the label of the node
     * @param edgeLabel the label of the edge
     * @param pl the programming language. Either 'JS' or 'PY'
     * @returns {boolean} if the child is mandatory
     */
    function isMandatoryChildForPL(nodeLabel, edgeLabel, pl) {
        return isMandatoryChild(nodeLabel, edgeLabel, mandatoryChildren[pl])
    }

    exports.pncTransformationAllowedForPL = pncTransformationAllowedForPL;
    exports.isMandatoryChildForPL = isMandatoryChildForPL;

})();