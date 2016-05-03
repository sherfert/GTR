/**
 * Created by Jibesh Patra on 14 March, 2016.
 *
 */

(function () {
    "use strict";
    /**
     * Writes the inferred rules inferences to disk. For each rule, it takes data in form of Map, Set or Array and converts
     * them to a object. Finally it dumps this object in form JSON
     * @param {string} fileName - Name of the file
     * @param {string} currentRuleInferences - An object, whose properties are contains inference data for each rule
     * */
    function getFromDisk(fileName) {
        let toMap = require('./util').JSONtoMap;
        const jsonfile = require('jsonfile');
        const fs = require('fs');
        let currentRuleInferences = {};

        if (!fs.existsSync(fileName)) {
            console.error("File not found");
        } else {
            /* FIXME: Correctly convert to internal representation of data.
             *  It is straightforward to convert to a Map() type, but how to convert the JSON object to
             *  internal representations like Histogram(), TwoKeysList() etc.
             *  Do we also keep this internal representation name while saving the file?
             * */
            var data = jsonfile.readFileSync(fileName);
            for (var dataStructure in data) {
                if (data.hasOwnProperty(dataStructure)) {
                    let convertedData = toMap(data[dataStructure]);
                    currentRuleInferences[dataStructure] = convertedData;
                }
            }
        }
        return currentRuleInferences;
    }

    exports.getFromDisk = getFromDisk;
})();