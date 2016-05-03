// Author: Michael Pradel

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

        },
        nbNodes:function() {
            var sum = 1;
            for (var i = 0; i < this.outgoing.length; i++) {
                var outgoing = this.outgoing[i];
                var target = outgoing.target;
                sum += target.nbNodes();
            }
            return sum;
        }
    };

    function Edge(label, target) {
        this.label = label;
        this.target = target;
    }


    exports.Node = Node;
    exports.Edge = Edge;

})();