// Author: Satia Herfert

(function() {

    /**
     * Given a test function (an oracle) for trees, this
     * function returns a cached version of that
     * test function.
     *
     * DDMin itself has a cache built-in, but if the cache needs to persist across
     * different invocations of DDMin, this cache becomes necessary.
     *
     * @param {Function} test the oracle
     * @returns {Function} the cached oracle
     */
    function cachedTest(test) {
        var cache = {};
        var result;

        return function(tree) {
            let key = tree.hash();
            if(cache.hasOwnProperty(key)) {
                //console.log("Using tree cached value");
                result = cache[key];
            } else {
                // No cached value available
                result = test(tree);
                // Cache the result
                cache[key] = result;
            }
            return result;
        };
    }

    exports.cachedTest = cachedTest;

})();