// Author: Michael Pradel

(function() {

    const fileName = "./preComputedSubsets.json";
    const fs = require("fs");

    var arraySizeToSubsetSizeToIndexes;

    var maxSubsetSize = 10;
    var maxArraySize = 30;

    function storeIntoFile() {
        fs.writeFileSync(fileName, JSON.stringify(arraySizeToSubsetSizeToIndexes, 0, 2));
    }

    function loadFromFile() {
        arraySizeToSubsetSizeToIndexes = JSON.parse(fs.readFileSync(fileName));
    }

    function preCompute(maxArraySize) {
        arraySizeToSubsetSizeToIndexes = {};
        for (var arraySize = 2; arraySize <= maxArraySize; arraySize++) {
            var subsetSizeToIndexes = {};
            arraySizeToSubsetSizeToIndexes[arraySize] = subsetSizeToIndexes;

            var array = [];
            for (var i = 0; i < arraySize; i++) {
                array.push(i);
            }

            var max = Math.min(arraySize, maxSubsetSize);
            for (var subsetSize = 1; subsetSize <= max; subsetSize++) {
                var subsets = slowSubsets(array, subsetSize);
                var allIndexes = [];
                for (var subset of subsets.values()) {
                    var indexes = [];
                    for (var item of subset.values()) {
                        indexes.push(item);
                    }
                    allIndexes.push(indexes);
                }
                subsetSizeToIndexes[subsetSize] = allIndexes;
            }
        }
    }

    function subsets(itemArray, subsetSize) {
        if (subsetSize > maxSubsetSize) subsetSize = maxSubsetSize;
        if (itemArray.length > maxArraySize) return new Set();

        if (arraySizeToSubsetSizeToIndexes === undefined) loadFromFile();
        if (arraySizeToSubsetSizeToIndexes) {
            var subsetSizeToIndexes = arraySizeToSubsetSizeToIndexes[itemArray.length];
            if (subsetSizeToIndexes) {
                var allIndexes = subsetSizeToIndexes[subsetSize];
                if (allIndexes) {
                    var result = new Set(); // set of sets
                    for (var i = 0; i < allIndexes.length; i++) {
                        var indexes = allIndexes[i];
                        var newSubset = new Set();
                        for (var j = 0; j < indexes.length; j++) {
                            var index = indexes[j];
                            newSubset.add(itemArray[index]);
                        }
                        result.add(newSubset);
                    }
                    return result;
                }
            }
        }
        return slowSubsets(itemArray, subsetSize);
    }

    function SubsetsWorkListItem(currentArray, indexToExtendFrom) {
        this.currentArray = currentArray;
        this.indexToExtendFrom = indexToExtendFrom;
    }

    function slowSubsets(itemArray, subsetSize) {
        result = new Set();
        var workList = [];
        // initialize with subsets of size 1
        for (var i = 0; i < itemArray.length; i++) {
            var item = itemArray[i];
            if (i < itemArray.length) {
                workList.push(new SubsetsWorkListItem([item], i + 1));
            }
        }
        if (subsetSize > 1) {
            while (workList.length > 0) {
                var workItem = workList.pop();
                for (var i = workItem.indexToExtendFrom; i < itemArray.length; i++) {
                    var newItem = itemArray[i];
                    var extendedArray = workItem.currentArray.slice(0);
                    extendedArray.push(newItem);
                    if (extendedArray.length === subsetSize) {
                        result.add(new Set(extendedArray))
                    } else {
                        workList.push(new SubsetsWorkListItem(extendedArray, i + 1));
                    }
                }
            }
        } else {
            for (var i = 0; i < workList.length; i++) {
                var workItem = workList[i];
                result.add(new Set(workItem.currentArray));
            }
        }
        return result;
    }

    exports.subsets = slowSubsets;

    //preCompute(maxArraySize);
    //storeIntoFile();

})();