// Author: Michael Pradel, Jibesh Patra

(function () {

    var fs = require("fs");
    var loTrees = require("./../labeledOrderedTrees");
    var child_process = require('child_process');

    var config = require("./../config").config;

    var trees = [];
    var currentIndex = -1;

    var ignoredASTProps = {
        type: true,
        raw: true,
        sourceType: true
    };

    function codeToTree(code) {
        var result = child_process.spawnSync("python", ["parse.py"], {
            encoding: 'utf8',
            cwd: './tree-reducer/input/python',
            input: code,
            //shell: true,
            //timeout: 500,
            //killSignal: 'SIGKILL'
        });
        var json = result.stdout;
        var obj = JSON.parse(json);
        return loTrees.createTree(obj, "ast_type", ["col_offset", "lineno"]);
    }


    /**
     * Initialize this tree provider for the corpus learning process
     */
    function init() {
        var filepath = config.corpusDir;
        var files = fs.readdirSync(filepath);
        const maxFiles = config.maxNoOfFilesToLearnFrom;
        /* Selecting only top number of files to learn from */
        if (maxFiles > 0) {
            files = files.slice(0, maxFiles);
        }
        for (var i = 0; i < files.length; i++) {
            var file = filepath + "/" + files[i];
            if (!fs.lstatSync(file).isDirectory()) { // Skip directories

                var content = fs.readFileSync(file);
                try {
                    var tree = codeToTree(content);
                } catch (e) {
                    continue; // ignore files with errors
                }
                trees.push(tree);
            }
        }
    }

    /**
     * Return the next tree during the corpus learning process
     */
    function nextTree() {
        currentIndex++;
        if (currentIndex < trees.length) {
            return trees[currentIndex];
        }
    }

    exports.codeToTree = codeToTree;
    exports.init = init;
    exports.nextTree = nextTree;

})();