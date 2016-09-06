// Author: Satia Herfert

(function() {
    var jsonfile = require('jsonfile');
    
    // Map of programming language (String) -> Array of Transformations
    var inferredTransformations = {};

    // Read inferred transformations from JSON files
    try {
        inferredTransformations["JS"] =
            jsonfile.readFileSync(__dirname + "/inferredRules/hddModelRule-js.json").transformations;
        inferredTransformations["PY"] =
            jsonfile.readFileSync(__dirname + "/inferredRules/hddModelRule-py.json").transformations;
    } catch(e) {
        // No model
        console.log("NO MODEL OF INFERRED RULES");
        console.log(e);
    }

    /**
     * Tries to apply a certain transformation to a tree
     * @param tree the tree
     * @param rule the transformation
     * @returns the transformed tree, if the transformation applies, undefined otherwise.
     */
    function match(tree, rule) {
        // Store named nodes
        var map = {};
        if(test(tree, rule.in, map)) {
            // Return the replacement tree
            return replaceInTree(rule.out, map);
        }

    }

    /**
     * Tests if a tree matches a given pattern tree (inTree). Stores all placeholder nodes of tree in the map.
     * @param tree the original tree
     * @param inTree a pattern tree, where some nodes may be replaced by strings, and thus become placeholders
     * @param map the current placeholder map
     * @returns {boolean} if the tree matches the pattern tree
     */
    function test(tree, inTree, map) {
        if(typeof inTree === 'string') {
            // The current node is a placeholder
            map[inTree] = tree;
            return true;
        }
        // Compare the labels
        if(tree.label != inTree.label) {
            return false;
        }
        // Ensure that each edge of inTree is present in tree
        for (let i = 0; i < inTree.outgoing.length; i++) {
            let found = false;
            for (let j = 0; j < tree.outgoing.length; j++) {
                if(inTree.outgoing[i].label == tree.outgoing[j].label) {
                    found = true;
                    // The labels match, now the child nodes must match too
                    if(!test(tree.outgoing[j].target, inTree.outgoing[i].target, map)) {
                        return false;
                    }
                    break;
                }
            }
            if(!found) {
                return false;
            }
        }

        // All edges were found
        return true;
    }

    /**
     * Given a pattern tree and a replacement map, it replaces all placeholders in the tree
     * with the corresponding replacements from the map.
     * @param tree the pattern tree
     * @param map the replacement map
     * @returns the tree with replacements in place
     */
    function replaceInTree(tree, map) {
        if(typeof tree === 'string') {
            // The current node is a placeholder
            return map[tree];
        }
        // Replace in all child nodes
        for (let i = 0; i < tree.outgoing.length; i++) {
            tree.outgoing[i].target = replaceInTree(tree.outgoing[i].target, map);
        }
        return tree;
    }

    /**
     * TODO given that we know which parents allow which children, it
     * would be even more suitable checking if that particular parent P of N,
     * allows the child C of N (under the same edge label) as a child; instead
     * of doing it rule based just on N and C.
     * TODO also consider root replacement
     *
     * Returns an array of all possible transformations of a subtree.
     * @param subtree the subtree
     * @param ts the list of general transformations
     * @returns {Array} all possible transformations
     */
    function possibleTransformations(subtree, ts) {
        // Try all transformations
        var res = [];
        for(let i = 0; i < ts.length; i++) {
            var transformed = match(subtree, ts[i]);
            if(transformed) {
                // There is a possible replacement
                res.push(transformed);
            }
        }
        return res;
    }

    /**
     * Returns all possible transformations for that subtree and the passed programming language.
     *
     * @param subtree the subtree
     * @param {String} pl the programming language. "JS" or "PY"
     * @returns {Array} all possible transformations
     */
    function possibleTransformationsWithModel(subtree, pl) {
        return possibleTransformations(subtree, inferredTransformations[pl]);
    }

    exports.possibleTransformationsWithModel = possibleTransformationsWithModel;

})();