// Author: Michael Pradel, Jibesh Patra

(function () {

    var fs = require("fs");
    var loTrees = require("./../labeledOrderedTrees");
    var child_process = require('child_process');

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
            shell: true,
            timeout: 500,
            killSignal: 'SIGKILL'
        });
        var json = result.stdout;
        var obj = JSON.parse(json);
        return loTrees.createTree(obj, "ast_type", ["col_offset", "lineno"]);
    }

    exports.codeToTree = codeToTree;

})();