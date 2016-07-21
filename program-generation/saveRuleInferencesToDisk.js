/**
 * Created by Jibesh Patra on 11 March, 2016.
 * Time: 18:06
 */

(function () {
    "use strict";
    /**
     * Writes the inferred rule inferences to disk. For each rule, it takes data in form of Map, Set or Array and converts
     * them to an object. Finally it dumps this object in JSON form
     * @param {string} fileName - Name of the file
     * @param {object} currentRuleInferences - An object, whose properties contain inference data for each rule
     * */
    function writeToDisk(fileName, currentRuleInferences) {
        let util = require('./util');
        let writableData = {};

        for (let dataStructure in currentRuleInferences) {
            if (currentRuleInferences.hasOwnProperty(dataStructure)) {
                // Use the Map of Histograms and otherwise the object itself
                let mapData = currentRuleInferences[dataStructure].map instanceof Map ?
                              currentRuleInferences[dataStructure].map : currentRuleInferences[dataStructure];
                // convert to JSON
                writableData[dataStructure] = util.toJSON(mapData);
            }
        }
        util.writeToJSONfile(fileName, writableData);
    }

    exports.writeToDisk = writeToDisk;
})();