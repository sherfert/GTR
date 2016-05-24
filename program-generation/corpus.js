(function () {
    "use strict";

    var corpus = {
        size: 0,
        get() {
            return this.size;
        },
        set(s) {
            this.size = s;
        }
    };

    function getCorpusSize() {
        return corpus.get();
    }

    function setCorpusSize(size) {
        corpus.set(size);
    }

    exports.setCorpusSize = setCorpusSize;
    exports.getCorpusSize = getCorpusSize;
})();
