// Author: Satia Herfert

(function() {
    var jsonfile = require('jsonfile');
    
    // Map of programming language (String) -> Map of Parents
    var inferredParents = {};

    // Read inferred transformations from JSON files
    try {
        inferredParents["JS"] =
            jsonfile.readFileSync(__dirname + "/inferredRules/hddModelRule-js.json").parents;
        inferredParents["PY"] =
            jsonfile.readFileSync(__dirname + "/inferredRules/hddModelRule-py.json").parents;
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
        // We assume this is only called if the current substree contains p -l1-> n -l2-> c
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

    exports.pncTransformationAllowedForPL = pncTransformationAllowedForPL;

})();