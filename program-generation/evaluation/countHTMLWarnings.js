// Author: Michael Pradel

(function() {

    var fs = require("fs");
    var w3cjs = require("w3cjs");

    //var baseDir = "./corpusForEvaluation/html/";
    var baseDir = "./resultsEvaluation/html/generatedPrograms/";

    var files = fs.readdirSync(baseDir);

    console.log(new Date());
    console.log("Counting HTML validation warnings in " + baseDir);

    for (var i = 0; i < files.length; i++) {
        var fileName = files[i];
        if (fileName.endsWith(".html")) {
            (function(fileName) {
                w3cjs.validate({
                    file:baseDir + "/" + fileName,
                    output:"json",
                    callback:function(result) {
                        console.log("===========================\n" + fileName);
                        var messages = result.messages;
                        if (messages !== undefined) {
                            var errors = 0;
                            for (var i = 0; i < messages.length; i++) {
                                var msg = messages[i];
                                if (msg.type === "error") {
                                    errors++;
                                    console.log(msg);
                                }
                            }
                            console.log("SUMMARY: " + fileName + ", " + errors);
                        } else {
                            console.log("SUMMARY: " + fileName + ", messages missing!");
                        }

                    }
                });
            })(fileName);

        }
    }

})();