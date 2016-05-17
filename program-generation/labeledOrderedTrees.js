// Author: Michael Pradel, Satia Herfert
// TODO comment file
(function() {

    var util = require("./util");

    /**
     * A tree or node of a tree, including its subtree.
     * @param {string} label the label of the node.
     * @constructor
     */
    function Node(label) {
        util.assert(typeof label === "string", typeof label);
        this.label = label;
        this.outgoing = [];
    }

    Node.prototype = {
        toString:function() {
            return this.toPrettyString(0);
        },
        /**
         * @param depth the distance of this node to the root node. Needed for correct indentation.
         * @returns {string} a pretty string representation of the tree.
         */
        toPrettyString:function(depth) {
            var indentation = "";
            for(let i = 0; i < depth; i++) {
                indentation += "  ";
            }
            var res = indentation + this.label + (this.hasOwnProperty("number") ? " (" + this.number + ")" : "") + "\n";
            for (let i = 0; i < this.outgoing.length; i++) {
                var outgoing = this.outgoing[i];
                var target = outgoing.target;
                res += indentation + "-" + outgoing.label + "->" + target.label + "\n";
                res += target.toPrettyString(depth + 1);
            }
            return res;


        },
        /**
         * @returns {number} the number of nodes in the tree.
         */
        nbNodes:function() {
            var sum = 1;
            for (var i = 0; i < this.outgoing.length; i++) {
                var outgoing = this.outgoing[i];
                var target = outgoing.target;
                sum += target.nbNodes();
            }
            return sum;
        },
        /**
         * Traverses the tree in preorder and applies the given function to each node.
         * @param {function(node)} func the function to apply.
         */
        preorder:function(func) {
            func(this);
            for (var i = 0; i < this.outgoing.length; i++) {
                var outgoing = this.outgoing[i];
                var target = outgoing.target;
                target.preorder(func);
            }
        },
        /**
         * Traverses the tree in postorder and applies the given function to each node.
         * @param {function(node)} func the function to apply.
         */
        postorder:function(func) {
            for (var i = 0; i < this.outgoing.length; i++) {
                var outgoing = this.outgoing[i];
                var target = outgoing.target;
                target.postorder(func);
            }
            func(this);
        },
        /**
         * Applies a function to all nodes of a particular level of the tree.
         * @param {number} level the level
         * @param {function(node)} func the function to apply
         */
        applyToLevel:function(level, func) {
            if(level == 0) {
                func(this);
            } else {
                // Recurse until we reache the level
                for (var i = 0; i < this.outgoing.length; i++) {
                    var outgoing = this.outgoing[i];
                    var target = outgoing.target;
                    target.applyToLevel(level - 1, func);
                }
            }
        },
        /**
         * Creates a deep copy of this tree
         * @returns {Node} a deep copy.
         */
        deepCopy:function() {
            var node = new Node(this.label);
            for (var i = 0; i < this.outgoing.length; i++) {
                var oldEdge = this.outgoing[i];
                var newEdge = oldEdge.deepCopy();
                node.outgoing.push(newEdge);
            }
            return node;
        }
    };

    /**
     * An edge in a tree with a label and a target node.
     * @param {string} label the label
     * @param {Node} target the target node
     * @constructor
     */
    function Edge(label, target) {
        this.label = label;
        this.target = target;
    }

    Edge.prototype = {
        /**
         * Part of Node's deepCopy function.
         * @returns {Edge} a deep copy of this edge.
         */
        deepCopy: function () {
            return new Edge(this.label, this.target.deepCopy());
        }
    };


    exports.Node = Node;
    exports.Edge = Edge;

})();