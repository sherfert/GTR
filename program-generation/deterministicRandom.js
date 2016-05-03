// Author: Michael Pradel

(function () {

    var config = require("./config").config;
    var seedRandom = require("seedrandom");
    var seed;
    var myRandom;
    var util = require("./util");

    function setSeed() {
        if (!config.useRandomSeed) {
            seed = Math.trunc(config.fixedSeed);
            myRandom = seedRandom(seed);
        } else {
            /*
            * Sets Math.random to an ARC4-based PRNG that is autoseeded using the current time, dom state,
            * and other accumulated local entropy. The generated seed string is returned.
            * */
            Math.seedrandom();
            seed = Math.trunc(Math.random() * 100000000000000);
            myRandom = seedRandom(seed);
        }
    }

    function pickByFrequency(histogram) {
        util.assert(histogram instanceof util.Histogram);
        var keys = histogram.map.keys();
        var total = 0;
        for (var key of histogram.map.keys()) {
            total += histogram.get(key);
        }
        var pickedValue = myRandom() * total;
        var sum = 0;
        for (var key of histogram.map.keys()) {
            sum += histogram.get(key);
            if (sum > pickedValue) {
                return key;
            }
        }
        return key;
    }

    function pickArrayElement(array) {
        if (array.length > 0) {
            var index = Math.trunc(myRandom() * array.length);
            return array[index];
        }
    }

    function pickFromSet(set) {
        return pickArrayElement(Array.from(set));
    }

    function random() {
        return myRandom();
    }

    function getSeed() {
        return seed;
    }

    exports.getSeed = getSeed;
    exports.setSeed = setSeed;
    exports.random = random;
    exports.pickByFrequency = pickByFrequency;
    exports.pickArrayElement = pickArrayElement;
    exports.pickFromSet = pickFromSet;

})();