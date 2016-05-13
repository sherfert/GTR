// Author: Michael Pradel, Satia Herfert
// TODO comment file
(function() {

    var util = require("./util");

    function Node(label) {
        util.assert(typeof label === "string", typeof label);
        this.label = label;
        this.outgoing = [];
    }

    Node.prototype = {
        toString:function() {
            return this.toPrettyString(0);
        },
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
        nbNodes:function() {
            var sum = 1;
            for (var i = 0; i < this.outgoing.length; i++) {
                var outgoing = this.outgoing[i];
                var target = outgoing.target;
                sum += target.nbNodes();
            }
            return sum;
        },
        preorder:function(func) {
            func(this);
            for (var i = 0; i < this.outgoing.length; i++) {
                var outgoing = this.outgoing[i];
                var target = outgoing.target;
                target.preorder(func);
            }
        },
        postorder:function(func) {
            for (var i = 0; i < this.outgoing.length; i++) {
                var outgoing = this.outgoing[i];
                var target = outgoing.target;
                target.postorder(func);
            }
            func(this);
        },
        deepCopy:function() {
            var node = new Node(this.label);
            for (var i = 0; i < this.outgoing.length; i++) {
                var oldEdge = this.outgoing[i];
                var newEdge = oldEdge.deepCopy();
                node.outgoing.push(newEdge);
            }
            return node;
        },
        attachIncomingEdges:function() {
            for (var i = 0; i < this.outgoing.length; i++) {
                var outgoing = this.outgoing[i];
                var target = outgoing.target;
                target.incoming = new Edge(outgoing.label, this);
                target.attachIncomingEdges();
            }
        }
    };

    function Edge(label, target) {
        this.label = label;
        this.target = target;
    }

    Edge.prototype = {
        deepCopy: function () {
            return new Edge(this.label, this.target.deepCopy());
        }
    };


    exports.Node = Node;
    exports.Edge = Edge;

})();