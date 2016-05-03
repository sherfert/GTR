/**
 * Created by Jibesh Patra on 11 March, 2016.
 * Time: 18:06
 */

(function () {
    "use strict";
    /**
     * Writes the inferred rules inferences to disk. For each rule, it takes data in form of Map, Set or Array and converts
     * them to a object. Finally it dumps this object in form JSON
     * @param {string} fileName - Name of the file
     * @param {string} currentRuleInferences - An object, whose properties are contains inference data for each rule
     * */
    function writeToDisk(fileName, currentRuleInferences) {
        let util = require('./util');
        let writableData = {};

        for (let dataStructure in currentRuleInferences) {
            if (currentRuleInferences.hasOwnProperty(dataStructure)) {
                /* Check if instanceof an internal data-structure or built-in Map */
                let mapData = currentRuleInferences[dataStructure] instanceof Set || currentRuleInferences[dataStructure] instanceof Map ? currentRuleInferences[dataStructure] : currentRuleInferences[dataStructure].map;
                writableData[dataStructure] = util.toJSON(mapData);
            }
        }
        util.writeToJSONfile(fileName, writableData);
    }

    exports.writeToDisk = writeToDisk;
})();