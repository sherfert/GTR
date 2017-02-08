// Author: Satia Herfert

(function () {

    var fs = require("fs");
    var loTrees = require("./../labeledOrderedTrees");
    var child_process = require('child_process');
    var singleLinelog = require('single-line-log').stdout;

    var config = require("./../config").config;

    var ignoredASTProps = {
        type: true,
        raw: true,
        sourceType: true
    };

    var fileNames = [];
    var currentIndex = -1;

    /**
     * Initialize this tree provider for the corpus learning process
     */
    function init() {
        fileNames = [];
        currentIndex = -1;

        var filepath = config.corpusDir;
        var files = fs.readdirSync(filepath);
        const maxFiles = config.maxNoOfFilesToLearnFrom;
        if (maxFiles > 0) {
            files = files.slice(0, maxFiles);
        }
        for (var i = 0; i < files.length; i++) {
            var file = filepath + "/" + files[i];
            if (!fs.lstatSync(file).isDirectory()) { // Skip directories

                fileNames.push(file);
            }
        }

        console.log("Found " + fileNames.length + " files.");
    }

    function codeToTree(code) {
        var result = child_process.spawnSync("python2.7", ["parse.py"], {
            encoding: 'utf8',
            cwd: '../program-generation/py-ast',
            input: code,
            //shell: true,
            //timeout: 500,
            //killSignal: 'SIGKILL'
        });
        var json = result.stdout;
        var obj = JSON.parse(json);
        var t = loTrees.createTree(obj, "ast_type", ["col_offset", "lineno"]);
        return t;
    }

    /**
     * Return the next tree during the corpus learning process
     */
    function nextTree() {
        while (currentIndex < fileNames.length - 1) {
            currentIndex++;
            singleLinelog("Remaining >> " + parseInt(((fileNames.length - currentIndex) / fileNames.length) * 100) +
                "%  Processing: " + fileNames[currentIndex]);
            var content = fs.readFileSync(fileNames[currentIndex]);
            try {
                return codeToTree(content);
            } catch (e) {
                // Will repeat while loop until a file can be parsed successfully
            }
        }
    }

    exports.init = init;
    exports.nextTree = nextTree;
    exports.codeToTree = codeToTree;

})();