// Author: Michael Pradel

(function() {

    function Context(nodePath, edgePath) {
        this.nodePath = nodePath;
        this.edgePath = edgePath;

        // caching of set of labels in node path (for faster access)
        this._ancestorLabelSet = undefined;
    }

    Context.prototype = {
        parent:function() {
            if (this.nodePath.length > 1)
                return this.nodePath[this.nodePath.length - 2];
        },
        grandParent:function() {
            if (this.nodePath.length > 2)
                return this.nodePath[this.nodePath.length - 3];
        },
        lastEdge:function() {
            if (this.edgePath.length > 0)
                return this.edgePath[this.edgePath.length - 1];
        },
        secondToLastEdge:function() {
            if (this.edgePath.length > 1)
                return this.edgePath[this.edgePath.length - 2];
        },
        ancestorsLabelSet:function () {
            if (this._ancestorLabelSet === undefined) {
                // initialize cache
                this._ancestorLabelSet = new Set();
                var hash = 0;
                for (var i = 1; i < this.nodePath.length - 1; i++) {  // TODO include root or not?
                    var node = this.nodePath[i];
                    var label = node.label;
                    this._ancestorLabelSet.add(label);
                    hash = ((hash << 5) - hash) + (label.charCodeAt(0) + label.charCodeAt(label.length - 1));
                    hash = hash & hash; // convert to 32-bit int
                }
                this._ancestorLabelSet.hash = hash;
            }
            return this._ancestorLabelSet;
        }
    };

    exports.Context = Context;

})();