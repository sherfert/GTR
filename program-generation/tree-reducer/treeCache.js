// Author: Satia Herfert

(function() {

    function cachedTest(test) {
        var cache = {};

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