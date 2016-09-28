// Author: Satia Herfert

(function() {
    var hddScript = require('./hdd');
    var tfs= require('./transformations');
    var ddmin = require('./ddMin').ddmin;
    var TreeLevelInput = hddScript.TreeLevelInput;
    var treeCache = require('./treeCache');

    /**
     * Applies PNC transformations to a node.
     *
     * @param {String} pl the programming language
     * @param p the P node
     * @param tree the whole tree
     * @param test the oracle
     * @param tryAll if all child replacements should be tested, regardless if they are deemed OK from the corpus
     * @returns {boolean} if at least one transformation could be applied.
     */
    function applyPNCTransformationsToNode(pl, p, tree, test, tryAll) {
        let transformationApplied = false;

        // Go through all children of p
        for(let i = 0; i < p.outgoing.length; i++) {
            let l1 = p.outgoing[i].label;
            let n = p.outgoing[i].target;
            let replaced = false;

            // Go through all children of n
            for(let j = 0; j < n.outgoing.length; j++) {
                let c = n.outgoing[j].target;

                // Test, if a PNC transformation is allowed
                if(tryAll || tfs.pncTransformationAllowedForPL(p.label, l1, c.label, pl)) {

                    //console.log(`\tTry: ${p.label} -${l1}-> ${n.label} --> ${c.label}`);
                    // Replace n with c
                    p.outgoing[i].target = c;
                    if (test(tree) == "fail") {
                        replaced = true;
                        transformationApplied = true;
                        break;
                    } else {
                        // Revert the replacement
                        p.outgoing[i].target = n;
                    }
                }
            }

            if(replaced) {
                // We need to repeat with the new "n"
                i--;
            }
        }

        return transformationApplied;
    }

    /**
     * Applies on each level first ddmin and then possible transformations.
     *
     * There is no DD like checking of combinations of transformations, if single ones do not work.
     *
     * @param {String} pl the programming language
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @param tryAll if all child replacements should be tested, regardless if they are deemed OK from the corpus
     * @returns {Node} the minimized tree.
     */
    function postLevelTransformationHdd(pl, tree, test, tryAll) {
        var currentTree = tree;
        //console.log(`Original tree:\n${tree}`);

        for(var level = 1; level <= currentTree.depth() ; level++) {
            console.log("Testing level " + level + " in PLT-HDD.");
            currentTree = ddmin(new TreeLevelInput(currentTree, level), test).currentCode;
            // Previous level, since the the replacements take place for p's children
            currentTree.applyToLevel(level - 1, p => applyPNCTransformationsToNode(pl, p, currentTree, test, tryAll));
        }

        return currentTree;
    }

    /**
     * Repeats PLT-HDD until nothing changes any more.
     * @param {String} pl the programming language
     * @param {Node} tree the tree obtained from the AST.
     * @param {function(Node): string} test see ddmin
     * @param tryAll if all child replacements should be tested, regardless if they are deemed OK from the corpus
     * @returns {Node} the minimized tree.
     */
    function postLevelTransformationHddStar(pl, tree, test, tryAll) {
        var cachedTest = treeCache.cachedTest(test);
        return hddScript.doWhileTreeShrinks(tree, cachedTest, (pTree, pTest) => postLevelTransformationHdd(pl, pTree, pTest, tryAll));
    }

    exports.postLevelTransformationHdd = postLevelTransformationHdd;
    exports.postLevelTransformationHddStar = postLevelTransformationHddStar;
})();