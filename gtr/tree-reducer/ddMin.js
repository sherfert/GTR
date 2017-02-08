// Author: Satia Herfert

(function() {
    // A map that serves as a cache for ddmin
    var cache;
    
    /**
     * Implements a generic ddmin algorithm. The input needs to be of type Input
     * or a descendant.
     * @param  {Input} input    The Input to minimize
     * @param  {function(object): string} test  a test function that evaluates a
     *                                    predicate, given the code and returns "fail" if the test fails, "pass" if
     *                                    the test passes, and "?" if the test is undecidable. This function should
     *                                    take objects of the same type as the constructor of the Input subclass
     *                                    of the input instance passed.
     * @return {Input}       The minimized input.
     */
    function ddmin(input, test) {
        // Empty the cache
        cache = {};
        //console.log("DDmin start");
        return ddmin2(input, 2, test);
    }

    /**
     * The implementation of ddmin with a current granularity.
     * @param  {Input} input The Input to minimize
     * @param  {number} n     the granularity
     * @param  {function(object): string} test  s.a.
     * @return {Input}       The minimized input.
     */
    function ddmin2(input, n, test) {
        var len = input.length;
        //console.log("Current input length: " + len);
        if(len < 1) {
            // No further minimization possible
            //console.log("Return' subset: " + input.activeTokens);
            return input;
        }

        // Set the granularity on the input
        input.granularity = n;

        // Try reducing to subset
        for(let i = 0; i < n; i++) {
            // Obtain subset
            let subset = input.getSubset(i);
            let result;
            // Check the cache
            let key = subset.activeTokens.toString();
            if(cache.hasOwnProperty(key)) {
                //console.log("Using cached value");
                result = cache[key];
            } else {
                //console.log("Testing subset: " + key);
                // No cached value available
                result = test(subset.currentCode);
                // Cache the result
                cache[key] = result;
            }

            // console.log("Testing result: " + result);
            // Test the subset
            if(result == "fail") {
                if(subset.length < len) {
                    // console.log("Continue with subset and granularity " + 2
                    //     + " and length " + subset.length);
                    // Subset is smaller
                    return ddmin2(subset, 2, test);
                }
            }
        }

        // Try reducing to complement
        for(let i = 0; i < n; i++) {
            // Obtain subset
            let subset = input.getComplement(i);
            let result;
            // Check the cache
            let key = subset.activeTokens.toString();
            if(cache.hasOwnProperty(key)) {
                //console.log("Using cached value");
                result = cache[key];
            } else {
                // console.log("Testing complm: " + key);
                // No cached value available
                result = test(subset.currentCode);
                // Cache the result
                cache[key] = result;
            }

            //console.log("Testing result: " + result);
            // Test the subset
            if(result == "fail") {

                if(subset.length < len) {
                    // console.log("Continue with complement and granularity " + Math.max(n - 1, 2)
                    // + " and length " + subset.length);
                    // Complement is smaller
                    return ddmin2(subset, Math.max(n - 1, 2), test);
                }
            }
        }

        if(n < len) {
            // Increase granularity
            // console.log("Increasing granularity to " + Math.min(len, 2 * n));
            return ddmin2(input, Math.min(len, 2 * n), test);
        }

        // Otherwise done
        //console.log("Return' subset: " + input.activeTokens);
        return input;
    }
    
    exports.ddmin = ddmin;

})();