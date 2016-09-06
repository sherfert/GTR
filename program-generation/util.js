// Author: Michael Pradel, Jibesh Patra

(function () {
    "use strict";

    var nodeUtil = require("util");
    var efficientSubsets = require("./efficientSubsets");
    var fs = require('fs');
    var jsonfile = require('jsonfile');
    var config = require("./config").config;

    function assert(value, msg) {
        if (!value) throw new Error(msg || "Assertion failed");
    }

    function Histogram() {
        this.map = new Map();
    }

    /* TODO: Write the same using Object.defineProperties() to make the properties non-enumerable. --Jibesh */
    Histogram.prototype = {
        increment: function (key) {
            var frequency = this.map.get(key) || 0;
            frequency++;
            this.map.set(key, frequency);
        },
        get: function (key) {
            var value = this.map.get(key);
            if (value) return value;
            else return 0;
        },
        has: function (key) {
            return this.map.has(key);
        },
        size: function () {
            return this.map.size;
        },
        filter: function (filterFct) {
            var result = new Histogram();
            for (var key of this.map.keys()) {
                if (filterFct(key)) {
                    result.map.set(key, this.map.get(key));
                }
            }
            return result;
        }
    };

    function TwoKeysHistogram() {
        this.map = new Map();
    }

    function FourKeysLists() {
        this.map = new Map();
    }

    FourKeysLists.prototype = {
        append: function (key1, key2, key3, key4, value) {
            var innerMap = this.map.get(key1) || new Map();
            var inner_innerMap = innerMap.get(key2) || new Map();
            var inner_inner_innerMap = inner_innerMap.get(key3) || new Map();
            var inner_set = inner_inner_innerMap.get(key4) || new Set();
            inner_set.add(value);

            inner_inner_innerMap.set(key4, inner_set);
            inner_innerMap.set(key3, inner_inner_innerMap);
            innerMap.set(key2, inner_innerMap);
            this.map.set(key1, innerMap);
        }
    };

    TwoKeysHistogram.prototype = {
        increment: function (key1, key2) {
            var innerMap = this.map.get(key1) || new Map();
            var frequency = innerMap.get(key2) || 0;
            frequency++;
            innerMap.set(key2, frequency);
            this.map.set(key1, innerMap);
        }
    };

    function TwoKeysList() {
        this.map = new Map();
    }

    TwoKeysList.prototype = {
        append: function (key1, key2, value) {
            var innerMap = this.map.get(key1) || new Map();
            var list = innerMap.get(key2) || [];
            list.push(value);
            innerMap.set(key2, list);
            this.map.set(key1, innerMap);
        },
        get: function (key1, key2) {
            var innerMap = this.map.get(key1);
            if (innerMap) {
                return innerMap.get(key2);
            }
        }
    };

    function intersect(set1, set2) {
        if (set2.size < set1.size) return intersect(set2, set1);

        var result = new Set();
        for (var item of set1.values()) {
            if (set2.has(item))
                result.add(item)
        }
        return result;
    }

    function sameSets(set1, set2) {
        assert(set1 instanceof Set);
        assert(set2 instanceof Set);
        if (set1.size !== set2.size) return false;
        for (var element1 of set1.values()) {
            if (!set2.has(element1)) return false;
        }
        return true;
    }

    function print(x) {
        console.log(nodeUtil.inspect(x, {depth: null}));
    }


    function subsets(items, subsetSize) {
        assert(items instanceof Set);
        assert(typeof subsetSize === "number" && subsetSize > 0 && subsetSize <= items.size);

        var itemArray = Array.from(items);
        return efficientSubsets.subsets(itemArray, subsetSize);
    }

    function removeAllFromSet(baseSet, setToRemove) {
        for (var x of setToRemove.values()) {
            baseSet.delete(x);
        }
    }

    function addAllToSet(baseSet, setToAdd) {
        for (var x of setToAdd.values()) {
            baseSet.add(x);
        }
    }

    /* Checks if a particular value is undefined or at-least one element of an array is undefined */
    function isDefined(val) {
        if (Array.isArray(val)) {
            var def = true;
            val.forEach(function (eachValue) {
                if (eachValue === undefined) {
                    def = false;
                }
            });
            return def;
        }
        else {
            return val !== undefined;
        }
    }

    /* Get the complete path of a directory */
    function getCompletePath(directory) {
        "use strict";
        let currentDirectory = process.cwd();
        return currentDirectory + "/" + directory;
    }

    function toJSON(map) {
        return convertToStorableFormat(map);
    }

    function JSONtoMap(json) {
        return convertObjectToMap(json);
    }

    /** The idea is to convert a map to an object while writing to disk doing the opposite while reading from disk
     *  TODO This implementation works only if an object, array, or Set does not have a nested Set/Map. It only
     *  iterates into the children for Maps.
     */
    function convertToStorableFormat(inferredData) {
        if (inferredData instanceof Set) {
            return [...inferredData];
        } else if(inferredData instanceof  Map) {
            const obj = Object.create(null);
            for (let [key, value] of inferredData) {
                obj[key] = convertToStorableFormat(value);
            }
            return obj;
        } else {
            // Hopefully we are dealing with an object or array
            return inferredData;
        }
    }

    function writeToJSONfile(fileName, writableData) {
        try {
            jsonfile.writeFileSync(fileName, writableData, {spaces: 2});
        } catch (err) {
            console.log("Could not write to JSON file " + err);
        }
    }

    function getFileSizeinKB(file) {
        var stats = fs.statSync(file);
        var fileSizeInBytes = stats["size"];
        return fileSizeInBytes/1024;
    }

    function convertObjectToMap(obj) {
        const strMap = new Histogram();
        for (const k of Object.keys(obj)) {

            let value = obj[k] instanceof Object ? convertToStorableFormat(obj[k]) : obj[k];
            /*if (Array.isArray(obj[k])) {

             }*/
            strMap.increment(k);
        }
        return strMap;
    }

    function writelog(filename, log) {
        fs.appendFileSync(process.cwd() + "/" + filename, log);
    }

    function checkWorkingDirectories() {

        var mandatory_directories = [config.corpusDir/*, config.differentialTestingDirectory*/];
        mandatory_directories.forEach(function (dir) {
            if (!fs.existsSync(dir)) {
                console.log("Either corpus or the differential testing directory is not correctly set. \nExiting....");
                process.exit(0);
            }
        });

        try {
            var directories = [config.resultsDir, config.inferredKnowledgeDir, config.generatedProgramsDir,
                config.invalidASTsDir, config.invalidProgramsDir, config.correctSyntaxProgramsDir, config.statsandPlotsDir];
            directories.forEach(function (dir) {
                if (!fs.existsSync(dir)) { // If the directory does not exist, create it
                    fs.mkdirSync(dir);
                }
            });
        } catch (err) {
            console.log("Could not create working directories. " + err + "\nExiting...");
            process.exit(0);
        }

    }

    exports.assert = assert;
    exports.print = print;

    exports.Histogram = Histogram;
    exports.TwoKeysHistogram = TwoKeysHistogram;
    exports.TwoKeysList = TwoKeysList;
    exports.FourKeysLists = FourKeysLists;

    exports.intersect = intersect;
    exports.subsets = subsets;
    exports.removeAllFromSet = removeAllFromSet;
    exports.addAllToSet = addAllToSet;

    exports.isDefined = isDefined;
    exports.getCompletePath = getCompletePath;
    exports.toJSON = toJSON;
    exports.JSONtoMap = JSONtoMap;
    exports.writelog = writelog;
    exports.checkWorkingDirectories = checkWorkingDirectories;
    exports.writeToJSONfile = writeToJSONfile;

    exports.getFileSizeinKB = getFileSizeinKB;
})();