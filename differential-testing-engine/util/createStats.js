// Author: Satia Herfert

(function () {
    var jsonfile = require('jsonfile');
    var config = jsonfile.readFileSync("config.json");
    var codeDir = config.reduceCodeDirectory;

    var createStats = require("../../gtr/tree-reducer/createStats").createStats;

    createStats(codeDir);
})();
