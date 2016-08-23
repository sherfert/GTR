// Author: Michael Pradel, Satia Herfert
(function() {

    var util = require("./util");
    var sha256 = require('sha256');

    /**
     * A tree or node of a tree, including its subtree.
     * @param {string} label the label of the node.
     * @constructor
     */
    function Node(label) {
        util.assert(typeof label === "string", typeof label);
        this.label = label;
        this.outgoing = [];
        // In case edges were passed to the constructor
        for(var i = 1; i < arguments.length; i++) {
            this.outgoing.push(arguments[i]);
        }
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
         * Returns a hash value of the tree. The value is the SHA-256 of tree.toString()
         */
        hash:function() {
            return sha256(this.toString());
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
         * Return the depth of the tree. A tree with just one node has a depth of 0.
         */
        depth:function() {
            var max = 0;
            for (var i = 0; i < this.outgoing.length; i++) {
                var outgoing = this.outgoing[i];
                var target = outgoing.target;
                max = Math.max(max, target.depth() + 1);
            }
            return max;
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
                // Recurse until we reach the level
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
        },
        /**
         * Creates an JS object from this tree
         *
         * @param nameProperty {String} the name of the property that denotes the name of a node
         * @param emptyNodes {Array<String>} the names of nodes that should be an object (instead of a primitive),
         *                                   even though they do not have children
         * @param mandatoryArrayProperties {object} for each node label, the list of edge labels that require its child
         *                                          to be an array instead of an object.
         * @returns {object}
         */
        createObj:function(nameProperty, emptyNodes, mandatoryArrayProperties) {
            if(this.outgoing.length === 0 && emptyNodes.indexOf(this.label) == -1) {
                try {
                    return JSON.parse(this.label);
                } catch (err) {
                    return this.label;
                }
            }

            // Create the object
            let obj = {};
            obj[nameProperty] = this.label;

            var arrayPropNames = mandatoryArrayProperties[this.label] || [];
            // Create arrays for all array prop names
            for(let i = 0; i < arrayPropNames.length; i++) {
                obj[arrayPropNames[i]] = [];
            }

            for(let i = 0; i < this.outgoing.length; i++) {
                let propName = this.outgoing[i].label;
                // Check if this property is a mandatory array property
                let needArray = arrayPropNames.indexOf(propName) != -1;
                if (needArray) {
                    let propObj = this.outgoing[i].target.createObj(nameProperty, emptyNodes, mandatoryArrayProperties);
                    obj[propName].push(propObj);
                } else {
                    // Properties without required arrays
                    let propObj = this.outgoing[i].target.createObj(nameProperty, emptyNodes, mandatoryArrayProperties);
                    obj[propName] = propObj;
                }
            }
            return obj;
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

    /**
     * Creates a tree from any object.
     *
     * @param obj the object.
     * @param nameProperty {String} the name of the property that denotes the name of a node
     * @param ignoreProperties {Array<String>} all properties that should be ignored for conversion
     * @returns {Node} the Node
     */
    var createTree = function(obj, nameProperty, ignoreProperties) {
        if (obj === null || typeof obj !== "object" || obj instanceof String) {
            return new Node(JSON.stringify(obj));
        }

        let node = new Node(obj[nameProperty]);
        // Iterate through all properties
        for (let key in obj) {
            if (obj.hasOwnProperty(key) && ignoreProperties.indexOf(key) == -1) {
                if(key != nameProperty ) {
                    let prop = obj[key];
                    if (Array.isArray(prop)) {
                        if (prop.length > 0) {
                            for (let i = 0; i < prop.length; i++) {
                                let arrayProp = prop[i];
                                let child = createTree(arrayProp, nameProperty, ignoreProperties);
                                let edge = new Edge(key, child);
                                node.outgoing.push(edge);
                            }
                        }
                    } else {
                        let child = createTree(prop, nameProperty, ignoreProperties);
                        let edge = new Edge(key, child);
                        node.outgoing.push(edge);
                    }
                }
            }
        }
        return node;
    };


    exports.Node = Node;
    exports.Edge = Edge;
    exports.createTree = createTree;

})();